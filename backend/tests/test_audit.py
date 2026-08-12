import pytest
from app.core.audit import audit_tracker, AuditEventTracker, MetricsRegistry


def test_audit_event_recording_and_timeline_reconstruction():
    tracker = AuditEventTracker()
    case_id = "CASE-AUDIT-99"

    tracker.record_event("REQ-1", case_id, "USR-1", "STEP_TRANSITION", "CREATED")
    tracker.record_event("REQ-1", case_id, "USR-1", "TOOL_CALL", "EXECUTE_TOOL", tool_name="fetch_transaction", tool_latency_ms=12.5)
    tracker.record_event("REQ-1", case_id, "USR-1", "STEP_TRANSITION", "HUMAN_REVIEW")

    timeline = tracker.reconstruct_investigation_timeline(case_id)
    assert len(timeline) == 3
    assert timeline[0]["harness_state"] == "CREATED"
    assert timeline[1]["tool_name"] == "fetch_transaction"
    assert timeline[2]["harness_state"] == "HUMAN_REVIEW"


def test_metrics_registry_summary_calculations():
    metrics = MetricsRegistry()
    metrics.record_tool_execution("fetch_transaction", latency_ms=15.0, success=True)
    metrics.record_tool_execution("run_fraud_model", latency_ms=45.0, success=True)
    metrics.record_tool_execution("bad_tool", latency_ms=5.0, success=False)

    metrics.record_investigation_complete(duration_s=2.5, success=True)

    summary = metrics.get_metrics_summary()
    assert summary["tool_latency_avg_ms"] == 21.67
    assert summary["tool_failure_rate"] == 0.3333
    assert summary["investigation_success_rate"] == 1.0
