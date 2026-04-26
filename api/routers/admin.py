from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from api.db import get_db
from api.dependencies import require_admin
from api.models.tool import Tool, ToolStatus
from api.models.user import User
from api.services.cache import cache_delete_pattern

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


def _serialize_tool(tool: Tool, author: User | None) -> dict:
    return {
        "id": str(tool.id),
        "name": tool.name,
        "slug": tool.slug,
        "description": tool.description,
        "status": tool.status.value if hasattr(tool.status, "value") else tool.status,
        "latest_version": tool.latest_version,
        "install_count": tool.install_count,
        "avg_rating": float(tool.avg_rating) if tool.avg_rating is not None else None,
        "created_at": tool.created_at,
        "author_username": author.username if author else None,
        "author_email": author.email if author else None,
    }


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    return {
        "users": db.query(func.count(User.id)).scalar(),
        "admins": db.query(func.count(User.id)).filter(User.is_admin.is_(True)).scalar(),
        "tools_total": db.query(func.count(Tool.id)).scalar(),
        "tools_active": db.query(func.count(Tool.id)).filter(Tool.status == ToolStatus.active).scalar(),
        "tools_pending": db.query(func.count(Tool.id)).filter(Tool.status == ToolStatus.pending_review).scalar(),
        "tools_rejected": db.query(func.count(Tool.id)).filter(Tool.status == ToolStatus.rejected).scalar(),
    }


@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": str(u.id),
            "username": u.username,
            "email": u.email,
            "is_admin": u.is_admin,
            "created_at": u.created_at,
        }
        for u in users
    ]


@router.post("/users/{username}/promote")
def promote_user(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = True
    db.commit()
    return {"username": user.username, "is_admin": True}


@router.post("/users/{username}/demote")
def demote_user(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = False
    db.commit()
    return {"username": user.username, "is_admin": False}


@router.get("/tools")
def list_all_tools(status: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Tool)
    if status:
        try:
            q = q.filter(Tool.status == ToolStatus(status))
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid status")
    tools = q.order_by(Tool.created_at.desc()).all()
    by_id = {u.id: u for u in db.query(User).all()}
    return [_serialize_tool(t, by_id.get(t.author_id)) for t in tools]


@router.get("/tools/pending")
def list_pending(db: Session = Depends(get_db)):
    tools = db.query(Tool).filter(Tool.status == ToolStatus.pending_review).order_by(Tool.created_at.asc()).all()
    by_id = {u.id: u for u in db.query(User).all()}
    return [_serialize_tool(t, by_id.get(t.author_id)) for t in tools]


@router.post("/tools/{slug}/approve")
def approve_tool(slug: str, db: Session = Depends(get_db)):
    tool = db.query(Tool).filter(Tool.slug == slug).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    tool.status = ToolStatus.active
    db.commit()
    cache_delete_pattern("tools:search:*")
    return {"slug": slug, "status": "active"}


@router.post("/tools/{slug}/reject")
def reject_tool(slug: str, db: Session = Depends(get_db)):
    tool = db.query(Tool).filter(Tool.slug == slug).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    tool.status = ToolStatus.rejected
    db.commit()
    cache_delete_pattern("tools:search:*")
    return {"slug": slug, "status": "rejected"}


@router.delete("/tools/{slug}", status_code=204)
def remove_tool(slug: str, db: Session = Depends(get_db)):
    tool = db.query(Tool).filter(Tool.slug == slug).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    tool.status = ToolStatus.removed
    db.commit()
    cache_delete_pattern("tools:search:*")


@router.post("/tools/{slug}/restore")
def restore_tool(slug: str, db: Session = Depends(get_db)):
    tool = db.query(Tool).filter(Tool.slug == slug).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    tool.status = ToolStatus.active
    db.commit()
    cache_delete_pattern("tools:search:*")
    return {"slug": slug, "status": "active"}
