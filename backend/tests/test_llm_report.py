import pytest
from app.domain import InvestigationState, EvidenceItem, InvestigationReport
from app.llm import (
    build_investigation_prompt,
    validate_llm_report,
    MockLocalProvider,
    SYSTEM_RULES_PROMPT
)


def test_prompt_building_10_sections():
    state = InvestigationState(transaction_id="TXN-5005")
    prompt = build_investigation_prompt(state)

    assert "=== 1. SYSTEM RULES ===" in prompt
    assert "=== 2. INVESTIGATION OBJECTIVE ===" in prompt
    assert "=== 3. TRANSACTION DATA ===" in prompt
    assert "=== 4. ML FINDINGS ===" in prompt
    assert "=== 5. PATTERN FINDINGS ===" in prompt
    assert "=== 6. GRAPH FINDINGS ===" in prompt
    assert "=== 7. RAG CONTEXT ===" in prompt
    assert "=== 8. SUPPORTING EVIDENCE ===" in prompt
    assert "=== 9. CONTRADICTING EVIDENCE ===" in prompt
    assert "=== 10. KNOWN LIMITATIONS ===" in prompt


def test_report_validation_success():
    state = InvestigationState(transaction_id="TXN-5005")
    ev = EvidenceItem(
        case_id=state.case_id,
        source_type="transaction_data",
        source_reference="txn:TXN-5005",
        claim="Transaction amount is $1,250.00"
    )
    state.evidence.append(ev)

    report = InvestigationReport(
        case_id=state.case_id,
        transaction_id=state.transaction_id,
        risk_level="HIGH",
        risk_score=0.85,
        primary_hypothesis="High risk transaction",
        supporting_evidence=[ev],
        confidence=0.90,
        recommended_action="MANUAL_REVIEW_FLAG"
    )

    is_valid, errors = validate_llm_report(report, state)
    assert is_valid is True
    assert len(errors) == 0


def test_report_validation_rejects_unsupported_evidence():
    state = InvestigationState(transaction_id="TXN-5005")

    bogus_ev = EvidenceItem(
        evidence_id="BOGUS-999",
        case_id=state.case_id,
        source_type="fabricated",
        source_reference="fake",
        claim="Fabricated claim not in state"
    )

    report = InvestigationReport(
        case_id=state.case_id,
        transaction_id=state.transaction_id,
        risk_level="HIGH",
        risk_score=0.85,
        primary_hypothesis="Fabricated hypothesis",
        supporting_evidence=[bogus_ev],
        confidence=0.90,
        recommended_action="MANUAL_REVIEW_FLAG"
    )

    is_valid, errors = validate_llm_report(report, state)
    assert is_valid is False
    assert len(errors) > 0
    assert "Unsupported supporting evidence ID" in errors[0]


@pytest.mark.asyncio
async def test_mock_local_provider_report_generation():
    provider = MockLocalProvider()
    state = InvestigationState(transaction_id="TXN-8888")
    state.risk_score = 0.88
    state.risk_level = "CRITICAL"

    report = await provider.generate_report(state)

    assert report.case_id == state.case_id
    assert report.transaction_id == "TXN-8888"
    assert report.risk_level == "CRITICAL"
    assert report.recommended_action == "MANUAL_REVIEW_FLAG"
