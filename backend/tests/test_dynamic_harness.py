import pytest
from app.harness import InvestigationHarness
from app.harness.planner import DynamicPlanner, ProposedToolAction
from app.domain import InvestigationState, PatternFinding


@pytest.mark.asyncio
async def test_dynamic_path_diversity_case_a_shared_device():
    harness = InvestigationHarness()
    state = harness.initialize_case("TXN-DEVICE-LOOP")

    state = await harness.run_to_completion(state)
    assert state.status == "HUMAN_REVIEW"

    tool_names = [t.tool_name for t in state.tool_history]
    assert "run_fraud_model" in tool_names
    assert "detect_patterns" in tool_names
    assert "find_linked_entities" in tool_names
    assert len(tool_names) >= 4



def test_repeated_tool_call_protection():
    planner = DynamicPlanner()
    state = InvestigationState(transaction_id="TXN-DUP-TEST")

    action1 = planner.recommend_next_action(state)
    assert action1 is not None
    assert action1.tool_name == "run_fraud_model"

    # Simulate tool execution
    from app.domain import ToolExecutionRecord
    state.tool_history.append(ToolExecutionRecord(
        tool_name=action1.tool_name,
        input_params=action1.required_inputs,
        status="SUCCESS"
    ))

    # Next action must recommend a different tool
    action2 = planner.recommend_next_action(state)
    assert action2 is not None
    assert action2.tool_name != "run_fraud_model"
