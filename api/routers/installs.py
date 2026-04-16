from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.db import get_db
from api.dependencies import get_current_user
from api.models.install import Install
from api.models.tool import Tool, ToolStatus
from api.models.user import User
from api.schemas.installs import InstallOut, InstallRequest
from api.services.cache import increment_install_count

router = APIRouter(prefix="/installs", tags=["installs"])

BATCH_FLUSH_THRESHOLD = 10


@router.post("", response_model=InstallOut, status_code=201)
def log_install(
    body: InstallRequest,
    db: Session = Depends(get_db),
    user: User | None = None,
):
    tool = db.query(Tool).filter(Tool.id == body.tool_id, Tool.status == ToolStatus.active).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found or not active")

    install = Install(
        user_id=user.id if user else None,
        tool_id=body.tool_id,
        version=body.version or tool.latest_version,
    )
    db.add(install)

    redis_count = increment_install_count(str(body.tool_id))
    if redis_count >= BATCH_FLUSH_THRESHOLD:
        tool.install_count = (tool.install_count or 0) + redis_count
        from api.services.cache import get_redis

        get_redis().delete(f"install_count:{body.tool_id}")

    db.commit()
    db.refresh(install)
    return install


@router.get("/me", response_model=list[InstallOut])
def my_installs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Install).filter(Install.user_id == user.id).order_by(Install.installed_at.desc()).all()
