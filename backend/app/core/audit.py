import time
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.core.logging import logger


class AuditEventRecord(BaseModel):
    event_id: str
    request_id: str
    case_id: str
    user_id: str
    event_type: str  # STEP_TRANSITION, TOOL_CALL, LLM_CALL, REPORT_GENERATION, HUMAN_DECISION
    harness_state: str
    tool_name: Optional[str] = None
    tool_latency_ms: Optional[float] = None
    retry_count: int = 0
    replan_count: int = 0
    llm_latency_ms: Optional[float] = None
    model_version: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    timestamp: float = Field(default_factory=lambda: time.time())


class MetricsRegistry:
    """
    OpenTelemetry / Prometheus style metric counters and histograms.
    """
    def __init__(self):
        self.investigation_durations: List[float] = []
        self.tool_latencies: List[float] = []
        self.tool_failures: int = 0
        self.tool_successes: int = 0
        self.llm_latencies: List[float] = []
        self.total_investigations: int = 0
        self.successful_investigations: int = 0
        self.unsupported_claims: int = 0
        self.analyst_disagreements: int = 0

    def record_tool_execution(self, tool_name: str, latency_ms: float, success: bool):
        self.tool_latencies.append(latency_ms)
        if success:
            self.tool_successes += 1
        else:
            self.tool_failures += 1

    def record_investigation_complete(self, duration_s: float, success: bool):
        self.total_investigations += 1
        self.investigation_durations.append(duration_s)
        if success:
            self.successful_investigations += 1

    def get_metrics_summary(self) -> Dict[str, Any]:
        avg_tool_latency = (sum(self.tool_latencies) / max(1, len(self.tool_latencies))) if self.tool_latencies else 0.0
        avg_inv_duration = (sum(self.investigation_durations) / max(1, len(self.investigation_durations))) if self.investigation_durations else 0.0
        tool_total = self.tool_successes + self.tool_failures
        fail_rate = round(self.tool_failures / max(1, tool_total), 4)
        success_rate = round(self.successful_investigations / max(1, self.total_investigations), 4)

        return {
            "investigation_duration_avg_seconds": round(avg_inv_duration, 2),
            "tool_latency_avg_ms": round(avg_tool_latency, 2),
            "tool_failure_rate": fail_rate,
            "investigation_success_rate": success_rate,
            "unsupported_claim_rate": round(self.unsupported_claims / max(1, self.total_investigations), 4),
            "analyst_disagreement_rate": round(self.analyst_disagreements / max(1, self.total_investigations), 4)
        }


class AuditEventTracker:
    def __init__(self):
        self.events: List[AuditEventRecord] = []
        self.metrics = MetricsRegistry()

    def record_event(
        self,
        request_id: str,
        case_id: str,
        user_id: str,
        event_type: str,
        harness_state: str,
        tool_name: Optional[str] = None,
        tool_latency_ms: Optional[float] = None,
        retry_count: int = 0,
        replan_count: int = 0,
        llm_latency_ms: Optional[float] = None,
        model_version: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> AuditEventRecord:
        import uuid
        record = AuditEventRecord(
            event_id=f"AUD-{str(uuid.uuid4())[:8]}",
            request_id=request_id,
            case_id=case_id,
            user_id=user_id,
            event_type=event_type,
            harness_state=harness_state,
            tool_name=tool_name,
            tool_latency_ms=tool_latency_ms,
            retry_count=retry_count,
            replan_count=replan_count,
            llm_latency_ms=llm_latency_ms,
            model_version=model_version,
            details=details or {}
        )
        self.events.append(record)
        logger.info("audit_event_recorded", event_id=record.event_id, case_id=case_id, event_type=event_type, state=harness_state)
        return record

    def reconstruct_investigation_timeline(self, case_id: str) -> List[Dict[str, Any]]:
        case_events = [e for e in self.events if e.case_id == case_id]
        case_events.sort(key=lambda x: x.timestamp)
        return [e.model_dump() for e in case_events]


audit_tracker = AuditEventTracker()
