# FPI — Theme & Typography Documentation

## 1. Overview
The **Fraud Pattern Investigator (FPI)** application visual theme and typography system has been transformed into a modern, enterprise-grade dark graphite and warm neutral design system.

---

## 2. Color System & Tokens

### Foundation Colors
- **App Background**: `#0f1115` (Dark Graphite) / `#f8fafc` (Warm Slate Light)
- **Surface Elevation**: `#16191e` (Dark Surface) / `#ffffff` (White Light)
- **Border Subtleties**: `#2a2e37` (Dark Border) / `#e2e8f0` (Light Border)

### Primary & Accent System
- **Teal Accent (`--accent-primary`)**: `#0d9488` / `#0f766e`
- **Emerald Accent (`--accent-emerald`)**: `#10b981` / `#059669`
- **Accent Soft Fill**: `rgba(13, 148, 136, 0.14)`

### Risk & Semantic Tokens
- **Critical Risk**: `#e11d48` (Rose 600)
- **High Risk**: `#f97316` (Orange 500)
- **Medium Risk**: `#d97706` (Amber 600)
- **Low Risk**: `#10b981` (Emerald 500)

---

## 3. Nunito Typography Implementation

- **Primary UI Typeface**: **`Nunito`** (weights 400, 500, 600, 700, 800) imported via Google Fonts in `index.html` and `@import` in `index.css`.
- **Monospace Typeface**: **`JetBrains Mono`** preserved for technical Case IDs, Transaction Hashes, Evidence Identifiers, and financial metrics.
- **Micro-Animations**: Smooth 150ms-250ms cubic-bezier transition utilities (`.animate-fade-in`, `.animate-slide-right`) with `prefers-reduced-motion` support.
