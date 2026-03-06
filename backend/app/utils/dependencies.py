from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId
from app.utils.database import users_collection
from app.utils import security

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict[str, Any]:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = security.decode_access_token(token) or security.decode_token(token)
    if not isinstance(payload, dict):
        raise unauthorized

    user_id = payload.get("sub")
    if not isinstance(user_id, str) or not user_id:
        raise unauthorized

    user_filter: dict[str, Any]
    if ObjectId.is_valid(user_id):
        user_filter = {"_id": ObjectId(user_id)}
    else:
        user_filter = {"_id": user_id}

    user_doc = await users_collection.find_one(user_filter)
    if not user_doc:
        raise unauthorized

    sanitized_user = dict(user_doc)
    sanitized_user.pop("hashed_password", None)
    return sanitized_user
