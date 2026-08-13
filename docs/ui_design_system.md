# FRAUD PATTERN INVESTIGATOR — UI/UX PRO MAX ENTERPRISE DESIGN SYSTEM

**Date:** August 13, 2026  
**Status:** UI UX PRO MAX SPECIFICATION COMPLETE (LIGHT + DARK MODE READY)

---

## 1. Industry-Specific Visual Philosophy (Cybersecurity / Fintech Operations)

- **Palette Theme**: Charcoal / Graphite (`#0f1115` / `#16191e`) + Warm Light Slate (`#f8fafc` / `#ffffff`) + Restrained Teal Accent (`#0d9488`).
- **Anti-Pattern Elimination**: Removed all blue/purple gradients, neon glowing borders, oversized cards, and generic AI visual tropes.
- **Visual Character**: Calm, Trustworthy, Precision-Driven, Data-Dense, Easy to Learn.

---

## 2. Color System Tokens

### **Dark Mode (Default)**:
- **App Background**: `#0f1115` (Dark Graphite)
- **Surface**: `#16191e` (Graphite Panel)
- **Elevated Surface**: `#1e2229` (Charcoal Surface)
- **Borders**: `#2a2e37` (Subtle 1px Border) / `#3a404d` (Strong Neutral Border)
- **Primary Text**: `#f0f2f5` (Off-White Primary)
- **Secondary Text**: `#9ca3af` (Muted Neutral Secondary)
- **Accent Primary**: `#0d9488` (Restrained Teal 600)

### **Light Mode (`html.light`)**:
- **App Background**: `#f8fafc` (Warm Slate Light)
- **Surface**: `#ffffff` (Clean Pure White Surface)
- **Elevated Surface**: `#f1f5f9` (Soft Slate Gray)
- **Borders**: `#e2e8f0` (Subtle Light Border)
- **Primary Text**: `#0f172a` (Dark Slate Primary)
- **Secondary Text**: `#475569` (Muted Dark Secondary)
- **Accent Primary**: `#0d9488` (Restrained Teal 600)

---

## 3. Information Architecture & Sidebar Navigation

Organized into 4 clean enterprise sections:
1. **WORKSPACE**: Dashboard, Cases, Investigations
2. **ANALYSIS**: Evidence, Relationships, Reports, Knowledge
3. **OPERATIONS**: Analytics, Audit
4. **ADMIN**: Users, System Health, Configuration

---

## 4. Key UX Capabilities

- **Light + Dark Theme Switcher**: Toggle button in TopBar with preference saved in `localStorage` and initial detection via `prefers-color-scheme`.
- **Global Command Palette (`Ctrl + K` / `⌘K`)**: Quick keyboard search across Cases, Evidence, Reports, and Actions.
- **Quick Start Panel**: Instant actions on Dashboard (`+ New Investigation`, `Open Pending Review`, `Browse Cases`, `Ask AI`).
- **Structured AI Assistant Drawer**: Contextual responses formatted in `OBSERVATION`, `EVIDENCE`, `INFERENCE`, and `RECOMMENDATION`.
- **Evidence Trust Visualization**: Explicit status markers (`✓ Verified`, `! Needs Review`, `× Contradicting`).
