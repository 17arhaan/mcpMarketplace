from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from api.db import get_db
from api.models.user import User
from api.services.auth import decode_jwt, hash_api_key

# === AUTH PAUSED ===
# Login is temporarily disabled — any request is allowed and falls back to a
# shared "guest" user so endpoints that need a user row keep working.
# To re-enable login, set this to False (and revert the UI bypass in
# web/app/components/require-auth.tsx and web/app/api/discover/route.ts).
AUTH_PAUSED = True


def _get_or_create_guest(db: Session) -> User:
    """Shared anonymous user used while login is paused."""
    user = db.query(User).filter(User.username == "guest").first()
    if user is None:
        user = User(
            username="guest",
            email="guest@mcpmarketplace.online",
            password_hash="!",  # unusable password — guest can't log in normally
            is_admin=True,  # paused mode: guest can reach admin endpoints too
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def _make_auth_dependency():
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

        if AUTH_PAUSED:
            return _get_or_create_guest(db)

        raise HTTPException(status_code=401, detail="Not authenticated")

    return _get_current_user


get_current_user = _make_auth_dependency()


def require_admin(user: User = Depends(get_current_user)) -> User:
    if AUTH_PAUSED:
        return user
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
