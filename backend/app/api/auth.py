from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.db.models import User
from backend.app.schemas.auth_schema import LoginRequest, LoginResponse, UserOut
from backend.app.services.auth_service import create_token, get_current_user, revoke_token, token_from_header, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"token": create_token(user), "user": UserOut(id=user.id, username=user.username, role=user.role)}


@router.post("/logout")
def logout(authorization: str | None = Header(default=None)):
    try:
        revoke_token(token_from_header(authorization))
    except HTTPException:
        pass
    return {"ok": True}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut(id=user.id, username=user.username, role=user.role)
