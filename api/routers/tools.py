import hashlib
import json
import logging
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from api.db import get_db
from api.dependencies import get_current_user
from api.models.tool import SandboxStatus, Tag, Tool, ToolStatus, ToolVersion, tool_tags
from api.models.user import User
from api.schemas.tools import ToolDetail, ToolListResponse
from api.services.cache import cache_delete_pattern, cache_get, cache_set
from api.services.rate_limit import check_rate_limit
from api.services.sandbox import run_sandbox
from api.services.storage import presigned_download_url, upload_tarball

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tools", tags=["tools"])


def _run_sandbox_and_update(tool_version_id: str, s3_key: str, mcp_schema: dict, db: Session):
    version = db.query(ToolVersion).filter(ToolVersion.id == tool_version_id).first()
    if not version:
        return
    version.sandbox_status = SandboxStatus.running
    db.commit()

    result = run_sandbox(s3_key, mcp_schema)

    version.sandbox_status = SandboxStatus.passed if result.passed else SandboxStatus.failed
    version.sandbox_log = result.log

    if result.passed:
        tool = db.query(Tool).filter(Tool.id == version.tool_id).first()
        if tool:
            tool.status = ToolStatus.active
            tool.latest_version = version.version

    db.commit()


@router.get("", response_model=ToolListResponse)
def list_tools(
    q: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    sort: str = Query("installs", regex="^(installs|rating|newest)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    cache_key = f"tools:search:{q}:{tag}:{sort}:{page}:{limit}"
    cached = cache_get(cache_key)
    if cached:
        return ToolListResponse(**cached)

    query = db.query(Tool).filter(Tool.status == ToolStatus.active)

    if tag:
        query = query.join(tool_tags).join(Tag).filter(Tag.slug == tag)

    if q:
        ts_query = func.plainto_tsquery("english", q)
        ts_vector = func.to_tsvector("english", Tool.name + " " + Tool.description)
        query = query.filter(
            or_(
                ts_vector.op("@@")(ts_query),
                Tool.name.ilike(f"%{q}%"),
                Tool.description.ilike(f"%{q}%"),
            )
        )

    if sort == "installs":
        query = query.order_by(Tool.install_count.desc())
    elif sort == "rating":
        query = query.order_by(Tool.avg_rating.desc().nullslast())
    else:
        query = query.order_by(Tool.created_at.desc())

    total = query.count()
    tools = query.offset((page - 1) * limit).limit(limit).all()
    result = ToolListResponse(tools=tools, total=total, page=page, limit=limit)
    cache_set(cache_key, result.model_dump(), ttl=300)
    return result


@router.get("/tags", tags=["tags"])
def list_tags(db: Session = Depends(get_db)):
    cache_key = "tools:tags:all"
    cached = cache_get(cache_key)
    if cached:
        return cached
    tags = db.query(Tag).order_by(Tag.name).all()
    result = [{"name": t.name, "slug": t.slug} for t in tags]
    cache_set(cache_key, result, ttl=3600)
    return result


@router.get("/{slug}", response_model=ToolDetail)
def get_tool(slug: str, db: Session = Depends(get_db)):
    tool = db.query(Tool).filter(Tool.slug == slug).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool


@router.get("/{slug}/latest")
def get_latest_manifest(slug: str, db: Session = Depends(get_db)):
    tool = db.query(Tool).filter(Tool.slug == slug, Tool.status == ToolStatus.active).first()
    if not tool or not tool.latest_version:
        raise HTTPException(status_code=404, detail="Tool not found or not active")

    version = (
        db.query(ToolVersion).filter(ToolVersion.tool_id == tool.id, ToolVersion.version == tool.latest_version).first()
    )
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    download_url = presigned_download_url(version.s3_key) if version.s3_key else None
    return {
        "slug": tool.slug,
        "version": version.version,
        "mcp_schema": version.mcp_schema,
        "checksum": version.checksum,
        "download_url": download_url,
    }


@router.get("/{slug}/{version}")
def get_version_manifest(slug: str, version: str, db: Session = Depends(get_db)):
    tool = db.query(Tool).filter(Tool.slug == slug).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    tv = db.query(ToolVersion).filter(ToolVersion.tool_id == tool.id, ToolVersion.version == version).first()
    if not tv:
        raise HTTPException(status_code=404, detail="Version not found")

    download_url = presigned_download_url(tv.s3_key) if tv.s3_key else None
    return {
        "slug": tool.slug,
        "version": tv.version,
        "mcp_schema": tv.mcp_schema,
        "checksum": tv.checksum,
        "download_url": download_url,
    }


@router.post("", response_model=ToolDetail, status_code=201)
async def publish_tool(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    slug: str = Form(...),
    description: str = Form(...),
    version: str = Form(...),
    mcp_schema: str = Form(...),
    tarball: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    check_rate_limit(f"publish:{user.id}", max_requests=10, window_seconds=3600)

    if db.query(Tool).filter(Tool.slug == slug).first():
        raise HTTPException(status_code=409, detail="Slug already taken")

    try:
        schema = json.loads(mcp_schema)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="mcp_schema must be valid JSON")

    tarball_data = await tarball.read()
    checksum = hashlib.sha256(tarball_data).hexdigest()
    s3_key = f"tools/{slug}/{version}/tool.tar.gz"
    upload_tarball(s3_key, tarball_data)

    tool = Tool(author_id=user.id, name=name, slug=slug, description=description, status=ToolStatus.draft)
    db.add(tool)
    db.flush()

    tv = ToolVersion(
        tool_id=tool.id,
        version=version,
        s3_key=s3_key,
        checksum=checksum,
        mcp_schema=schema,
        sandbox_status=SandboxStatus.pending,
    )
    db.add(tv)
    db.commit()
    db.refresh(tool)

    cache_delete_pattern("tools:search:*")
    background_tasks.add_task(_run_sandbox_and_update, str(tv.id), s3_key, schema, db)
    return tool


@router.post("/{slug}/versions", status_code=201)
async def publish_version(
    slug: str,
    background_tasks: BackgroundTasks,
    version: str = Form(...),
    mcp_schema: str = Form(...),
    tarball: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tool = db.query(Tool).filter(Tool.slug == slug, Tool.author_id == user.id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found or not yours")

    if db.query(ToolVersion).filter(ToolVersion.tool_id == tool.id, ToolVersion.version == version).first():
        raise HTTPException(status_code=409, detail="Version already exists")

    try:
        schema = json.loads(mcp_schema)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="mcp_schema must be valid JSON")

    tarball_data = await tarball.read()
    checksum = hashlib.sha256(tarball_data).hexdigest()
    s3_key = f"tools/{slug}/{version}/tool.tar.gz"
    upload_tarball(s3_key, tarball_data)

    tv = ToolVersion(
        tool_id=tool.id,
        version=version,
        s3_key=s3_key,
        checksum=checksum,
        mcp_schema=schema,
        sandbox_status=SandboxStatus.pending,
    )
    db.add(tv)
    db.commit()

    cache_delete_pattern("tools:search:*")
    background_tasks.add_task(_run_sandbox_and_update, str(tv.id), s3_key, schema, db)
    return {"message": f"Version {version} submitted for validation"}


@router.post("/seed", response_model=ToolDetail, status_code=201)
def seed_tool(
    name: str = Form(...),
    slug: str = Form(...),
    description: str = Form(...),
    version: str = Form("1.0.0"),
    mcp_schema: str = Form("{}"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if db.query(Tool).filter(Tool.slug == slug).first():
        raise HTTPException(status_code=409, detail="Slug already taken")
    try:
        schema = json.loads(mcp_schema)
    except json.JSONDecodeError:
        schema = {}
    tool = Tool(
        author_id=user.id, name=name, slug=slug,
        description=description, status=ToolStatus.active, latest_version=version,
    )
    db.add(tool)
    db.flush()
    tv = ToolVersion(
        tool_id=tool.id, version=version,
        mcp_schema=schema, sandbox_status=SandboxStatus.passed,
    )
    db.add(tv)
    db.commit()
    db.refresh(tool)
    cache_delete_pattern("tools:search:*")
    return tool


@router.delete("/{slug}", status_code=204)
def deprecate_tool(slug: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tool = db.query(Tool).filter(Tool.slug == slug, Tool.author_id == user.id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found or not yours")
    tool.status = ToolStatus.deprecated
    db.commit()
    cache_delete_pattern("tools:search:*")
