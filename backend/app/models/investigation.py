from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Float, ForeignKey, Index, Text, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, generate_uuid


class Investigation(Base, TimestampMixin):
    __tablename__ = "investigations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    transaction_id: Mapped[str] = mapped_column(String(36), ForeignKey("transactions.id"), unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="CREATED", index=True, nullable=False)

    risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    risk_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    hypothesis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    summary_report: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    evidence_items: Mapped[List["InvestigationEvidence"]] = relationship("InvestigationEvidence", back_populates="investigation", cascade="all, delete-orphan")
    tool_executions: Mapped[List["ToolExecution"]] = relationship("ToolExecution", back_populates="investigation", cascade="all, delete-orphan")
    analyst_decisions: Mapped[List["AnalystDecision"]] = relationship("AnalystDecision", back_populates="investigation", cascade="all, delete-orphan")


class InvestigationEvidence(Base, TimestampMixin):
    __tablename__ = "investigation_evidence"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    investigation_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), index=True, nullable=False)

    source_type: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    source_reference: Mapped[str] = mapped_column(String(255), nullable=False)
    claim: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    evidence_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    tool_execution_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    investigation: Mapped["Investigation"] = relationship("Investigation", back_populates="evidence_items")


class ToolExecution(Base):
    __tablename__ = "tool_executions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    investigation_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), index=True, nullable=False)

    tool_name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    input_params: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    output_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    status: Mapped[str] = mapped_column(String(50), default="SUCCESS", nullable=False)
    duration_ms: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    executed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    investigation: Mapped["Investigation"] = relationship("Investigation", back_populates="tool_executions")


class AnalystDecision(Base, TimestampMixin):
    __tablename__ = "analyst_decisions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    investigation_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), index=True, nullable=False)
    analyst_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True, nullable=False)

    decision: Mapped[str] = mapped_column(String(50), nullable=False)  # CONFIRM_FRAUD, REJECT_FRAUD, REQUEST_MORE_INFO
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    investigation: Mapped["Investigation"] = relationship("Investigation", back_populates="analyst_decisions")
