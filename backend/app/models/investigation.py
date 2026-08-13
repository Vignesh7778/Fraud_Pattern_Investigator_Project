from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Float, Integer, Boolean, ForeignKey, Index, Text, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, generate_uuid


class Case(Base, TimestampMixin):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    transaction_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="DRAFT", index=True, nullable=False)
    # Status values: DRAFT, READY, INVESTIGATING, REPORT_READY, HUMAN_REVIEW, DECIDED, REOPENED, ARCHIVED

    risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    risk_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    current_report_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # Relationships
    investigation_runs: Mapped[List["InvestigationRun"]] = relationship("InvestigationRun", back_populates="case", cascade="all, delete-orphan")
    report_versions: Mapped[List["ReportVersion"]] = relationship("ReportVersion", back_populates="case", cascade="all, delete-orphan")
    evidence_items: Mapped[List["InvestigationEvidence"]] = relationship("InvestigationEvidence", back_populates="case", cascade="all, delete-orphan")
    case_updates: Mapped[List["CaseUpdate"]] = relationship("CaseUpdate", back_populates="case", cascade="all, delete-orphan")
    analyst_notes: Mapped[List["AnalystNote"]] = relationship("AnalystNote", back_populates="case", cascade="all, delete-orphan")
    analyst_decisions: Mapped[List["AnalystDecision"]] = relationship("AnalystDecision", back_populates="case", cascade="all, delete-orphan")


class InvestigationRun(Base):
    __tablename__ = "investigation_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), index=True, nullable=False)
    run_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="RUNNING", nullable=False)
    # Status: RUNNING, SUCCESS, FAILED, CANCELLED

    trigger_reason: Mapped[str] = mapped_column(String(255), default="Initial Investigation", nullable=False)
    step_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    case: Mapped["Case"] = relationship("Case", back_populates="investigation_runs")
    reports: Mapped[List["ReportVersion"]] = relationship("ReportVersion", back_populates="investigation_run")
    tool_executions: Mapped[List["ToolExecution"]] = relationship("ToolExecution", back_populates="investigation_run", cascade="all, delete-orphan")


class ReportVersion(Base, TimestampMixin):
    __tablename__ = "report_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), index=True, nullable=False)
    investigation_run_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigation_runs.id", ondelete="CASCADE"), index=True, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="SUCCESS", nullable=False)

    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.90, nullable=False)
    primary_hypothesis: Mapped[str] = mapped_column(Text, nullable=False)
    alternative_hypotheses: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    supporting_evidence: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    contradicting_evidence: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    relevant_policies: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    recommended_action: Mapped[str] = mapped_column(String(100), nullable=False)
    limitations: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    model_versions: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    case: Mapped["Case"] = relationship("Case", back_populates="report_versions")
    investigation_run: Mapped["InvestigationRun"] = relationship("InvestigationRun", back_populates="reports")


class InvestigationEvidence(Base, TimestampMixin):
    __tablename__ = "investigation_evidence"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), index=True, nullable=False)

    source_type: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    source_reference: Mapped[str] = mapped_column(String(255), nullable=False)
    claim: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    evidence_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    tool_execution_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    case: Mapped["Case"] = relationship("Case", back_populates="evidence_items")


class ToolExecution(Base):
    __tablename__ = "tool_executions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    investigation_run_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigation_runs.id", ondelete="CASCADE"), index=True, nullable=False)

    tool_name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    input_params: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    output_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    status: Mapped[str] = mapped_column(String(50), default="SUCCESS", nullable=False)
    duration_ms: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    executed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    investigation_run: Mapped["InvestigationRun"] = relationship("InvestigationRun", back_populates="tool_executions")


class AnalystDecision(Base, TimestampMixin):
    __tablename__ = "analyst_decisions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), index=True, nullable=False)
    analyst_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)

    decision: Mapped[str] = mapped_column(String(50), nullable=False)  # CONFIRM_FRAUD, REJECT_FRAUD, REQUEST_MORE_INFO, ESCALATE
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    case: Mapped["Case"] = relationship("Case", back_populates="analyst_decisions")


class CaseUpdate(Base, TimestampMixin):
    __tablename__ = "case_updates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), index=True, nullable=False)
    author_id: Mapped[str] = mapped_column(String(100), default="ANALYST-001", nullable=False)

    update_type: Mapped[str] = mapped_column(String(100), nullable=False)  # NEW_EVIDENCE, NOTE_ADDED, STATUS_CHANGE, REINVESTIGATION_TRIGGERED
    description: Mapped[str] = mapped_column(Text, nullable=False)

    case: Mapped["Case"] = relationship("Case", back_populates="case_updates")


class AnalystNote(Base, TimestampMixin):
    __tablename__ = "analyst_notes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), index=True, nullable=False)
    author_id: Mapped[str] = mapped_column(String(100), default="ANALYST-001", nullable=False)

    note_text: Mapped[str] = mapped_column(Text, nullable=False)

    case: Mapped["Case"] = relationship("Case", back_populates="analyst_notes")
