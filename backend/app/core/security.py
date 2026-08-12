import hashlib
import time
from typing import Dict, Any, List, Optional
import jwt
from fastapi import HTTPException, Security, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
from app.core.logging import logger

security_bearer = HTTPBearer(auto_error=False)

ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "admin": ["investigate", "view_evidence", "view_audit", "make_decision", "manage_policies", "manage_users"],
    "analyst": ["investigate", "view_evidence", "view_audit", "make_decision"],
    "auditor": ["view_evidence", "view_audit"]
}


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed


def create_access_token(user_id: str, role: str, expires_in_seconds: int = 86400) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "iat": int(time.time()),
        "exp": int(time.time()) + expires_in_seconds
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid authentication token: {str(e)}")


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Dict[str, Any]:
    if not credentials:
        # Default fallback user for dev/test
        return {"user_id": "ANALYST-001", "role": "analyst", "permissions": ROLE_PERMISSIONS["analyst"]}

    payload = decode_access_token(credentials.credentials)
    role = payload.get("role", "analyst")
    permissions = ROLE_PERMISSIONS.get(role, [])
    return {
        "user_id": payload.get("sub"),
        "role": role,
        "permissions": permissions
    }


def require_permission(required_permission: str):
    async def permission_checker(current_user: Dict[str, Any] = Depends(get_current_user)):
        permissions = current_user.get("permissions", [])
        if required_permission not in permissions:
            logger.warning("rbac_permission_denied", user=current_user.get("user_id"), role=current_user.get("role"), required=required_permission)
            raise HTTPException(
                status_code=403,
                detail=f"Access Denied: Role '{current_user.get('role')}' lacks required permission '{required_permission}'."
            )
        return current_user
    return permission_checker
