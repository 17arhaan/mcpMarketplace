from fastapi import APIRouter, Depends, HTTPException, Request
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


def _optional_user(request: Request, db: Session = Depends(get_db)) -> User | None:
    try:
        from api.services.auth import decode_jwt, hash_api_key

        api_key = request.headers.get("X-API-Key")
        if api_key:
            hashed = hash_api_key(api_key)
            user = db.query(User).filter(User.api_key_hash == hashed).first()
            if user:
                return user
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.removeprefix("Bearer ").strip()
        if token:
            payload = decode_jwt(token)
            user = db.query(User).filter(User.id == payload["sub"]).first()
            if user:
                return user
    except Exception:
        pass
    return None


@router.post("", response_model=InstallOut, status_code=201)
def log_install(
    body: InstallRequest,
    db: Session = Depends(get_db),
    user: User | None = Depends(_optional_user),
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
        try:
            from api.services.cache import get_redis
            get_redis().delete(f"install_count:{body.tool_id}")
        except Exception:
            pass

    db.commit()
    db.refresh(install)
    return install


@router.get("/me", response_model=list[InstallOut])
def my_installs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Install).filter(Install.user_id == user.id).order_by(Install.installed_at.desc()).all()
