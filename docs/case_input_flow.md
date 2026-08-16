# FPI — Dual-Entry Case Ingestion Flow Documentation

## 1. Executive Summary
The **Fraud Pattern Investigator (FPI)** case ingestion experience provides a unified, 3-step wizard supporting both **Manual Case Entry** and **Drag & Drop File Upload**.

---

## 2. Ingestion Flow Pipeline

```
          [ Choice Step ]
            /        \
           /          \
[ Manual Entry ]   [ File Upload ]
(Categorized Form)  (.json, .csv, .txt)
           \          /
            \        /
       [ Case Review Step ]  <-- Data inspection & editing
               │
               ▼
     [ Start AI Investigation ]  <-- Triggers 15-State Harness
```

---

## 3. Step-by-Step Breakdown

### Step 1: Choice Card
User selects between:
- **`[ Enter Case Manually ]`**: Structured form input for transaction, account, device, and network attributes.
- **`[ Upload Case File ]`**: Drag & drop dropzone for raw evidence payloads (`.json`, `.csv`, `.txt` up to 10MB).

### Step 2A: Manual Case Form
Structured form with clear field categorization:
- **Case Information**: Title, User Notes *(Optional)*
- **Transaction**: Transaction ID, Merchant, Amount *(Required \*)*
- **Account & Device**: Account ID, Device Hash, IP Address, Country *(Optional)*

### Step 2B: Drag & Drop File Upload
- **Validation**: Checks file extension (`.json`, `.csv`, `.txt`) and max size (`10MB`).
- **Progress States**: `Uploading...` ➔ `Processing...` ➔ `Extracting case information...` ➔ `Ready for review.`.
- **Parsing**: Automatically parses JSON payloads to populate case review attributes.

### Step 3: Pre-Investigation Case Review
- Unified summary cards showing normalized case attributes before starting the investigation.
- Allows the analyst to click `[Edit Fields]` to adjust values or click `[Start AI Investigation]` to execute the 15-state AI harness.
