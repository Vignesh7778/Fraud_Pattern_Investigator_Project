import pytest
from app.core.security import create_access_token, decode_access_token, ROLE_PERMISSIONS
from app.tools import tool_registry, ToolPermissionError


def test_jwt_token_generation_and_decoding():
    token = create_access_token(user_id="USR-TEST", role="analyst")
    decoded = decode_access_token(token)

    assert decoded["sub"] == "USR-TEST"
    assert decoded["role"] == "analyst"


def test_rbac_role_permissions():
    analyst_perms = ROLE_PERMISSIONS["analyst"]
    auditor_perms = ROLE_PERMISSIONS["auditor"]
    admin_perms = ROLE_PERMISSIONS["admin"]

    # Analyst can investigate and make decisions, but cannot manage users
    assert "investigate" in analyst_perms
    assert "make_decision" in analyst_perms
    assert "manage_users" not in analyst_perms

    # Auditor can view evidence and audit logs, but cannot make decisions
    assert "view_evidence" in auditor_perms
    assert "view_audit" in auditor_perms
    assert "make_decision" not in auditor_perms

    # Admin has all permissions
    assert "manage_users" in admin_perms
    assert "manage_policies" in admin_perms


@pytest.mark.asyncio
async def test_auditor_role_cannot_execute_restricted_tools():
    tool = tool_registry.get_tool("run_fraud_model")
    assert tool is not None

    # Auditor role should fail permission check for execution tools
    with pytest.raises(ToolPermissionError):
        await tool_registry.execute_tool("run_fraud_model", {"transaction_id": "TXN-1", "feature_data": {}}, user_role="auditor")


@pytest.mark.asyncio
async def test_forbidden_sql_and_shell_tool_escalation_blocked():
    with pytest.raises(ToolPermissionError):
        await tool_registry.execute_tool("execute_arbitrary_sql", {"query": "DROP TABLE users;"}, user_role="admin")

    with pytest.raises(ToolPermissionError):
        await tool_registry.execute_tool("execute_shell", {"command": "rm -rf /"}, user_role="admin")
