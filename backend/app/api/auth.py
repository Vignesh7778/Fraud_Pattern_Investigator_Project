from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.security import create_access_token, hash_password, verify_password, get_current_user, ROLE_PERMISSIONS

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

# Synthetic user credentials store
MOCK_USERS = {
    "analyst@fpi.io": {"user_id": "USR-001", "password_hash": hash_password("analyst123"), "role": "analyst", "name": "Sarah Jenkins"},
    "auditor@fpi.io": {"user_id": "USR-002", "password_hash": hash_password("auditor123"), "role": "auditor", "name": "Marcus Vance"},
    "admin@fpi.io": {"user_id": "USR-003", "password_hash": hash_password("admin123"), "role": "admin", "name": "Elena Rostova"},
}


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login", response_model=Dict[str, Any])
async def login(req: LoginRequest):
    user = MOCK_USERS.get(req.email.lower())
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token(user_id=user["user_id"], role=user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["user_id"],
            "email": req.email,
            "role": user["role"],
            "name": user["name"],
            "permissions": ROLE_PERMISSIONS[user["role"]]
        }
    }


@router.get("/me", response_model=Dict[str, Any])
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return current_user
