from typing import List, Dict, Any, Tuple
from pydantic import BaseModel, Field
from app.domain.state import InvestigationState, EvidenceItem, Hypothesis


SOURCE_RELIABILITY_WEIGHTS = {
    "transaction_data": 1.00,
    "account_history": 0.95,
    "ml_model": 0.95,
    "pattern_engine": 0.95,
    "graph_analysis": 0.90,
    "policy_rag": 0.85,
    "historical_case": 0.80,
}


class VerificationAnalysisResult(BaseModel):
    supporting_score: float
    contradicting_score: float
    coverage_score: float
    adjusted_confidence: float
    source_disagreement_detected: bool
    missing_evidence_types: List[str] = Field(default_factory=list)
    supporting_evidence: List[EvidenceItem] = Field(default_factory=list)
    contradicting_evidence: List[EvidenceItem] = Field(default_factory=list)
    uncertainty_notes: List[str] = Field(default_factory=list)


class ContradictionEngine:
    def analyze_state(self, state: InvestigationState) -> VerificationAnalysisResult:
        supporting: List[EvidenceItem] = []
        contradicting: List[EvidenceItem] = []

        total_weighted_supporting = 0.0
        total_weighted_contradicting = 0.0

        for item in state.evidence:
            weight = SOURCE_RELIABILITY_WEIGHTS.get(item.source_type, 0.75) * item.confidence
            claim_lower = item.claim.lower()
            val_ref = item.value_reference

            is_contra = (
                "legitimate" in claim_lower
                or "whitelisted" in claim_lower
                or "normal" in claim_lower
                or val_ref.get("is_fraud") is False
                or val_ref.get("risk_level") == "LOW"
            )

            if is_contra:
                contradicting.append(item)
                total_weighted_contradicting += weight
            else:
                supporting.append(item)
                total_weighted_supporting += weight

        # Missing Evidence Types Check
        required_sources = {"transaction_data", "ml_model", "pattern_engine"}
        found_sources = {e.source_type for e in state.evidence}
        missing_sources = list(required_sources - found_sources)

        # Coverage Score
        coverage_score = round(len(found_sources) / max(1, len(required_sources)), 2)

        # Source Disagreement Detection
        disagreement = len(supporting) > 0 and len(contradicting) > 0

        # Score calculations
        denom = max(1.0, total_weighted_supporting + total_weighted_contradicting)
        supp_score = round(total_weighted_supporting / denom, 2)
        contra_score = round(total_weighted_contradicting / denom, 2)

        # Confidence Adjustment
        base_confidence = 0.90
        if disagreement:
            base_confidence -= 0.20  # Penalty for source disagreement
        if missing_sources:
            base_confidence -= 0.10 * len(missing_sources)  # Penalty for incomplete evidence

        adjusted_confidence = max(0.30, min(0.99, round(base_confidence, 2)))

        uncertainty_notes = []
        if disagreement:
            uncertainty_notes.append("Source disagreement detected: conflicting claims between supporting and contradicting evidence.")
        if missing_sources:
            uncertainty_notes.append(f"Incomplete evidence coverage: missing {', '.join(missing_sources)}.")
        if contra_score > 0.40:
            uncertainty_notes.append("Strong legitimate behavior indicators present. High likelihood of false positive.")

        return VerificationAnalysisResult(
            supporting_score=supp_score,
            contradicting_score=contra_score,
            coverage_score=coverage_score,
            adjusted_confidence=adjusted_confidence,
            source_disagreement_detected=disagreement,
            missing_evidence_types=missing_sources,
            supporting_evidence=supporting,
            contradicting_evidence=contradicting,
            uncertainty_notes=uncertainty_notes
        )


contradiction_engine = ContradictionEngine()
