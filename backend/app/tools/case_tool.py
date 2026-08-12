from typing import Dict, Any, List
from pydantic import BaseModel, Field
from app.tools.base import BaseTool


class FindSimilarCasesInput(BaseModel):
    pattern_label: str = Field(description="Fraud pattern label e.g. shared_device, velocity")


class FindSimilarCasesOutput(BaseModel):
    pattern_label: str
    similar_cases: List[Dict[str, Any]] = Field(default_factory=list)


class FindSimilarCasesTool(BaseTool):
    name = "find_similar_cases"
    description = "Search historical investigation database for prior case resolutions matching the detected pattern"
    input_schema = FindSimilarCasesInput
    output_schema = FindSimilarCasesOutput
    required_permission = "analyst"

    async def _execute(self, input_data: FindSimilarCasesInput) -> Dict[str, Any]:
        return {
            "pattern_label": input_data.pattern_label,
            "similar_cases": [
                {
                    "case_reference": "CASE-2025-0891",
                    "pattern_label": input_data.pattern_label,
                    "summary": "Shared device pool utilized by compromised account takeover network across 8 user accounts.",
                    "resolution": "Confirmed Fraud. Account access revoked.",
                    "similarity_score": 0.92
                }
            ]
        }
