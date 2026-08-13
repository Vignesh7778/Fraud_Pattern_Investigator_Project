import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class EvidenceItem(BaseModel):
    evidence_id: str = Field(default_factory=lambda: f"EVD-{str(uuid.uuid4())[:8]}")
    case_id: str
    source_type: str  # transaction_data, account_history, ml_model, pattern_engine, graph_analysis, policy_rag, historical_case, file_upload, analyst_input
    source_reference: str  # e.g., txn:TXN1001, device:D22, policy:POL-001
    claim: str
    value_reference: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = 1.0
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    tool_execution_id: Optional[str] = None


class Hypothesis(BaseModel):
    hypothesis_id: str = Field(default_factory=lambda: f"HYP-{str(uuid.uuid4())[:8]}")
    title: str
    description: str
    confidence: float = 0.50
    status: str = "ACTIVE"  # ACTIVE, CONFIRMED, DISPROVED
    supporting_evidence_ids: List[str] = Field(default_factory=list)
    contradicting_evidence_ids: List[str] = Field(default_factory=list)


class PatternFinding(BaseModel):
    pattern_id: str
    severity: str
    confidence: float
    description: str
    evidence_ids: List[str] = Field(default_factory=list)


class LinkedEntity(BaseModel):
    entity_type: str
    entity_id: str
    relationship: str
    confidence: float = 1.0


class ToolExecutionRecord(BaseModel):
    execution_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tool_name: str
    input_params: Dict[str, Any]
    output_data: Optional[Dict[str, Any]] = None
    status: str = "SUCCESS"
    duration_ms: float = 0.0
    executed_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class InvestigationReport(BaseModel):
    report_id: str = Field(default_factory=lambda: f"REP-{str(uuid.uuid4())[:8]}")
    case_id: str
    transaction_id: str
    investigation_run_id: str = Field(default_factory=lambda: f"RUN-{str(uuid.uuid4())[:8]}")
    version: int = 1
    is_current: bool = True
    status: str = "SUCCESS"  # SUCCESS, LEGACY_REPORT

    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    risk_score: float
    primary_hypothesis: str
    alternative_hypotheses: List[str] = Field(default_factory=list)
    supporting_evidence: List[EvidenceItem] = Field(default_factory=list)
    contradicting_evidence: List[EvidenceItem] = Field(default_factory=list)
    linked_entities: List[LinkedEntity] = Field(default_factory=list)
    relevant_policies: List[Dict[str, Any]] = Field(default_factory=list)
    confidence: float = 0.90
    recommended_action: str
    limitations: List[str] = Field(default_factory=list)
    model_versions: Dict[str, str] = Field(default_factory=dict)
    harness_version: str = "v1.0"
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class InvestigationRunRecord(BaseModel):
    run_id: str = Field(default_factory=lambda: f"RUN-{str(uuid.uuid4())[:8]}")
    case_id: str
    run_number: int = 1
    status: str = "RUNNING"  # RUNNING, SUCCESS, FAILED, CANCELLED
    trigger_reason: str = "Initial Investigation"
    step_count: int = 0
    started_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None
    error_message: Optional[str] = None


class AnalystDecisionRecord(BaseModel):
    decision_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    case_id: str
    analyst_id: str = "ANALYST-001"
    decision: str  # CONFIRM_FRAUD, REJECT_FRAUD, REQUEST_MORE_INFO, ESCALATE
    notes: Optional[str] = None
    decided_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AnalystNoteRecord(BaseModel):
    note_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    case_id: str
    author_id: str = "ANALYST-001"
    note_text: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CaseUpdateRecord(BaseModel):
    update_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    case_id: str
    author_id: str = "ANALYST-001"
    update_type: str  # NEW_EVIDENCE, NOTE_ADDED, STATUS_CHANGE, REINVESTIGATION_TRIGGERED
    description: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class InvestigationState(BaseModel):
    case_id: str = Field(default_factory=lambda: f"CASE-{str(uuid.uuid4())[:8]}")
    transaction_id: str
    run_id: str = Field(default_factory=lambda: f"RUN-{str(uuid.uuid4())[:8]}")
    run_number: int = 1

    status: str = "CREATED"  # CREATED, LOAD_CASE, INITIAL_ASSESSMENT, PLAN, EXECUTE_TOOL, VALIDATE_RESULT, APPEND_EVIDENCE, CHECK_SUFFICIENCY, REPLAN, CONTRADICTION_CHECK, GENERATE_REPORT, HUMAN_REVIEW, FINAL_DECISION, AUDIT, FAILED
    objective: str = "Investigate suspicious financial transaction"
    step_count: int = 0
    max_steps: int = 30

    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    risk_model_version: Optional[str] = None

    hypotheses: List[Hypothesis] = Field(default_factory=list)
    evidence: List[EvidenceItem] = Field(default_factory=list)
    linked_entities: List[LinkedEntity] = Field(default_factory=list)
    patterns: List[PatternFinding] = Field(default_factory=list)
    retrieved_policies: List[Dict[str, Any]] = Field(default_factory=list)
    contradictions: List[EvidenceItem] = Field(default_factory=list)
    tool_history: List[ToolExecutionRecord] = Field(default_factory=list)
    report: Optional[InvestigationReport] = None
    reports_history: List[InvestigationReport] = Field(default_factory=list)
    analyst_decision: Optional[AnalystDecisionRecord] = None
    errors: List[str] = Field(default_factory=list)


class CaseRecord(BaseModel):
    case_id: str = Field(default_factory=lambda: f"CASE-{str(uuid.uuid4())[:8]}")
    transaction_id: str
    title: str
    status: str = "DRAFT"  # DRAFT, READY, INVESTIGATING, REPORT_READY, HUMAN_REVIEW, DECIDED, REOPENED, ARCHIVED
    risk_score: float = 0.50
    risk_level: str = "MEDIUM"

    current_report: Optional[InvestigationReport] = None
    reports_history: List[InvestigationReport] = Field(default_factory=list)
    investigation_runs: List[InvestigationRunRecord] = Field(default_factory=list)
    evidence: List[EvidenceItem] = Field(default_factory=list)
    analyst_notes: List[AnalystNoteRecord] = Field(default_factory=list)
    case_updates: List[CaseUpdateRecord] = Field(default_factory=list)
    analyst_decision: Optional[AnalystDecisionRecord] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
