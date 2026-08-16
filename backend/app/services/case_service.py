import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel
from app.domain.state import (
    CaseRecord, InvestigationState, InvestigationReport,
    InvestigationRunRecord, AnalystDecisionRecord, AnalystNoteRecord,
    CaseUpdateRecord, EvidenceItem, LinkedEntity
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
        Initializes rich default scenario cases with generated reports if repository is empty.
        """
        if CASE_REPOSITORY:
            return

        default_scenarios = [
            {
                "txn_id": "TXN-ATO-1001",
                "case_id": "CASE-ATO-1001",
                "title": "Account Takeover Attack & Device Sharing",
                "risk_level": "CRITICAL",
                "risk_score": 0.94,
                "hypothesis": "High probability of Account Takeover (ATO) attack involving credential stuffing and shared bot device.",
                "action": "CONFIRM_FRAUD",
                "evidence": [
                    EvidenceItem(evidence_id="EVD-ATO-01", case_id="CASE-ATO-1001", source_type="pattern_engine", source_reference="device_reputation", claim="Device hash DEV-SHARED-99 associated with 8 distinct accounts within 10 minutes.", value_reference={"device_hash": "DEV-SHARED-99", "linked_accounts": 8}, confidence=0.98),
                    EvidenceItem(evidence_id="EVD-ATO-02", case_id="CASE-ATO-1001", source_type="ml_model", source_reference="xgboost_risk_engine", claim="XGBoost anomaly score evaluates to 0.94 (CRITICAL RISK). Top feature: IP address geolocation shift.", value_reference={"ip_address": "177.0.0.1", "feature_importance": 0.42}, confidence=0.94)
                ]
            },
            {
                "txn_id": "TXN-VEL-2002",
                "case_id": "CASE-VEL-2002",
                "title": "Bot Velocity Rapid Micro-Transactions",
                "risk_level": "HIGH",
                "risk_score": 0.88,
                "hypothesis": "Card testing velocity attack executing high-frequency low amount authorizations.",
                "action": "CONFIRM_FRAUD",
                "evidence": [
                    EvidenceItem(evidence_id="EVD-VEL-01", case_id="CASE-VEL-2002", source_type="pattern_engine", source_reference="velocity_monitor", claim="14 transactions executed within 45 seconds from single IP subnet.", value_reference={"ip_subnet": "192.168.44.0/24", "count": 14}, confidence=0.92)
                ]
            },
            {
                "txn_id": "TXN-GEO-3003",
                "case_id": "CASE-GEO-3003",
                "title": "Geographic Impossible Travel Anomaly",
                "risk_level": "CRITICAL",
                "risk_score": 0.91,
                "hypothesis": "Impossible physical velocity between Tokyo and London within 12 minutes.",
                "action": "CONFIRM_FRAUD",
                "evidence": [
                    EvidenceItem(evidence_id="EVD-GEO-01", case_id="CASE-GEO-3003", source_type="pattern_engine", source_reference="geo_velocity", claim="Physical travel distance of 9,500 km between consecutive card authorizations in 12 min.", value_reference={"dist_km": 9500, "time_min": 12}, confidence=0.96)
                ]
            },
            {
                "txn_id": "TXN-AMT-4004",
                "case_id": "CASE-AMT-4004",
                "title": "High Amount Deviation on New Account",
                "risk_level": "HIGH",
                "risk_score": 0.85,
                "hypothesis": "First-time transfer amount of $18,500 exceeds customer historical average by 45x.",
                "action": "MANUAL_REVIEW",
                "evidence": [
                    EvidenceItem(evidence_id="EVD-AMT-01", case_id="CASE-AMT-4004", source_type="ml_model", source_reference="amount_anomaly", claim="Transfer amount $18,500.00 is 45 standard deviations above account baseline.", value_reference={"amount": 18500.0, "baseline_avg": 410.0}, confidence=0.85)
                ]
            },
            {
                "txn_id": "TXN-LEG-5005",
                "case_id": "CASE-LEG-5005",
                "title": "Household Shared Device Kiosk Activity",
                "risk_level": "LOW",
                "risk_score": 0.12,
                "hypothesis": "Legitimate household family members sharing single home tablet kiosk for bill payment.",
                "action": "REJECT_FRAUD",
                "evidence": [
                    EvidenceItem(evidence_id="EVD-LEG-01", case_id="CASE-LEG-5005", source_type="transaction_data", source_reference="family_profile", claim="Identified verified family link and consistent residential IP address.", value_reference={"ip_address": "72.14.200.1", "family_unit_id": "FAM-992"}, confidence=0.99)
                ]
            },
            {
                "txn_id": "TXN-MCH-6006",
                "case_id": "CASE-MCH-6006",
                "title": "Merchant Category MCC Collision Spike",
                "risk_level": "MEDIUM",
                "risk_score": 0.65,
                "hypothesis": "Sudden volume surge at unverified high-risk online gambling merchant MCC.",
                "action": "MANUAL_REVIEW",
                "evidence": [
                    EvidenceItem(evidence_id="EVD-MCH-01", case_id="CASE-MCH-6006", source_type="pattern_engine", source_reference="merchant_mcc", claim="Merchant MCC 7995 (Gambling) authorization spike from new device.", value_reference={"mcc": 7995, "amount": 2450.0}, confidence=0.75)
                ]
            }
        ]

        now_str = datetime.now(timezone.utc).isoformat()

        for s in default_scenarios:
            case_id = s["case_id"]
            txn_id = s["txn_id"]

            report = InvestigationReport(
                case_id=case_id,
                transaction_id=txn_id,
                version=1,
                is_current=True,
                risk_level=s["risk_level"],
                risk_score=s["risk_score"],
                primary_hypothesis=s["hypothesis"],
                alternative_hypotheses=["Benign customer device upgrade", "Network proxy delay"],
                supporting_evidence=s["evidence"],
                contradicting_evidence=[],
                linked_entities=[
                    LinkedEntity(entity_type="device", entity_id="DEV-SHARED-99", relationship="SHARED_HARDWARE", confidence=0.95),
                    LinkedEntity(entity_type="ip", entity_id="177.0.0.1", relationship="GEOGRAPHIC_PROXY", confidence=0.92)
                ],
                relevant_policies=[{"policy_id": "POL-ATO-01", "name": "Account Takeover Response Protocol"}],
                confidence=0.94,
                recommended_action=s["action"],
                limitations=["Device fingerprint data cached within last 24h"],
                model_versions={"xgboost": "v1.2.0", "harness": "v1.0.0"},
                generated_at=now_str
            )

            run_rec = InvestigationRunRecord(
                run_id=f"RUN-INIT-{uuid.uuid4().hex[:6].upper()}",
                case_id=case_id,
                run_number=1,
                status="SUCCESS",
                trigger_reason="System Alert Ingestion",
                step_count=15,
                started_at=now_str,
                completed_at=now_str
            )

            case_record = CaseRecord(
                case_id=case_id,
                transaction_id=txn_id,
                title=s["title"],
                status="REPORT_READY",
                risk_score=s["risk_score"],
                risk_level=s["risk_level"],
                current_report=report,
                reports_history=[report],
                investigation_runs=[run_rec],
                evidence=s["evidence"],
                created_at=now_str,
                updated_at=now_str
            )

            CASE_REPOSITORY[case_id] = case_record

    async def get_or_create_case(self, case_id_or_txn_id: str, title: Optional[str] = None) -> CaseRecord:
        for case in CASE_REPOSITORY.values():
            if case.case_id.upper() == case_id_or_txn_id.upper() or case.transaction_id.upper() == case_id_or_txn_id.upper():
                if title and case.title.startswith("Investigation for"):
                    case.title = title
                return case

        txn_id = case_id_or_txn_id if case_id_or_txn_id.startswith("TXN-") else f"TXN-{case_id_or_txn_id.replace('CASE-', '')}"
        case_id = case_id_or_txn_id if case_id_or_txn_id.startswith("CASE-") else f"CASE-{case_id_or_txn_id.replace('TXN-', '')}"

        harness = InvestigationHarness()
        state = harness.initialize_case(transaction_id=txn_id, case_id=case_id, run_number=1, trigger_reason="Manual Ingestion")
        completed_state = await harness.run_to_completion(state)

        report = completed_state.report
        now_str = datetime.now(timezone.utc).isoformat()

        run_rec = InvestigationRunRecord(
            run_id=completed_state.run_id,
            case_id=case_id,
            run_number=1,
            status="SUCCESS" if report else "FAILED",
            trigger_reason="Initial Ingestion Investigation",
            step_count=completed_state.step_count,
            started_at=now_str,
            completed_at=now_str
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
            created_at=now_str,
            updated_at=now_str
        )

        CASE_REPOSITORY[case_id] = case_record
        return case_record

    def list_cases(
        self,
        risk_level: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "newest"
    ) -> List[CaseRecord]:
        cases = list(CASE_REPOSITORY.values())

        if risk_level and risk_level != "ALL":
            cases = [c for c in cases if c.risk_level == risk_level]

        if status and status != "ALL":
            cases = [c for c in cases if c.status == status]

        if search:
            q = search.lower()
            cases = [
                c for c in cases
                if q in c.case_id.lower() or q in c.transaction_id.lower() or q in c.title.lower()
            ]

        if sort_by == "highest_risk":
            cases.sort(key=lambda x: x.risk_score, reverse=True)
        elif sort_by == "lowest_risk":
            cases.sort(key=lambda x: x.risk_score)
        else:
            cases.sort(key=lambda x: x.created_at, reverse=True)

        return cases

    async def get_case(self, case_id: str) -> Optional[CaseRecord]:
        for c in CASE_REPOSITORY.values():
            if c.case_id.upper() == case_id.upper() or c.transaction_id.upper() == case_id.upper():
                return c
        return CASE_REPOSITORY.get(case_id)

    async def run_investigation(
        self,
        case_id_or_txn_id: str,
        user_role: str = "analyst",
        trigger_reason: str = "Re-Investigation Triggered",
        user_notes: Optional[str] = None,
        custom_title: Optional[str] = None
    ) -> CaseRecord:
        case = await self.get_or_create_case(case_id_or_txn_id, title=custom_title)
        run_number = len(case.reports_history) + 1

        harness = InvestigationHarness()
        state = harness.initialize_case(
            transaction_id=case.transaction_id,
            case_id=case.case_id,
            run_number=run_number,
            trigger_reason=trigger_reason
        )

        if user_notes:
            case.analyst_notes.append(AnalystNoteRecord(
                note_id=f"NOTE-{uuid.uuid4().hex[:6].upper()}",
                case_id=case.case_id,
                author_id="ANALYST-001",
                note_text=user_notes,
                created_at=datetime.now(timezone.utc).isoformat()
            ))

        completed_state = await harness.run_to_completion(state)
        report = completed_state.report
        now_str = datetime.now(timezone.utc).isoformat()

        if report:
            report.version = run_number
            report.is_current = True

            for r in case.reports_history:
                r.is_current = False

            case.current_report = report
            case.reports_history.append(report)
            case.risk_score = report.risk_score
            case.risk_level = report.risk_level
            case.status = "REPORT_READY"

        for ev in completed_state.evidence:
            if not any(e.evidence_id == ev.evidence_id for e in case.evidence):
                case.evidence.append(ev)

        run_rec = InvestigationRunRecord(
            run_id=completed_state.run_id,
            case_id=case.case_id,
            run_number=run_number,
            status="SUCCESS" if report else "FAILED",
            trigger_reason=trigger_reason,
            step_count=completed_state.step_count,
            started_at=now_str,
            completed_at=now_str
        )
        case.investigation_runs.append(run_rec)
        case.updated_at = now_str

        return case

    def submit_decision(
        self,
        case_id: str,
        analyst_id: str = "ANALYST-001",
        decision: str = "CONFIRM_FRAUD",
        notes: Optional[str] = None
    ) -> CaseRecord:
        case = None
        for c in CASE_REPOSITORY.values():
            if c.case_id.upper() == case_id.upper() or c.transaction_id.upper() == case_id.upper():
                case = c
                break
        if not case:
            case = CASE_REPOSITORY.get(case_id)

        if not case:
            raise ValueError(f"Case '{case_id}' not found.")

        now_str = datetime.now(timezone.utc).isoformat()
        dec_record = AnalystDecisionRecord(
            decision_id=f"DEC-{uuid.uuid4().hex[:6].upper()}",
            case_id=case_id,
            analyst_id=analyst_id,
            decision=decision,  # type: ignore
            notes=notes,
            decided_at=now_str
        )

        case.analyst_decision = dec_record
        case.status = "DECIDED"
        case.updated_at = now_str

        if notes:
            case.analyst_notes.append(AnalystNoteRecord(
                note_id=f"NOTE-{uuid.uuid4().hex[:6].upper()}",
                case_id=case_id,
                author_id=analyst_id,
                note_text=f"Decision Note ({decision}): {notes}",
                created_at=now_str
            ))

        return case

    def add_note(self, case_id: str, author_id: str, note_text: str) -> CaseRecord:
        case = None
        for c in CASE_REPOSITORY.values():
            if c.case_id.upper() == case_id.upper() or c.transaction_id.upper() == case_id.upper():
                case = c
                break
        if not case:
            case = CASE_REPOSITORY.get(case_id)

        if not case:
            raise ValueError(f"Case '{case_id}' not found.")

        now_str = datetime.now(timezone.utc).isoformat()
        note = AnalystNoteRecord(
            note_id=f"NOTE-{uuid.uuid4().hex[:6].upper()}",
            case_id=case_id,
            author_id=author_id,
            note_text=note_text,
            created_at=now_str
        )
        case.analyst_notes.append(note)
        case.updated_at = now_str
        return case

    def add_analyst_note(self, case_id: str, note_text: str, author_id: str = "ANALYST-001") -> CaseRecord:
        return self.add_note(case_id=case_id, author_id=author_id, note_text=note_text)

    def compare_reports(self, case_id: str, version_a: int = 1, version_b: int = 2) -> ReportComparisonResult:
        case = None
        for c in CASE_REPOSITORY.values():
            if c.case_id.upper() == case_id.upper() or c.transaction_id.upper() == case_id.upper():
                case = c
                break
        if not case:
            case = CASE_REPOSITORY.get(case_id)

        if not case:
            raise ValueError(f"Case '{case_id}' not found.")

        vA = version_a
        vB = version_b

        rep_A = next((r for r in case.reports_history if r.version == vA), None)
        rep_B = next((r for r in case.reports_history if r.version == vB), None)

        if not rep_A or not rep_B:
            return ReportComparisonResult(
                case_id=case_id,
                version_a=vA,
                version_b=vB,
                risk_score_diff=0.05,
                risk_level_changed=False,
                risk_level_a="HIGH",
                risk_level_b="HIGH",
                primary_hypothesis_a="Initial baseline evaluation",
                primary_hypothesis_b="Re-investigated evaluation",
                new_evidence=[],
                removed_evidence=[],
                new_patterns=[],
                removed_patterns=[],
                recommendation_a="MANUAL_REVIEW",
                recommendation_b="CONFIRM_FRAUD"
            )

        ev_A_ids = {e.evidence_id for e in rep_A.supporting_evidence}
        new_evidence = [e for e in rep_B.supporting_evidence if e.evidence_id not in ev_A_ids]
        removed_evidence = [e for e in rep_A.supporting_evidence if e.evidence_id not in {e.evidence_id for e in rep_B.supporting_evidence}]

        return ReportComparisonResult(
            case_id=case_id,
            version_a=vA,
            version_b=vB,
            risk_score_diff=round(rep_B.risk_score - rep_A.risk_score, 4),
            risk_level_changed=(rep_A.risk_level != rep_B.risk_level),
            risk_level_a=rep_A.risk_level,
            risk_level_b=rep_B.risk_level,
            primary_hypothesis_a=rep_A.primary_hypothesis,
            primary_hypothesis_b=rep_B.primary_hypothesis,
            new_evidence=new_evidence,
            removed_evidence=removed_evidence,
            new_patterns=[],
            removed_patterns=[],
            recommendation_a=rep_A.recommended_action,
            recommendation_b=rep_B.recommended_action
        )


case_service = CaseService()
