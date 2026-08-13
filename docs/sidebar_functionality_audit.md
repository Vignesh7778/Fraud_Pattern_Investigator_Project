# SIDEBAR NAVIGATION & FEATURE FUNCTIONALITY AUDIT

**Date:** August 13, 2026  
**Author:** Autonomous Principal AI Systems Architect  
**Status:** AUDIT COMPLETE — ROOT CAUSES IDENTIFIED

---

## 1. Feature Functionality Audit Summary

| Feature | Current Route | Component | Data Source | Current Problem | Root Cause | Fix Required | Test Required |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Evidence Explorer** | None (`#`) | `DetailView.tsx` sub-tab | In-memory `state.evidence` | Clicking sidebar item does not navigate; evidence view was locked inside sub-tabs. | Missing global `/evidence` route and dedicated API/Supabase query service for evidence across all cases. | Add `/evidence` route, build `EvidenceExplorerView.tsx` with search, source/verification filters, detail drawer, and connect to `GET /api/v1/investigations/evidence`. | Direct navigation to `/evidence`, search filtering, detail drawer inspection, page refresh. |
| **Graph Relationships** | None (`#`) | `DetailView.tsx` sub-tab | In-memory `state.linked_entities` | Clicking sidebar item does not navigate; network graph was not rendered globally. | Missing global `/graph` route and dedicated entity graph visualizer component. | Add `/graph` route, build `GraphRelationshipsView.tsx` using real NetworkX topology data (`GET /api/v1/graph/topology`), interactive node selection, and entity inspection. | Direct navigation to `/graph`, node click details, connected entity highlighting, page refresh. |
| **Reports & History** | None (`#`) | `DetailView.tsx` sub-tab | `state.report` | Clicking sidebar item does not navigate; report history was only visible inside case workspace. | Missing global `/reports` route and global report repository query endpoint. | Add `/reports` route, build `ReportsHistoryView.tsx` displaying `CURRENT REPORT` vs historical versions (`v1`, `v2`, `v3`), and connect to Report Comparison diff modal. | Direct navigation to `/reports`, version switching, report comparison diff view, page refresh. |
| **Audit Log** | None (`#`) | `DetailView.tsx` sub-tab | `audit_tracker.events` | Clicking sidebar item does not navigate; audit events were inaccessible globally. | Missing global `/audit` route and paginated audit query endpoint (`GET /api/v1/audit/logs`). | Add `/audit` route, build `AuditLogView.tsx` with event type/actor search, timestamp sorting, pagination, and real audit records. | Direct navigation to `/audit`, event filtering, pagination, page refresh. |

---

## 2. Technical Architecture & Routing Plan

1. **Client-Side Routing with `react-router-dom`**:
   - Wrap application in `<BrowserRouter>`.
   - Define URL routes:
     - `/` ➔ Dashboard (`DashboardView.tsx`)
     - `/cases` ➔ Case Library (`CaseLibraryView.tsx`)
     - `/cases/:caseId` ➔ Case Workspace (`DetailView.tsx`)
     - `/evidence` ➔ Evidence Explorer (`EvidenceExplorerView.tsx`)
     - `/graph` ➔ Graph Relationships (`GraphRelationshipsView.tsx`)
     - `/reports` ➔ Reports & History (`ReportsHistoryView.tsx`)
     - `/audit` ➔ Audit Log (`AuditLogView.tsx`)

2. **Route-Aware Sidebar (`Sidebar.tsx`)**:
   - Use `useLocation()` to highlight active sidebar item based on current URL path.
   - Support page refresh without 404s or blank screens.

3. **Backend API Endpoints**:
   - `GET /api/v1/investigations/evidence` ➔ Queries all persisted evidence with search, source type, and verification filtering.
   - `GET /api/v1/graph/topology` ➔ Returns interactive NetworkX nodes & links across transactions, accounts, devices, IPs, merchants.
   - `GET /api/v1/investigations/reports` ➔ Queries all report versions across persistent cases.
   - `GET /api/v1/audit/logs` ➔ Queries append-only audit event log.

---

## 3. Execution Sequence

- **Step 1**: Expand backend API routers in `backend/app/api/` (`investigations.py`, `graph.py`, `audit.py`).
- **Step 2**: Create page components in `frontend/src/components/` (`EvidenceExplorerView.tsx`, `GraphRelationshipsView.tsx`, `ReportsHistoryView.tsx`, `AuditLogView.tsx`).
- **Step 3**: Configure React Router in `frontend/src/App.tsx` and `frontend/src/main.tsx`.
- **Step 4**: Execute end-to-end route, refresh, and data tests.
