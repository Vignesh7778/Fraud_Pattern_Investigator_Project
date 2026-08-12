from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException
from app.core.audit import audit_tracker

router = APIRouter(prefix="/api/v1/audit", tags=["audit"])


@router.get("/metrics", response_model=Dict[str, Any])
async def get_observability_metrics():
    return audit_tracker.metrics.get_metrics_summary()


@router.get("/{case_id}", response_model=List[Dict[str, Any]])
async def get_case_audit_timeline(case_id: str):
    timeline = audit_tracker.reconstruct_investigation_timeline(case_id)
    return timeline
