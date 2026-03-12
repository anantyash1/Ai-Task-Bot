from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.models.user import Token, UserCreate, UserLogin, UserResponse
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


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return _user_response(current_user)
