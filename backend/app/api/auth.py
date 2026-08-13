from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.security import create_access_token, hash_password, verify_password, get_current_user, ROLE_PERMISSIONS

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

# Synthetic user credentials store
MOCK_USERS = {
    "analyst@fpi.io": {"user_id": "USR-001", "password_hash": hash_password("analyst123"), "role": "analyst", "name": "Sarah Jenkins", "email": "analyst@fpi.io"},
    "usr-001": {"user_id": "USR-001", "password_hash": hash_password("analyst123"), "role": "analyst", "name": "Sarah Jenkins", "email": "analyst@fpi.io"},
    
    "auditor@fpi.io": {"user_id": "USR-002", "password_hash": hash_password("auditor123"), "role": "auditor", "name": "Marcus Vance", "email": "auditor@fpi.io"},
    "usr-002": {"user_id": "USR-002", "password_hash": hash_password("auditor123"), "role": "auditor", "name": "Marcus Vance", "email": "auditor@fpi.io"},
    
    "admin@fpi.io": {"user_id": "USR-003", "password_hash": hash_password("admin123"), "role": "admin", "name": "Elena Rostova", "email": "admin@fpi.io"},
    "usr-003": {"user_id": "USR-003", "password_hash": hash_password("admin123"), "role": "admin", "name": "Elena Rostova", "email": "admin@fpi.io"}
}


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login", response_model=Dict[str, Any])
async def login(req: LoginRequest):
    identifier = req.email.strip().lower()
    user = MOCK_USERS.get(identifier)
    
    if not user:
        # Search by user_id or email match
        for u in MOCK_USERS.values():
            if u["user_id"].lower() == identifier or u["email"].lower() == identifier:
                user = u
                break

    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid Analyst User ID/Email or password.")

    token = create_access_token(user_id=user["user_id"], role=user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["user_id"],
            "email": user["email"],
            "role": user["role"],
            "name": user["name"],
            "permissions": ROLE_PERMISSIONS[user["role"]]
        }
    }


@router.get("/me", response_model=Dict[str, Any])
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return current_user
