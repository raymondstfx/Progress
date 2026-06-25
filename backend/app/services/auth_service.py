import hashlib
import hmac
import base64
import secrets
from datetime import datetime, timedelta

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.config import get_settings
from backend.app.db.database import get_db
from backend.app.db.models import User


REVOKED_TOKENS: set[str] = set()


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("utf-8").rstrip("=")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _sign(payload: str) -> str:
    return _b64encode(hmac.new(get_settings().auth_secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).digest())


def hash_password(password: str) -> str:
    return hashlib.sha256(f"policyai:{password}".encode("utf-8")).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    return secrets.compare_digest(hash_password(password), password_hash)


def create_token(user: User) -> str:
    expires = datetime.utcnow() + timedelta(minutes=get_settings().auth_token_ttl_minutes)
    nonce = secrets.token_urlsafe(12)
    payload = _b64encode(f"{user.id}|{int(expires.timestamp())}|{nonce}".encode("utf-8"))
    signature = _sign(payload)
    return f"{payload}.{signature}"


def revoke_token(token: str) -> None:
    REVOKED_TOKENS.add(token)


def token_from_header(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    return authorization.split(" ", 1)[1].strip()


def user_id_from_token(token: str) -> str:
    if token in REVOKED_TOKENS:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    try:
        payload, signature = token.split(".", 1)
        if not secrets.compare_digest(signature, _sign(payload)):
            raise ValueError("Bad signature")
        user_id, expires_raw, _nonce = _b64decode(payload).decode("utf-8").split("|", 2)
        expires = datetime.utcfromtimestamp(int(expires_raw))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    if expires < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Expired token")
    return user_id


def get_current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    user_id = user_id_from_token(token_from_header(authorization))
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
    return user
