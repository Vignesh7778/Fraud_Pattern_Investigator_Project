from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.core.audit import audit_tracker
from app.services.case_service import case_service

router = APIRouter(prefix="/api/v1/audit", tags=["audit"])


@router.get("/logs", response_model=List[Dict[str, Any]])
async def list_audit_logs(
    query: Optional[str] = None,
    event_type: Optional[str] = None,
    case_id: Optional[str] = None,
    actor: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """
    Returns paginated append-only audit event log records.
    """
    events = audit_tracker.events

    # Convert tracked events to dict representation
    records = [e.model_dump() for e in events]

    # Include case updates from persistent CaseRepository
    cases = case_service.list_cases()
    for c in cases:
        for update in c.case_updates:
            records.append({
                "event_id": update.update_id,
                "request_id": f"REQ-{update.update_id[:6]}",
                "case_id": c.case_id,
                "user_id": update.author_id,
                "event_type": update.update_type,
                "harness_state": c.status,
                "details": {"description": update.description},
                "timestamp": update.created_at
            })

    # Apply filters
    if case_id:
        records = [r for r in records if r.get("case_id") == case_id]

    if event_type and event_type != "ALL":
        records = [r for r in records if r.get("event_type") == event_type]

    if actor:
        records = [r for r in records if r.get("user_id") == actor]

    if query:
        q = query.lower()
        records = [r for r in records if q in str(r).lower()]

    # Sort newest first
    records.sort(key=lambda r: str(r.get("timestamp", "")), reverse=True)

    # Paginate
    return records[offset:offset+limit]


@router.get("/metrics", response_model=Dict[str, Any])
async def get_observability_metrics():
    return audit_tracker.metrics.get_metrics_summary()


@router.get("/{case_id}", response_model=List[Dict[str, Any]])
async def get_case_audit_timeline(case_id: str):
    timeline = audit_tracker.reconstruct_investigation_timeline(case_id)
    return timeline
