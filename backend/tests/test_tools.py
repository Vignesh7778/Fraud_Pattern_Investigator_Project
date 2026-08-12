import pytest
from app.tools import tool_registry, ToolPermissionError


@pytest.mark.asyncio
async def test_tool_registry_registration():
    tools = tool_registry.list_tools()
    assert len(tools) == 8
    assert "fetch_transaction" in tools
    assert "run_fraud_model" in tools
    assert "detect_patterns" in tools
    assert "find_linked_entities" in tools


@pytest.mark.asyncio
async def test_fetch_transaction_tool():
    res = await tool_registry.execute_tool("fetch_transaction", {"transaction_id": "TXN-1001"}, user_role="analyst")
    assert res["status"] == "SUCCESS"
    assert res["output"]["transaction_id"] == "TXN-1001"
    assert "amount" in res["output"]


@pytest.mark.asyncio
async def test_run_fraud_model_tool():
    feat = {"amount": 5000.0, "txns_last_1h": 6, "device_account_count": 4}
    res = await tool_registry.execute_tool("run_fraud_model", {"transaction_id": "TXN-1001", "feature_data": feat})
    assert res["status"] == "SUCCESS"
    assert "risk_score" in res["output"]
    assert "feature_contributions" in res["output"]


@pytest.mark.asyncio
async def test_invalid_parameters_fail_safely():
    with pytest.raises(ValueError):
        # Missing required transaction_id
        await tool_registry.execute_tool("fetch_transaction", {}, user_role="analyst")


@pytest.mark.asyncio
async def test_forbidden_tool_execution_blocked():
    with pytest.raises(ToolPermissionError):
        await tool_registry.execute_tool("execute_arbitrary_sql", {"query": "SELECT * FROM users"}, user_role="admin")

    with pytest.raises(ToolPermissionError):
        await tool_registry.execute_tool("execute_shell", {"command": "ls"}, user_role="admin")
