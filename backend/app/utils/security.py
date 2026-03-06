import os
from datetime import datetime, timedelta
from typing import Any, Optional

from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")


def _read_expiry_minutes(default_minutes: int = 30) -> int:
    raw_value = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
    if not raw_value:
        return default_minutes
    try:
        parsed = int(raw_value)
        return parsed if parsed > 0 else default_minutes
    except ValueError:
        return default_minutes


ACCESS_TOKEN_EXPIRE_MINUTES = _read_expiry_minutes()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire_delta = expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.utcnow() + expire_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def _decode_jwt(token: str) -> Optional[dict[str, Any]]:
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return decoded if isinstance(decoded, dict) else None
    except JWTError:
        return None


def decode_token(token: str) -> Optional[dict[str, Any]]:
    return _decode_jwt(token)


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    return _decode_jwt(token)
