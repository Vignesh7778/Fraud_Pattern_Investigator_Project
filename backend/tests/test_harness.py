import pytest
from app.harness import InvestigationHarness, investigation_harness


@pytest.mark.asyncio
async def test_harness_successful_investigation():
    harness = InvestigationHarness()
    state = harness.initialize_case("TXN-1001")
    assert state.status == "CREATED"

    completed_state = await harness.run_to_completion(state, user_role="analyst")

    assert completed_state.status == "HUMAN_REVIEW"
    assert completed_state.step_count > 0
    assert len(completed_state.evidence) > 0
    assert completed_state.risk_score is not None
    assert completed_state.report is not None
    assert completed_state.report.case_id == completed_state.case_id


@pytest.mark.asyncio
async def test_harness_max_steps_termination():
    harness = InvestigationHarness(max_steps=3)
    state = harness.initialize_case("TXN-9999")

    # Force step iteration beyond max_steps
    for _ in range(5):
        state = await harness.step(state)

    assert state.status == "FAILED"
    assert len(state.errors) > 0
    assert "maximum allowed step limit" in state.errors[0]


@pytest.mark.asyncio
async def test_harness_tool_failure_recovery():
    harness = InvestigationHarness()
    state = harness.initialize_case("TXN-ERROR")

    # Run tool execution with missing required parameter to force tool failure
    await harness._execute_tool_step(state, "fetch_transaction", {}, user_role="analyst")

    assert len(state.errors) > 0
    assert "Tool 'fetch_transaction' failed" in state.errors[0]
    # State remains intact and resilient
    assert state.case_id.startswith("CASE-")
