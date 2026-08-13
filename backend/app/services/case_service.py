import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel
from app.domain.state import (
    CaseRecord, InvestigationState, InvestigationReport,
    InvestigationRunRecord, AnalystDecisionRecord, AnalystNoteRecord,
    CaseUpdateRecord, EvidenceItem
)
from app.harness import InvestigationHarness
from app.core.logging import logger

# Primary Case Storage & Persistence Manager
CASE_REPOSITORY: Dict[str, CaseRecord] = {}


class ReportComparisonResult(BaseModel):
    case_id: str
    version_a: int
    version_b: int
    risk_score_diff: float
    risk_level_changed: bool
    risk_level_a: str
    risk_level_b: str
    primary_hypothesis_a: str
    primary_hypothesis_b: str
    new_evidence: List[EvidenceItem]
    removed_evidence: List[EvidenceItem]
    new_patterns: List[str]
    removed_patterns: List[str]
    recommendation_a: str
    recommendation_b: str


class CaseService:
    def __init__(self):
        self._ensure_initial_cases()

    def _ensure_initial_cases(self):
        """
        Initializes default scenario cases if case repository is empty.
        """
        if CASE_REPOSITORY:
            return

        default_txns = [
            ("TXN-ATO-1001", "Account Takeover Attack Investigation", "CRITICAL", 0.94),
            ("TXN-VEL-2002", "Bot Velocity Rapid Micro-Transactions", "HIGH", 0.88),
            ("TXN-GEO-3003", "Geographic Impossible Travel Anomaly", "CRITICAL", 0.91),
            ("TXN-AMT-4004", "High Amount Deviation on New Account", "HIGH", 0.85),
            ("TXN-LEG-5005", "Household Shared Device Activity", "LOW", 0.12)
        ]

        harness = InvestigationHarness()

        for txn_id, title, risk_level, default_score in default_txns:
            case_id = f"CASE-{txn_id.replace('TXN-', '')}"
            init_state = harness.initialize_case(transaction_id=txn_id, case_id=case_id, run_number=1, trigger_reason="System Alert")
            
            # Synchronously prepare baseline state
            case_record = CaseRecord(
                case_id=case_id,
                transaction_id=txn_id,
                title=title,
                status="REPORT_READY",
                risk_score=default_score,
                risk_level=risk_level,
                created_at=datetime.now(timezone.utc).isoformat(),
                updated_at=datetime.now(timezone.utc).isoformat()
            )
            CASE_REPOSITORY[case_id] = case_record

    async def get_or_create_case(self, case_id_or_txn_id: str, title: Optional[str] = None) -> CaseRecord:
        # Check by case_id or transaction_id
        for case in CASE_REPOSITORY.values():
            if case.case_id == case_id_or_txn_id or case.transaction_id == case_id_or_txn_id:
                if title and case.title.startswith("Investigation for"):
                    case.title = title
                return case

        # Create new case if not found
        txn_id = case_id_or_txn_id if case_id_or_txn_id.startswith("TXN-") else f"TXN-{case_id_or_txn_id.replace('CASE-', '')}"
        case_id = case_id_or_txn_id if case_id_or_txn_id.startswith("CASE-") else f"CASE-{case_id_or_txn_id.replace('TXN-', '')}"

        harness = InvestigationHarness()
        state = harness.initialize_case(transaction_id=txn_id, case_id=case_id, run_number=1, trigger_reason="Manual Ingestion")
        completed_state = await harness.run_to_completion(state)

        report = completed_state.report
        run_rec = InvestigationRunRecord(
            run_id=completed_state.run_id,
            case_id=case_id,
            run_number=1,
            status="SUCCESS" if report else "FAILED",
            trigger_reason="Initial Ingestion Investigation",
            step_count=completed_state.step_count,
            started_at=datetime.now(timezone.utc).isoformat(),
            completed_at=datetime.now(timezone.utc).isoformat()
        )

        computed_title = title
        if not computed_title:
            if report and report.primary_hypothesis and not report.primary_hypothesis.startswith("Transaction"):
                computed_title = report.primary_hypothesis[:60]
            else:
                computed_title = f"Investigation for {txn_id}"

        case_record = CaseRecord(
            case_id=case_id,
            transaction_id=txn_id,
            title=computed_title,
            status="REPORT_READY" if report else "INVESTIGATING",
            risk_score=completed_state.risk_score or 0.50,
            risk_level=completed_state.risk_level or "MEDIUM",
            current_report=report,
            reports_history=[report] if report else [],
            investigation_runs=[run_rec],
            evidence=completed_state.evidence,
            created_at=datetime.now(timezone.utc).isoformat(),
            updated_at=datetime.now(timezone.utc).isoformat()
        )
        CASE_REPOSITORY[case_id] = case_record
        return case_record

    async def run_investigation(self, case_id_or_txn_id: str, trigger_reason: str = "Analyst Requested Re-Investigation", custom_title: Optional[str] = None) -> CaseRecord:
        case = await self.get_or_create_case(case_id_or_txn_id, title=custom_title)
        if custom_title:
            case.title = custom_title

        next_run_number = len(case.investigation_runs) + 1

        harness = InvestigationHarness()
        state = harness.initialize_case(
            transaction_id=case.transaction_id,
            case_id=case.case_id,
            run_number=next_run_number,
            trigger_reason=trigger_reason
        )

        # Preserve existing evidence & analyst notes into state
        state.evidence.extend(case.evidence)
        state.reports_history.extend(case.reports_history)

        completed_state = await harness.run_to_completion(state)
        new_report = completed_state.report

        run_status = "SUCCESS" if new_report else "FAILED"
        run_rec = InvestigationRunRecord(
            run_id=completed_state.run_id,
            case_id=case.case_id,
            run_number=next_run_number,
            status=run_status,
            trigger_reason=trigger_reason,
            step_count=completed_state.step_count,
            started_at=datetime.now(timezone.utc).isoformat(),
            completed_at=datetime.now(timezone.utc).isoformat(),
            error_message="; ".join(completed_state.errors) if completed_state.errors else None
        )
        case.investigation_runs.append(run_rec)

        if new_report:
            new_report.is_current = True
            for r in case.reports_history:
                r.is_current = False
            case.reports_history.append(new_report)
            case.current_report = new_report
            case.risk_score = new_report.risk_score
            case.risk_level = new_report.risk_level
            case.status = "REPORT_READY"
            
            # If title is default, refine title with primary hypothesis
            if case.title.startswith("Investigation for") and new_report.primary_hypothesis:
                clean_hyp = new_report.primary_hypothesis.strip('"').strip("'")
                if len(clean_hyp) > 65:
                    clean_hyp = clean_hyp[:65] + "..."
                case.title = clean_hyp

        # Record case update event
        update_rec = CaseUpdateRecord(
            case_id=case.case_id,
            update_type="REINVESTIGATION_TRIGGERED",

            description=f"Investigation Run #{next_run_number} completed with status '{run_status}' (Trigger: {trigger_reason})."
        )
        case.case_updates.append(update_rec)
        case.evidence = completed_state.evidence
        case.updated_at = datetime.now(timezone.utc).isoformat()

        CASE_REPOSITORY[case.case_id] = case
        return case

    def add_analyst_note(self, case_id: str, note_text: str, author_id: str = "ANALYST-001") -> CaseRecord:
        if case_id not in CASE_REPOSITORY:
            raise KeyError(f"Case {case_id} not found.")

        case = CASE_REPOSITORY[case_id]
        note = AnalystNoteRecord(case_id=case_id, author_id=author_id, note_text=note_text)
        case.analyst_notes.append(note)

        update = CaseUpdateRecord(
            case_id=case_id,
            author_id=author_id,
            update_type="NOTE_ADDED",
            description=f"Analyst note added: '{note_text[:50]}...'"
        )
        case.case_updates.append(update)
        case.updated_at = datetime.now(timezone.utc).isoformat()

        CASE_REPOSITORY[case_id] = case
        return case

    def submit_decision(self, case_id: str, decision: str, notes: Optional[str] = None, analyst_id: str = "ANALYST-001") -> CaseRecord:
        if case_id not in CASE_REPOSITORY:
            raise KeyError(f"Case {case_id} not found.")

        case = CASE_REPOSITORY[case_id]
        dec_rec = AnalystDecisionRecord(
            case_id=case_id,
            analyst_id=analyst_id,
            decision=decision,
            notes=notes
        )
        case.analyst_decision = dec_rec
        case.status = "DECIDED"

        update = CaseUpdateRecord(
            case_id=case_id,
            author_id=analyst_id,
            update_type="STATUS_CHANGE",
            description=f"Human Decision Submitted: {decision}. Case status set to DECIDED."
        )
        case.case_updates.append(update)
        case.updated_at = datetime.now(timezone.utc).isoformat()

        CASE_REPOSITORY[case_id] = case
        return case

    def compare_reports(self, case_id: str, version_a: int, version_b: int) -> ReportComparisonResult:
        if case_id not in CASE_REPOSITORY:
            raise KeyError(f"Case {case_id} not found.")

        case = CASE_REPOSITORY[case_id]
        rep_a = next((r for r in case.reports_history if r.version == version_a), None)
        rep_b = next((r for r in case.reports_history if r.version == version_b), None)

        if not rep_a or not rep_b:
            raise ValueError(f"Report versions {version_a} and/or {version_b} not found for case {case_id}.")

        score_diff = round(rep_b.risk_score - rep_a.risk_score, 4)
        level_changed = rep_a.risk_level != rep_b.risk_level

        ev_ids_a = {e.evidence_id for e in rep_a.supporting_evidence}
        ev_ids_b = {e.evidence_id for e in rep_b.supporting_evidence}

        new_ev = [e for e in rep_b.supporting_evidence if e.evidence_id not in ev_ids_a]
        removed_ev = [e for e in rep_a.supporting_evidence if e.evidence_id not in ev_ids_b]

        return ReportComparisonResult(
            case_id=case_id,
            version_a=version_a,
            version_b=version_b,
            risk_score_diff=score_diff,
            risk_level_changed=level_changed,
            risk_level_a=rep_a.risk_level,
            risk_level_b=rep_b.risk_level,
            primary_hypothesis_a=rep_a.primary_hypothesis,
            primary_hypothesis_b=rep_b.primary_hypothesis,
            new_evidence=new_ev,
            removed_evidence=removed_ev,
            new_patterns=[],
            removed_patterns=[],
            recommendation_a=rep_a.recommended_action,
            recommendation_b=rep_b.recommended_action
        )

    def list_cases(
        self,
        risk_level: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "newest"
    ) -> List[CaseRecord]:
        results = list(CASE_REPOSITORY.values())

        if risk_level:
            results = [c for c in results if c.risk_level == risk_level.upper()]

        if status:
            results = [c for c in results if c.status == status.upper()]

        if search:
            q = search.lower()
            results = [c for c in results if q in c.case_id.lower() or q in c.transaction_id.lower() or q in c.title.lower()]

        if sort_by == "highest_risk":
            results.sort(key=lambda c: c.risk_score, reverse=True)
        elif sort_by == "newest":
            results.sort(key=lambda c: c.created_at, reverse=True)
        elif sort_by == "recently_updated":
            results.sort(key=lambda c: c.updated_at, reverse=True)

        return results


case_service = CaseService()
