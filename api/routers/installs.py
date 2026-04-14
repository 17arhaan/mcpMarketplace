from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.db import get_db
from api.dependencies import get_current_user
from api.models.install import Install
from api.models.tool import Tool, ToolStatus
from api.models.user import User
from api.schemas.installs import InstallRequest, InstallOut

router = APIRouter(prefix="/installs", tags=["installs"])


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
    tool.install_count = (tool.install_count or 0) + 1
    db.commit()
    db.refresh(install)
    return install


@router.get("/me", response_model=list[InstallOut])
def my_installs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Install).filter(Install.user_id == user.id).order_by(Install.installed_at.desc()).all()
