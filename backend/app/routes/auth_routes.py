from datetime import datetime
import os

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.models.user import GoogleLogin, Token, UserCreate, UserLogin, UserResponse
from app.utils.database import users_collection
from app.utils.dependencies import get_current_user
from app.utils.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _user_response(user_doc: dict) -> UserResponse:
    return UserResponse(
        id=str(user_doc["_id"]),
        name=user_doc["name"],
        email=user_doc["email"],
        created_at=user_doc["created_at"],
    )


def _verify_google_id_token(raw_id_token: str) -> dict:
    google_client_id = (os.getenv("GOOGLE_CLIENT_ID") or "").strip()
    if not google_client_id:
        raise HTTPException(status_code=503, detail="Google login is not configured.")

    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token
    except Exception as exc:
        print(f"Google auth dependency error: {exc}")
        raise HTTPException(status_code=500, detail="Google login is unavailable right now.")

    try:
        payload = google_id_token.verify_oauth2_token(
            raw_id_token,
            google_requests.Request(),
            google_client_id,
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google token.")

    if not payload.get("email"):
        raise HTTPException(status_code=400, detail="Google account email was not provided.")
    if payload.get("email_verified") is not True:
        raise HTTPException(status_code=400, detail="Google email is not verified.")
    return payload


@router.post("/register", response_model=Token, status_code=201)
async def register(user_data: UserCreate):
    try:
        normalized_email = _normalize_email(user_data.email)
        existing = await users_collection.find_one({"email": normalized_email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        user_doc = {
            "name": user_data.name.strip(),
            "email": normalized_email,
            "hashed_password": hash_password(user_data.password),
            "created_at": datetime.utcnow(),
        }

        result = await users_collection.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        access_token = create_access_token(data={"sub": str(result.inserted_id)})

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": _user_response(user_doc),
        }
    except HTTPException:
        raise
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Email already registered")
    except PyMongoError as exc:
        print(f"Register database error: {exc}")
        raise HTTPException(status_code=503, detail="Database is unavailable. Please try again shortly.")
    except Exception as exc:
        print(f"Register unexpected error: {exc}")
        raise HTTPException(status_code=500, detail="Unable to register user right now.")


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    try:
        normalized_email = _normalize_email(credentials.email)
        user = await users_collection.find_one({"email": normalized_email})
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

        hashed_password = user.get("hashed_password")
        if not hashed_password or not verify_password(credentials.password, hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

        access_token = create_access_token(data={"sub": str(user["_id"])})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": _user_response(user),
        }
    except HTTPException:
        raise
    except PyMongoError as exc:
        print(f"Login database error: {exc}")
        raise HTTPException(status_code=503, detail="Database is unavailable. Please try again shortly.")
    except Exception as exc:
        print(f"Login unexpected error: {exc}")
        raise HTTPException(status_code=500, detail="Unable to login right now.")


@router.post("/google", response_model=Token)
async def google_login(payload: GoogleLogin):
    try:
        google_payload = _verify_google_id_token(payload.id_token)
        normalized_email = _normalize_email(str(google_payload["email"]))
        user = await users_collection.find_one({"email": normalized_email})

        if not user:
            user_name = str(google_payload.get("name") or normalized_email.split("@")[0]).strip() or "User"
            user_doc = {
                "name": user_name[:50],
                "email": normalized_email,
                "hashed_password": None,
                "auth_provider": "google",
                "google_sub": str(google_payload.get("sub") or ""),
                "avatar_url": google_payload.get("picture"),
                "created_at": datetime.utcnow(),
            }
            result = await users_collection.insert_one(user_doc)
            user_doc["_id"] = result.inserted_id
            user = user_doc
        else:
            updates: dict = {}
            google_sub = str(google_payload.get("sub") or "")
            if google_sub and user.get("google_sub") != google_sub:
                updates["google_sub"] = google_sub
            if not user.get("auth_provider"):
                updates["auth_provider"] = "google"
            if google_payload.get("picture") and user.get("avatar_url") != google_payload.get("picture"):
                updates["avatar_url"] = google_payload.get("picture")
            if updates:
                await users_collection.update_one({"_id": user["_id"]}, {"$set": updates})
                user.update(updates)

        access_token = create_access_token(data={"sub": str(user["_id"])})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": _user_response(user),
        }
    except HTTPException:
        raise
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Email already registered")
    except PyMongoError as exc:
        print(f"Google login database error: {exc}")
        raise HTTPException(status_code=503, detail="Database is unavailable. Please try again shortly.")
    except Exception as exc:
        print(f"Google login unexpected error: {exc}")
        raise HTTPException(status_code=500, detail="Unable to login with Google right now.")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return _user_response(current_user)
