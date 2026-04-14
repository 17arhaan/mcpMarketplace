import hashlib
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, BackgroundTasks
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from api.db import get_db
from api.dependencies import get_current_user
from api.models.tool import Tool, ToolVersion, ToolStatus, SandboxStatus
from api.models.user import User
from api.schemas.tools import ToolOut, ToolDetail, ToolListResponse, ToolVersionOut
from api.services.storage import upload_tarball, presigned_download_url
from api.services.sandbox import run_sandbox

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
    query = db.query(Tool).filter(Tool.status == ToolStatus.active)

    if q:
        query = query.filter(
            or_(
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
    return ToolListResponse(tools=tools, total=total, page=page, limit=limit)


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
        db.query(ToolVersion)
        .filter(ToolVersion.tool_id == tool.id, ToolVersion.version == tool.latest_version)
        .first()
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

    tv = (
        db.query(ToolVersion)
        .filter(ToolVersion.tool_id == tool.id, ToolVersion.version == version)
        .first()
    )
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

    background_tasks.add_task(_run_sandbox_and_update, str(tv.id), s3_key, schema, db)
    return {"message": f"Version {version} submitted for validation"}


@router.delete("/{slug}", status_code=204)
def deprecate_tool(slug: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tool = db.query(Tool).filter(Tool.slug == slug, Tool.author_id == user.id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found or not yours")
    tool.status = ToolStatus.deprecated
    db.commit()
