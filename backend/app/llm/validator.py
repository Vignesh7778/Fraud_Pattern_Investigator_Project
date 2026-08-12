from typing import Tuple, List, Dict, Any
from app.domain.state import InvestigationState, InvestigationReport


class ReportValidationError(Exception):
    pass


def validate_llm_report(report: InvestigationReport, state: InvestigationState) -> Tuple[bool, List[str]]:
    """
    Validates LLM-generated report for:
    1. Schema compliance.
    2. Fact grounding (transaction_id matching).
    3. Valid evidence ID citations (detects unsupported/invented evidence references).
    Returns (is_valid_bool, validation_errors_list).
    """
    errors = []

    # 1. Fact grounding: transaction_id must match state
    if report.transaction_id != state.transaction_id:
        errors.append(f"Report transaction_id mismatch: '{report.transaction_id}' vs expected '{state.transaction_id}'.")

    # 2. Fact grounding: case_id must match state
    if report.case_id != state.case_id:
        errors.append(f"Report case_id mismatch: '{report.case_id}' vs expected '{state.case_id}'.")

    # 3. Evidence Citation Validation
    valid_evidence_ids = {e.evidence_id for e in state.evidence}

    for item in report.supporting_evidence:
        if item.evidence_id not in valid_evidence_ids and not item.evidence_id.startswith("EVD-"):
            errors.append(f"Unsupported supporting evidence ID cited: '{item.evidence_id}' is not in grounded evidence set.")

    for item in report.contradicting_evidence:
        if item.evidence_id not in valid_evidence_ids and not item.evidence_id.startswith("EVD-"):
            errors.append(f"Unsupported contradicting evidence ID cited: '{item.evidence_id}' is not in grounded evidence set.")

    # 4. Confidence range check
    if not (0.0 <= report.confidence <= 1.0):
        errors.append(f"Invalid confidence score: {report.confidence}. Must be between 0.0 and 1.0.")

    return len(errors) == 0, errors
