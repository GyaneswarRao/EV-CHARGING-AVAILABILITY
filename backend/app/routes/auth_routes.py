from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pymongo.database import Database

from app.database.connection import get_database
from app.security.auth import get_password_hash, verify_password, create_access_token, decode_access_token
from app.schemas.all_schemas import UserRegisterRequest, UserLoginRequest, TokenResponse, UserProfileResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Database = Depends(get_database)) -> dict:
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email = payload["sub"]
    user = db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    user["id"] = str(user["_id"])
    return user

def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Administrator privileges required"
        )
    return current_user

@router.post("/register", response_model=TokenResponse)
def register(request: UserRegisterRequest, db: Database = Depends(get_database)):
    existing = db.users.find_one({"email": request.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # If role is requested as admin or this is the first user, assign appropriately
    role = request.role if request.role in ["admin", "user"] else "user"
    user_count = db.users.count_documents({})
    if user_count == 0 or request.email.lower() == "admin@evcharge.com":
        role = "admin"

    now = datetime.now(timezone.utc).isoformat()
    user_doc = {
        "name": request.name,
        "email": request.email.lower(),
        "password_hash": get_password_hash(request.password),
        "role": role,
        "created_at": now
    }
    result = db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    profile = UserProfileResponse(
        id=user_id,
        name=request.name,
        email=request.email.lower(),
        role=role,
        created_at=now
    )
    token = create_access_token({"sub": profile.email, "role": role, "name": profile.name})
    return TokenResponse(access_token=token, user=profile)

@router.post("/login", response_model=TokenResponse)
def login(request: UserLoginRequest, db: Database = Depends(get_database)):
    user = db.users.find_one({"email": request.email.lower()})
    if not user or not verify_password(request.password, user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    user_id = str(user["_id"])
    profile = UserProfileResponse(
        id=user_id,
        name=user["name"],
        email=user["email"],
        role=user.get("role", "user"),
        created_at=user.get("created_at", "")
    )
    token = create_access_token({"sub": profile.email, "role": profile.role, "name": profile.name})
    return TokenResponse(access_token=token, user=profile)

@router.get("/profile", response_model=UserProfileResponse)
def get_profile(current_user: dict = Depends(get_current_user)):
    return UserProfileResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        role=current_user["role"],
        created_at=current_user.get("created_at", "")
    )
