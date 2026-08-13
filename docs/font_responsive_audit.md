# FRAUD PATTERN INVESTIGATOR — SOURCE TYPOGRAPHY & RESPONSIVE UI AUDIT

**Date:** August 13, 2026  
**Author:** Senior Frontend & Responsive UX Systems Engineer  
**Status:** AUDIT COMPLETE — MANDATE APPROVED FOR IMPLEMENTATION

---

## 1. Source Typography Inspection Summary

| Category | Source Discovery | Standardized Definition |
| :--- | :--- | :--- |
| **Primary UI Font** | `Inter` (Google Fonts) | Primary typeface for UI copy, headings, buttons, and navigation |
| **Monospace Font** | `JetBrains Mono` (Google Fonts) | Typeface for Case IDs (`CASE-1001`), Txn IDs, Evidence IDs, IP/Device Hashes, and tabular metrics |
| **Font Imports** | `@import url('https://fonts.googleapis.com/css2?family=Inter...&family=JetBrains+Mono...')` | Retained and optimized with `font-display: swap` |
| **Fallback Stack** | `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | Clean cross-platform fallback stack |
| **Font Weights** | `400` (Regular), `500` (Medium), `600` (Semibold), `700` (Bold) | Standardized to avoid artificial font stretching |

---

## 2. Source Responsive UI Inspection Findings

### **A. Sidebar (`Sidebar.tsx`)**
- **Desktop (≥1024px)**: Fixed width (`w-64` or `w-16` collapsed). Works as expected.
- **Mobile (<640px) & Tablet (<1024px)**: Needs a mobile menu toggle button in `TopBar.tsx` and an off-canvas slide-out backdrop drawer for small touch screens so that main content takes 100% viewport width without clipping.

### **B. TopBar (`TopBar.tsx`)**
- **Desktop**: Clean search bar launcher (`⌘K`), system status indicator, theme toggle button, and user profile badge.
- **Mobile**: Search input needs responsive scaling; needs mobile sidebar trigger icon (`Menu` / `X`).

### **C. Main Viewports & Screens**
- **Dashboard (`DashboardView.tsx`)**: Responsive grid (`grid-cols-1 md:grid-cols-3/4`).
- **Case Library (`CaseLibraryView.tsx`)**: Responsive horizontal scroll wrapper for data table, preserving min-width and touch target heights.
- **Case Workspace (`DetailView.tsx`)**: Mobile layout stacks header details, AI recommendations, and decision actions vertically.
- **Evidence Explorer (`EvidenceExplorerView.tsx`)**: Responsive 1/2/3 grid layout with full-width mobile detail drawer.
- **Graph Relationships (`GraphRelationshipsView.tsx`)**: Responsive canvas with entity details sliding up as a mobile sheet.
- **Audit Log (`AuditLogView.tsx`)**: Responsive table wrapper with mobile pagination.

---

## 3. Responsive Breakpoint Standards

- **Mobile**: `< 640px` (`sm:`)
- **Tablet**: `640px – 1023px` (`md:`)
- **Desktop**: `1024px+` (`lg:`, `xl:`)

---

## 4. Implementation Checklist

- [x] Source code audited and documented in `docs/font_responsive_audit.md`.
- [ ] Centralize typography tokens & `font-display: swap` in `index.css`.
- [ ] Add mobile sidebar drawer backdrop & toggle button in `Sidebar.tsx` and `TopBar.tsx`.
- [ ] Ensure all long strings (`case_id`, `transaction_id`, `claim`, `ip_address`) use `break-words` / `overflow-wrap`.
- [ ] Verify `npm run build` with 0 errors and `python -m pytest backend` with 59/59 passing tests.
