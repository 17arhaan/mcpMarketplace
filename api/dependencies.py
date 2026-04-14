from fastapi import Request, HTTPException
from sqlalchemy.orm import Session

from api.db import get_db
from api.models.user import User
from api.services.auth import decode_jwt, hash_api_key


async def get_current_user(request: Request, db: Session = next(get_db.__wrapped__() if hasattr(get_db, '__wrapped__') else iter([None]))) -> User:  # noqa
    # This gets injected properly via Depends — see usage in routers
    raise HTTPException(status_code=401)


def make_auth_dependency():
    from fastapi import Depends
    from api.db import get_db

    async def _get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
        api_key = request.headers.get("X-API-Key")
        if api_key:
            hashed = hash_api_key(api_key)
            user = db.query(User).filter(User.api_key_hash == hashed).first()
            if user:
                return user

        auth_header = request.headers.get("Authorization", "")
        token = auth_header.removeprefix("Bearer ").strip()
        if token:
            try:
                payload = decode_jwt(token)
                user = db.query(User).filter(User.id == payload["sub"]).first()
                if user:
                    return user
            except Exception:
                pass

        raise HTTPException(status_code=401, detail="Not authenticated")

    return _get_current_user


get_current_user = make_auth_dependency()
