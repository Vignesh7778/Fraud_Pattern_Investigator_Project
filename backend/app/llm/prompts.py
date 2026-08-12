from typing import Dict, Any, List
from app.domain.state import InvestigationState
from app.rag import rag_engine


SYSTEM_RULES_PROMPT = """You are the Lead Fraud Investigation AI Assistant for Fraud Pattern Investigator (FPI).
CRITICAL PRINCIPLE: AI INVESTIGATES. HUMAN DECIDES.
You must synthesize grounded investigation evidence and output a structured JSON report.

RULES:
1. Every claim in the report MUST reference actual evidence IDs provided in the grounded context.
2. DO NOT invent or fabricate any transaction amounts, account numbers, IP addresses, or device hashes.
3. You MUST NOT make the final fraud decision or execute financial actions.
4. Output STRICT JSON conforming to the InvestigationReport schema.
"""


def build_investigation_prompt(state: InvestigationState) -> str:
    sections = []

    # 1. System Rules
    sections.append(f"=== 1. SYSTEM RULES ===\n{SYSTEM_RULES_PROMPT}")

    # 2. Objective
    sections.append(f"=== 2. INVESTIGATION OBJECTIVE ===\nCase ID: {state.case_id}\nObjective: {state.objective}\nTarget Transaction ID: {state.transaction_id}")

    # 3. Transaction Data
    txn_ev = [e for e in state.evidence if e.source_type == "transaction_data"]
    txn_str = "\n".join([f"[{e.evidence_id}] {e.claim} | Data: {e.value_reference}" for e in txn_ev]) if txn_ev else "No direct transaction data fetched."
    sections.append(f"=== 3. TRANSACTION DATA ===\n{txn_str}")

    # 4. ML Findings
    ml_str = f"Risk Score: {state.risk_score:.4f} | Risk Level: {state.risk_level} | Model: {state.risk_model_version}" if state.risk_score is not None else "ML risk scoring not performed."
    sections.append(f"=== 4. ML FINDINGS ===\n{ml_str}")

    # 5. Pattern Findings
    pat_str = "\n".join([f"- Pattern: {p.pattern_id} | Severity: {p.severity} | Confidence: {p.confidence:.2f} | {p.description}" for p in state.patterns]) if state.patterns else "No deterministic behavioral patterns detected."
    sections.append(f"=== 5. PATTERN FINDINGS ===\n{pat_str}")

    # 6. Graph Findings
    graph_str = "\n".join([f"- Entity: {e.entity_type}({e.entity_id}) | Link: {e.relationship}" for e in state.linked_entities]) if state.linked_entities else "No linked entity relationships discovered."
    sections.append(f"=== 6. GRAPH FINDINGS ===\n{graph_str}")

    # 7. RAG Context
    rag_context = rag_engine.format_grounded_context([])  # Formatted retrieved context
    sections.append(f"=== 7. RAG CONTEXT ===\n{rag_context}")

    # 8. Supporting Evidence
    supp = [e for e in state.evidence if "legitimate" not in e.claim.lower()]
    supp_str = "\n".join([f"[{e.evidence_id}] ({e.source_type}): {e.claim}" for e in supp]) if supp else "No supporting evidence collected."
    sections.append(f"=== 8. SUPPORTING EVIDENCE ===\n{supp_str}")

    # 9. Contradicting Evidence
    contra_str = "\n".join([f"[{e.evidence_id}] ({e.source_type}): {e.claim}" for e in state.contradictions]) if state.contradictions else "No contradicting evidence found."
    sections.append(f"=== 9. CONTRADICTING EVIDENCE ===\n{contra_str}")

    # 10. Known Limitations
    limitations = [
        "Analysis based on synthetic portfolio prototype data.",
        "Final financial fraud determination requires human analyst review."
    ]
    lim_str = "\n".join([f"- {l}" for l in limitations])
    sections.append(f"=== 10. KNOWN LIMITATIONS ===\n{lim_str}")

    return "\n\n".join(sections)
