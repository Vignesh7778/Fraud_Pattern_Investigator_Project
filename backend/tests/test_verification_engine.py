import pytest
from app.domain import InvestigationState, EvidenceItem
from app.domain.verification import contradiction_engine, ContradictionEngine


def test_verification_strong_fraud_evidence():
    state = InvestigationState(transaction_id="TXN-FRAUD-101")
    ev1 = EvidenceItem(
        case_id=state.case_id,
        source_type="transaction_data",
        source_reference="txn:TXN-FRAUD-101",
        claim="Transaction amount exceeds $5,000 threshold"
    )
    ev2 = EvidenceItem(
        case_id=state.case_id,
        source_type="ml_model",
        source_reference="model:xgb-v1",
        claim="XGBoost ML risk score is 0.94 (CRITICAL)"
    )
    ev3 = EvidenceItem(
        case_id=state.case_id,
        source_type="pattern_engine",
        source_reference="pattern:shared_device",
        claim="Device hash associated with 6 accounts"
    )
    state.evidence.extend([ev1, ev2, ev3])

    res = contradiction_engine.analyze_state(state)
    assert res.supporting_score > 0.80
    assert res.contradicting_score == 0.0
    assert res.source_disagreement_detected is False
    assert res.coverage_score == 1.0


def test_verification_legitimate_contradicting_evidence():
    state = InvestigationState(transaction_id="TXN-LEGIT-102")
    ev_supp = EvidenceItem(
        case_id=state.case_id,
        source_type="pattern_engine",
        source_reference="pattern:shared_device",
        claim="Device hash associated with 3 accounts"
    )
    ev_contra = EvidenceItem(
        case_id=state.case_id,
        source_type="policy_rag",
        source_reference="policy:POL-001",
        claim="Device verified as legitimate household kiosk tablet",
        value_reference={"is_fraud": False}
    )
    state.evidence.extend([ev_supp, ev_contra])

    res = contradiction_engine.analyze_state(state)
    assert res.source_disagreement_detected is True
    assert len(res.contradicting_evidence) == 1
    assert res.adjusted_confidence < 0.80  # Confidence adjusted downward due to conflicting signals
    assert len(res.uncertainty_notes) > 0
