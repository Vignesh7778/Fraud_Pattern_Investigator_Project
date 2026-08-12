from typing import List, Tuple, Dict, Any, Optional
from app.domain.state import EvidenceItem, InvestigationState


class EvidenceManager:
    def add_evidence(
        self,
        state: InvestigationState,
        evidence_item: EvidenceItem
    ) -> Tuple[InvestigationState, bool]:
        """
        Validates evidence, checks for duplicates, and appends if novel.
        Returns (updated_state, is_added_boolean).
        """
        # Schema Validation: ensure required fields present
        if not evidence_item.case_id or not evidence_item.claim or not evidence_item.source_type:
            state.errors.append(f"Invalid evidence schema: missing required fields in {evidence_item}")
            return state, False

        # Ensure evidence belongs to this case
        if evidence_item.case_id != state.case_id:
            state.errors.append(f"Evidence case_id mismatch: {evidence_item.case_id} vs {state.case_id}")
            return state, False

        # Deduplication Check
        for existing in state.evidence:
            if (
                existing.source_type == evidence_item.source_type
                and existing.source_reference == evidence_item.source_reference
                and existing.claim == evidence_item.claim
            ):
                # Duplicate found - skip addition
                return state, False

        # Append novel evidence
        state.evidence.append(evidence_item)
        return state, True

    def categorize_evidence(
        self,
        evidence_list: List[EvidenceItem],
        primary_hypothesis_keywords: List[str]
    ) -> Dict[str, List[EvidenceItem]]:
        """
        Categorizes evidence items into supporting vs contradicting based on hypothesis keywords and risk indicators.
        """
        supporting: List[EvidenceItem] = []
        contradicting: List[EvidenceItem] = []

        for item in evidence_list:
            claim_lower = item.claim.lower()
            val_ref = item.value_reference

            # Contradicting indicators e.g. legitimate shared device, whitelisted, normal amount
            if (
                "legitimate" in claim_lower
                or "whitelisted" in claim_lower
                or "normal" in claim_lower
                or val_ref.get("is_fraud") is False
                or val_ref.get("risk_level") == "LOW"
            ):
                contradicting.append(item)
            else:
                supporting.append(item)

        return {
            "supporting": supporting,
            "contradicting": contradicting
        }


evidence_manager = EvidenceManager()
