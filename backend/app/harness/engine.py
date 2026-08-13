import time
import uuid
from typing import Dict, Any, List, Tuple, Optional
from app.domain import (
    InvestigationState, EvidenceItem, PatternFinding, LinkedEntity,
    ToolExecutionRecord, InvestigationReport, evidence_manager
)
from app.tools import tool_registry, ToolPermissionError, ToolExecutionError
from app.core.logging import logger

VALID_STATES = {
    "CREATED",
    "LOAD_CASE",
    "INITIAL_ASSESSMENT",
    "PLAN",
    "EXECUTE_TOOL",
    "VALIDATE_RESULT",
    "APPEND_EVIDENCE",
    "CHECK_SUFFICIENCY",
    "REPLAN",
    "CONTRADICTION_CHECK",
    "GENERATE_REPORT",
    "HUMAN_REVIEW",
    "FINAL_DECISION",
    "AUDIT",
    "FAILED",
}


class InvestigationHarness:
    def __init__(self, max_steps: int = 30):
        self.max_steps = max_steps

    def initialize_case(
        self,
        transaction_id: str,
        case_id: Optional[str] = None,
        run_number: int = 1,
        trigger_reason: str = "Initial Investigation"
    ) -> InvestigationState:
        cid = case_id or f"CASE-{transaction_id.replace('TXN-', '')}"
        run_id = f"RUN-{str(uuid.uuid4())[:8]}"

        state = InvestigationState(
            case_id=cid,
            transaction_id=transaction_id,
            run_id=run_id,
            run_number=run_number,
            max_steps=self.max_steps
        )
        state.status = "CREATED"
        logger.info("harness_case_initialized", case_id=state.case_id, transaction_id=transaction_id, run_id=run_id, run_number=run_number)
        return state

    async def step(self, state: InvestigationState, user_role: str = "analyst") -> InvestigationState:
        """
        Advances the investigation state machine by exactly one step.
        """
        if state.step_count >= state.max_steps and state.status not in ["HUMAN_REVIEW", "FINAL_DECISION", "AUDIT", "FAILED"]:
            logger.warning("harness_max_steps_exceeded", case_id=state.case_id, steps=state.step_count)
            state.status = "FAILED"
            state.errors.append(f"Investigation exceeded maximum allowed step limit ({state.max_steps}). Safe termination triggered.")
            return state

        state.step_count += 1
        current_status = state.status

        logger.info("harness_step_execute", case_id=state.case_id, state=current_status, step=state.step_count)

        try:
            if current_status == "CREATED":
                state.status = "LOAD_CASE"

            elif current_status == "LOAD_CASE":
                await self._execute_tool_step(state, "fetch_transaction", {"transaction_id": state.transaction_id}, user_role)
                state.status = "INITIAL_ASSESSMENT"

            elif current_status == "INITIAL_ASSESSMENT":
                state.status = "PLAN"

            elif current_status == "PLAN":
                next_tool, params = self._plan_next_step(state)
                if next_tool:
                    await self._execute_tool_step(state, next_tool, params, user_role)
                    state.status = "VALIDATE_RESULT"
                else:
                    state.status = "CHECK_SUFFICIENCY"

            elif current_status == "VALIDATE_RESULT":
                state.status = "APPEND_EVIDENCE"

            elif current_status == "APPEND_EVIDENCE":
                state.status = "CHECK_SUFFICIENCY"

            elif current_status == "CHECK_SUFFICIENCY":
                if self._is_evidence_sufficient(state):
                    state.status = "CONTRADICTION_CHECK"
                else:
                    state.status = "REPLAN"

            elif current_status == "REPLAN":
                state.status = "PLAN"

            elif current_status == "CONTRADICTION_CHECK":
                self._run_contradiction_check(state)
                state.status = "GENERATE_REPORT"

            elif current_status == "GENERATE_REPORT":
                await self._generate_report(state)
                state.status = "HUMAN_REVIEW"

            elif current_status in ["HUMAN_REVIEW", "FINAL_DECISION", "AUDIT", "FAILED"]:
                pass

            else:
                state.errors.append(f"Invalid harness state: {current_status}")
                state.status = "FAILED"

        except Exception as e:
            logger.error("harness_step_failed", case_id=state.case_id, state=current_status, error=str(e))
            state.errors.append(f"Error during state '{current_status}': {str(e)}")
            if current_status not in ["FAILED", "GENERATE_REPORT"]:
                state.status = "REPLAN"
            else:
                state.status = "FAILED"

        return state

    async def run_to_completion(self, state: InvestigationState, user_role: str = "analyst") -> InvestigationState:
        """
        Runs state machine until HUMAN_REVIEW, FINAL_DECISION, AUDIT, or FAILED.
        """
        while state.status not in ["HUMAN_REVIEW", "FINAL_DECISION", "AUDIT", "FAILED"]:
            state = await self.step(state, user_role=user_role)
        return state

    async def _execute_tool_step(self, state: InvestigationState, tool_name: str, params: Dict[str, Any], user_role: str):
        try:
            result = await tool_registry.execute_tool(tool_name, params, user_role=user_role)
            out = result["output"]

            record = ToolExecutionRecord(
                tool_name=tool_name,
                input_params=params,
                output_data=out,
                status="SUCCESS",
                duration_ms=result["duration_ms"]
            )
            state.tool_history.append(record)
            self._process_tool_output_to_evidence(state, tool_name, out)

        except (ToolPermissionError, ToolExecutionError, ValueError) as e:
            logger.warning("harness_tool_execution_failed", tool=tool_name, error=str(e))
            record = ToolExecutionRecord(
                tool_name=tool_name,
                input_params=params,
                output_data={"error": str(e)},
                status="FAILED",
                duration_ms=0.0
            )
            state.tool_history.append(record)
            state.errors.append(f"Tool '{tool_name}' failed: {str(e)}")

    def _plan_next_step(self, state: InvestigationState) -> Tuple[Optional[str], Dict[str, Any]]:
        from app.harness.planner import dynamic_planner
        action = dynamic_planner.recommend_next_action(state)
        if action:
            return action.tool_name, action.required_inputs
        return None, {}

    def _process_tool_output_to_evidence(self, state: InvestigationState, tool_name: str, out: Dict[str, Any]):
        if tool_name == "fetch_transaction":
            ev = EvidenceItem(
                case_id=state.case_id,
                source_type="transaction_data",
                source_reference=f"txn:{out['transaction_id']}",
                claim=f"Transaction {out['transaction_id']} for ${out['amount']:.2f} at merchant {out['merchant_id']}.",
                value_reference=out,
                confidence=1.0
            )
            evidence_manager.add_evidence(state, ev)

        elif tool_name == "run_fraud_model":
            state.risk_score = out["risk_score"]
            state.risk_level = out["risk_level"]
            state.risk_model_version = out["model_version"]
            ev = EvidenceItem(
                case_id=state.case_id,
                source_type="ml_model",
                source_reference=f"model:{out['model_version']}",
                claim=f"ML Fraud risk score evaluated at {out['risk_score']:.2f} ({out['risk_level']}).",
                value_reference=out,
                confidence=0.95
            )
            evidence_manager.add_evidence(state, ev)

        elif tool_name == "detect_patterns":
            for p in out.get("detected_patterns", []):
                pattern_finding = PatternFinding(
                    pattern_id=p["pattern_id"],
                    severity=p["severity"],
                    confidence=p["confidence"],
                    description=p["description"]
                )
                state.patterns.append(pattern_finding)
                ev = EvidenceItem(
                    case_id=state.case_id,
                    source_type="pattern_engine",
                    source_reference=f"pattern:{p['pattern_id']}",
                    claim=p["description"],
                    value_reference=p,
                    confidence=p["confidence"]
                )
                evidence_manager.add_evidence(state, ev)

        elif tool_name == "find_linked_entities":
            for link in out.get("linked_accounts", []):
                entity = LinkedEntity(
                    entity_type="Account",
                    entity_id=link["account_id"],
                    relationship=link["reason"]
                )
                state.linked_entities.append(entity)
                ev = EvidenceItem(
                    case_id=state.case_id,
                    source_type="graph_analysis",
                    source_reference=f"account:{link['account_id']}",
                    claim=f"Linked to account {link['account_id']} via {link['reason']}.",
                    value_reference=link,
                    confidence=0.90
                )
                evidence_manager.add_evidence(state, ev)

    def _is_evidence_sufficient(self, state: InvestigationState) -> bool:
        has_txn = any(e.source_type == "transaction_data" for e in state.evidence)
        has_ml = state.risk_score is not None
        has_patterns = any(t.tool_name == "detect_patterns" for t in state.tool_history)

        pattern_ids = {p.pattern_id for p in state.patterns}
        if ("shared_device" in pattern_ids or "shared_ip" in pattern_ids) and not any(t.tool_name == "find_linked_entities" for t in state.tool_history):
            return False

        executed_tools = {t.tool_name for t in state.tool_history if t.status == "SUCCESS"}
        return has_txn and has_ml and has_patterns and len(executed_tools) >= 3

    def _run_contradiction_check(self, state: InvestigationState):
        from app.domain.verification import contradiction_engine
        result = contradiction_engine.analyze_state(state)
        state.contradictions = result.contradicting_evidence
        if result.uncertainty_notes:
            state.errors.extend([f"Verification Note: {n}" for n in result.uncertainty_notes])

    async def _generate_report(self, state: InvestigationState):
        from app.llm import get_llm_provider
        provider = get_llm_provider()

        # Calculate version number based on existing report versions
        new_version = len(state.reports_history) + 1

        try:
            report = await provider.generate_report(state)
            report.version = new_version
            report.investigation_run_id = state.run_id
            report.is_current = True

            # Mark previous reports as not current
            for old_rep in state.reports_history:
                old_rep.is_current = False

            state.reports_history.append(report)
            state.report = report  # CURRENT REPORT = latest successful report
            logger.info("report_generated_successfully", case_id=state.case_id, version=new_version)

        except Exception as e:
            logger.error("report_generation_failed_preserving_current", case_id=state.case_id, error=str(e))
            state.errors.append(f"Report generation failed: {str(e)}")
            # Failed investigation run MUST NOT replace previous successful report!


investigation_harness = InvestigationHarness()
