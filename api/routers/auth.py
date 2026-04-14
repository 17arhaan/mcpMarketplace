from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.db import get_db
from api.models.user import User
from api.schemas.auth import RegisterRequest, LoginRequest, LoginResponse, ApiKeyResponse, UserProfile
from api.services.auth import hash_password, verify_password, create_jwt, generate_api_key
from api.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserProfile, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=409, detail="Username already taken")

    user = User(
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token, expires_at = create_jwt(str(user.id))
    return LoginResponse(jwt=token, expires_at=expires_at)


@router.get("/me", response_model=UserProfile)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/api-key", response_model=ApiKeyResponse)
def create_api_key(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    raw, hashed = generate_api_key()
    user.api_key_hash = hashed
    db.commit()
    return ApiKeyResponse(api_key=raw)


@router.delete("/api-key", status_code=204)
def revoke_api_key(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.api_key_hash = None
    db.commit()
