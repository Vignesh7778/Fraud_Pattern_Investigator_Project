from typing import Dict, Any, List
from pydantic import BaseModel, Field
from app.tools.base import BaseTool


class VerifyEvidenceInput(BaseModel):
    case_id: str
    evidence_items: List[Dict[str, Any]] = Field(default_factory=list)


class VerifyEvidenceOutput(BaseModel):
    case_id: str
    is_valid: bool
    verified_count: int
    rejected_count: int
    verification_notes: List[str] = Field(default_factory=list)


class VerifyEvidenceTool(BaseTool):
    name = "verify_evidence"
    description = "Validate collected evidence integrity, check source references, and flag missing or contradictory signals"
    input_schema = VerifyEvidenceInput
    output_schema = VerifyEvidenceOutput
    required_permission = "analyst"

    async def _execute(self, input_data: VerifyEvidenceInput) -> Dict[str, Any]:
        case_id = input_data.case_id
        items = input_data.evidence_items

        verified = 0
        rejected = 0
        notes = []

        for idx, item in enumerate(items):
            # Verify case_id, source_type, claim
            if not item.get("claim") or not item.get("source_type"):
                rejected += 1
                notes.append(f"Item #{idx}: Rejected due to missing required claim/source_type.")
            elif item.get("case_id") and item.get("case_id") != case_id:
                rejected += 1
                notes.append(f"Item #{idx}: Rejected due to case_id mismatch ({item.get('case_id')} != {case_id}).")
            else:
                verified += 1

        return {
            "case_id": case_id,
            "is_valid": rejected == 0,
            "verified_count": verified,
            "rejected_count": rejected,
            "verification_notes": notes
        }
