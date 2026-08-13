# FRAUD PATTERN INVESTIGATOR — CURRENT STATE GAP ANALYSIS

**Date:** August 13, 2026  
**Author:** Autonomous Principal AI Systems Architect  
**Status:** AUDIT COMPLETE — TRANSFORMATION PLAN READY

---

## 1. Existing Architecture Overview

The Fraud Pattern Investigator (FPI) platform is currently structured into the following operational layers:
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS (Dark Theme UI).
- **Backend API**: FastAPI (Python 3.12) exposing `/api/v1/investigations`, `/api/v1/auth`, `/api/v1/audit`, `/health`.
- **Harness & Orchestration**: Custom 15-State `InvestigationHarness` and `DynamicPlanner`.
- **Analytics & Engines**:
  - **ML Service**: XGBoost + SHAP Tree Explainer for probabilistic risk scoring.
  - **Pattern Engine**: 7 deterministic detectors (`shared_device`, `shared_ip`, `velocity`, `geographic_anomaly`, `amount_anomaly`, `new_account_burst`, `bot_like_behavior`).
  - **Graph Engine**: NetworkX relationship graph for multi-hop entity link discovery.
  - **RAG Engine**: Vector similarity search engine for compliance policies and historical case studies.
- **LLM Gateway**: Multi-provider LLM abstraction supporting Groq API (`llama-3.1-8b-instant`), OpenRouter, and Mock Local Fallback.

---

## 2. Working Features (Preserved Architecture)

The following core components are fully functional and will be preserved:
1. **XGBoost ML Model & SHAP**: Evaluates probabilistic risk scores ($0.00$ to $1.00$) and feature contributions.
2. **Deterministic Pattern Detectors**: Detects behavioral anomalies cleanly.
3. **NetworkX Entity Graph**: Constructs relationship paths (`Account A -> Device D22 <- Account B`).
4. **Vector Policy RAG**: Retrieves compliance rules (`POL-DEVICE-001`) with source relevance scores.
5. **Multi-Provider LLM Gateway**: Connects to Groq API with robust Pydantic JSON sanitization.
6. **15-State Machine Harness**: Coordinates state transitions (`CREATED` ➔ `LOAD_CASE` ➔ `PLAN` ➔ `EXECUTE_TOOL` ➔ `VALIDATE` ➔ `APPEND_EVIDENCE` ➔ `CHECK_SUFFICIENCY` ➔ `CONTRADICTION_CHECK` ➔ `GENERATE_REPORT` ➔ `HUMAN_REVIEW`).
7. **Automated Pytest Suite**: 55 passing unit and integration tests.

---

## 3. Identified Gaps & Technical Deficiencies

### A. Case Structure & Entity Ownership (Phase 1)
- **Current Issue**: The platform treats a single transaction investigation (`InvestigationState` / `Report`) as the case.
- **Deficiency**: There is no persistent `Case` container. If a transaction is investigated multiple times, or new evidence is added, there is no root entity tracking the case across time.
- **Required Transformation**: Introduce `Case` as the root entity. A `Case` owns `InvestigationRuns`, `ReportVersions`, `EvidenceItems`, `AnalystNotes`, `CaseUpdates`, `HumanDecisions`, and `AuditEvents`.

### B. Report Versioning & Current Report Rule (Phase 2 & 3)
- **Current Issue**: Single report object (`state.report`) attached directly to `InvestigationState`.
- **Deficiency**: Re-running an investigation overwrites the existing report. Old reports are lost.
- **Required Transformation**: Every successful investigation run generates a new `ReportVersion` (`v1`, `v2`, `v3`). `CURRENT REPORT` is defined strictly as the **latest SUCCESSFUL report**. If an investigation run fails, `CURRENT REPORT` remains the previous successful version.

### C. Data Persistence & State Storage (Phase 21)
- **Current Issue**: FastAPI router `backend/app/api/investigations.py` uses an in-memory dictionary (`CASE_STORE: Dict[str, InvestigationState] = {}`).
- **Deficiency**: Server restarts clear active cases unless seeded.
- **Required Transformation**: Persist `cases`, `investigation_runs`, `reports`, `report_versions`, `evidence_items`, `case_updates`, `analyst_notes`, `analyst_decisions`, and `audit_events` to PostgreSQL / Supabase with SQLAlchemy ORM.

### D. Case Library & Workspace UX (Phase 5, 6 & 7)
- **Current Issue**: Frontend UI has a single `Case Workspace` tab showing the latest case.
- **Deficiency**: Lacks a professional **Case Library** screen with search, risk/status/date filtering, pagination, report comparison, and activity logs.
- **Required Transformation**: Build a complete Case Library (`/cases`), Case Workspace (`/cases/:caseId`), Dashboard Priority Queue, Evidence Explorer, Graph Visualizer, Report Comparison Diff View, and Live Progress Timeline.

### E. Re-Investigation & Case Updates (Phase 15 & 16)
- **Current Issue**: Re-running an investigation overwrites existing state.
- **Deficiency**: Analysts cannot add new notes/evidence and click "Investigate Again" while preserving previous runs.
- **Required Transformation**: "Investigate Again" creates `InvestigationRun #N`, preserving run history, tool executions, and previous report versions.

---

## 4. Architectural Transformation Plan

```
                              ┌───────────────────────────────────┐
                              │             PERSISTENT            │
                              │                CASE               │
                              └─────────────────┬─────────────────┘
                                                │
         ┌───────────────────┬──────────────────┼───────────────────┬───────────────────┐
         ▼                   ▼                  ▼                   ▼                   ▼
┌──────────────────┐┌──────────────────┐┌───────────────┐┌──────────────────┐┌──────────────────┐
│  INVESTIGATION   ││  REPORT VERSIONS ││   EVIDENCE    ││  ANALYST NOTES   ││  HUMAN DECISION  │
│     RUNS (#N)    ││   (v1, v2, v3)   ││   WORKSPACE   ││   & UPDATES     ││  (BINDING AUDIT) │
└──────────────────┘└──────────────────┘└───────────────┘└──────────────────┘└──────────────────┘
```

The transformation will be executed autonomously and sequentially across Phases 1 to 36.
