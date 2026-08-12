from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.tools.base import BaseTool
from app.patterns.engine import pattern_engine


class DetectPatternsInput(BaseModel):
    transaction: Dict[str, Any]
    device_linked_accounts: Optional[List[str]] = None
    ip_linked_accounts: Optional[List[str]] = None
    account_recent_txns: Optional[List[Dict[str, Any]]] = None
    historical_avg_amount: Optional[float] = None
    previous_txn: Optional[Dict[str, Any]] = None
    account_created_at: Optional[str] = None


class DetectPatternsOutput(BaseModel):
    pattern_count: int
    detected_patterns: List[Dict[str, Any]] = Field(default_factory=list)


class DetectPatternsTool(BaseTool):
    name = "detect_patterns"
    description = "Run deterministic detectors to identify behavioral anomalies (shared device, shared IP, velocity, geographic impossibility)"
    input_schema = DetectPatternsInput
    output_schema = DetectPatternsOutput
    required_permission = "analyst"

    async def _execute(self, input_data: DetectPatternsInput) -> Dict[str, Any]:
        matches = pattern_engine.analyze_transaction(
            transaction=input_data.transaction,
            device_linked_accounts=input_data.device_linked_accounts,
            ip_linked_accounts=input_data.ip_linked_accounts,
            account_recent_txns=input_data.account_recent_txns,
            historical_avg_amount=input_data.historical_avg_amount,
            previous_txn=input_data.previous_txn,
            account_created_at=input_data.account_created_at
        )

        pattern_dicts = [m.model_dump() for m in matches]
        return {
            "pattern_count": len(pattern_dicts),
            "detected_patterns": pattern_dicts
        }
