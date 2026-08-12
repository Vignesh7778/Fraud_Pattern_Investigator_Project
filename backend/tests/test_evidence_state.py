import pytest
from app.domain import EvidenceItem, InvestigationState, evidence_manager


def test_investigation_state_serialization():
    state = InvestigationState(transaction_id="TXN-1001")
    assert state.case_id.startswith("CASE-")
    assert state.status == "CREATED"
    assert state.step_count == 0

    json_data = state.model_dump_json()
    reconstructed = InvestigationState.model_validate_json(json_data)
    assert reconstructed.case_id == state.case_id
    assert reconstructed.transaction_id == "TXN-1001"


def test_evidence_addition_and_deduplication():
    state = InvestigationState(transaction_id="TXN-1001")
    item1 = EvidenceItem(
        case_id=state.case_id,
        source_type="pattern_engine",
        source_reference="device:DEV22",
        claim="Device DEV22 is shared by 5 accounts",
        confidence=0.95
    )

    # 1. First addition should succeed
    state, added = evidence_manager.add_evidence(state, item1)
    assert added is True
    assert len(state.evidence) == 1

    # 2. Duplicate addition should be rejected
    item1_dup = EvidenceItem(
        case_id=state.case_id,
        source_type="pattern_engine",
        source_reference="device:DEV22",
        claim="Device DEV22 is shared by 5 accounts",
        confidence=0.95
    )
    state, added = evidence_manager.add_evidence(state, item1_dup)
    assert added is False
    assert len(state.evidence) == 1


def test_evidence_case_mismatch_rejection():
    state = InvestigationState(transaction_id="TXN-1001")
    bad_item = EvidenceItem(
        case_id="CASE-WRONG-999",
        source_type="transaction_data",
        source_reference="txn:TXN999",
        claim="Test mismatch claim"
    )

    state, added = evidence_manager.add_evidence(state, bad_item)
    assert added is False
    assert len(state.errors) > 0


def test_evidence_categorization():
    item_supporting = EvidenceItem(
        case_id="CASE-1",
        source_type="pattern_engine",
        source_reference="pattern:velocity",
        claim="High transaction velocity detected: 12 txns in 5 mins",
        value_reference={"risk_level": "HIGH"}
    )
    item_contradicting = EvidenceItem(
        case_id="CASE-1",
        source_type="policy_rag",
        source_reference="policy:POL-001",
        claim="Device is a verified legitimate shared household kiosk",
        value_reference={"is_fraud": False}
    )

    cat = evidence_manager.categorize_evidence([item_supporting, item_contradicting], ["velocity"])
    assert len(cat["supporting"]) == 1
    assert len(cat["contradicting"]) == 1
    assert cat["supporting"][0].claim == item_supporting.claim
    assert cat["contradicting"][0].claim == item_contradicting.claim
