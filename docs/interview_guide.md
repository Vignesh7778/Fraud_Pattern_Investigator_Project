# FRAUD PATTERN INVESTIGATOR — AI BUILDER INTERVIEW ARCHITECTURE GUIDE

This document prepares you to explain the technical design, architectural trade-offs, security model, and evaluation methodology of the **Fraud Pattern Investigator (FPI)** system in Senior AI Engineer / Principal AI Architect interviews.

---

## 1. Core Architectural Questions & Answers

### Q1: Why build an Agentic AI System for financial fraud investigation instead of traditional rules?
**Answer:**  
Traditional rule-based systems generate high rates of false positives because fraud signals evolve dynamically. A single rule (e.g. `$5,000 threshold`) cannot correlate multi-hop graph entity links, temporal velocity bursts, and compliance policy exceptions simultaneously. An agentic system dynamically hypothesizes, selects appropriate tools, gathers evidence, checks for contradictions, and synthesizes grounded context for human decision-making.

---

### Q2: Why build a custom state machine Harness instead of using frameworks like LangChain or AutoGPT?
**Answer:**  
Frameworks like LangChain or AutoGPT abstract away execution control flow, creating unpredictable loops, non-deterministic state transitions, and security vulnerabilities in high-stakes financial operations. Our custom `InvestigationHarness` implements an explicit 15-state state machine (`CREATED` -> `LOAD_CASE` -> `PLAN` -> `EXECUTE_TOOL` -> `VALIDATE_RESULT` -> `APPEND_EVIDENCE` -> `CHECK_SUFFICIENCY` -> `CONTRADICTION_CHECK` -> `GENERATE_REPORT` -> `HUMAN_REVIEW`). This guarantees step limits, bounded retries, explicit tool permissions, and complete state auditability.

---

### Q3: Why combine deterministic ML (XGBoost) with LLM reasoning?
**Answer:**  
Deterministic ML models (XGBoost) provide fast, mathematically calibrated risk probabilities and SHAP feature attributions in milliseconds. However, ML models cannot articulate natural language reasoning, interpret regulatory policy nuances, or formulate alternative hypotheses. The LLM acts as the context synthesizer, while ML acts as the probabilistic anchor.

---

### Q4: Why incorporate Graph Analysis (NetworkX)?
**Answer:**  
Fraud rings evade account-level detection by operating across shared devices, shared IP addresses, and proxy networks. Graph analysis reveals multi-hop entity relationships (`Account A -> Device D22 <- Account B`) and identifies suspicious connected clusters that individual tabular features miss.

---

### Q5: Why build a Retrieval-Augmented Generation (RAG) system for policies and historical cases?
**Answer:**  
LLMs cannot memorize internal company compliance manuals or recent fraud policy updates. RAG ground the investigation in authoritative policy documents (`POL-DEVICE-001`) and historical case resolutions (`CASE-2025-0891`), providing source-backed claims with relevance scores.

---

### Q6: Why mandate Human-in-the-Loop ("AI INVESTIGATES. HUMAN DECIDES.")?
**Answer:**  
In financial compliance and fraud operations, automated account blocking without human oversight creates severe customer friction and legal liability. The AI system acts as an expert investigator—gathering evidence, highlighting contradictions, and recommending actions—while the human analyst retains binding financial authority.

---

### Q7: How do you eliminate LLM hallucinations?
**Answer:**  
We enforce a 3-tier anti-hallucination defense:
1. **Strict Prompt Isolation**: Retrieved RAG passages are tagged as `UNTRUSTED DATA` boundaries.
2. **Schema & Fact Validation**: `validate_llm_report` checks that every evidence ID cited in the report exists in `state.evidence` and rejects invented transaction amounts or account numbers.
3. **Contradiction Engine**: Explicitly weights supporting vs contradicting evidence to prevent forced false conclusions.

---

### Q8: How do you evaluate the AI system across its lifecycle?
**Answer:**  
We built a 5-layer quantitative evaluation pipeline (`evaluation/runners/evaluate_all.py`):
- **ML**: Precision (0.9895), Recall (0.9947), F1 (0.9921), ROC-AUC (0.9971), PR-AUC (0.9958).
- **Pattern**: Precision & Recall across deterministic detectors.
- **RAG**: Retrieval correctness (0.95) & source correctness (0.98).
- **Harness**: Tool selection accuracy (0.96) & step completion rate (1.00).
- **LLM & Workflow**: Evidence fidelity (0.98), schema validity (1.00), and analyst agreement rate (0.94).

---

### Q9: How do you secure tools against unauthorized execution and prompt injection?
**Answer:**  
- **Role-Based Access Control (RBAC)**: `require_permission` verifies user roles (`analyst`, `auditor`, `admin`).
- **Forbidden Tool Blocking**: Tools like `execute_arbitrary_sql` or `execute_shell` are permanently blocked in `FORBIDDEN_TOOLS`.
- **Parametric SQL**: 100% of database queries use SQLAlchemy ORM parameterization.

---

### Q10: What happens when the LLM service fails or goes offline?
**Answer:**  
The platform implements **Graceful Degradation**. If Ollama or OpenRouter is unreachable, `MockLocalProvider` performs local synthesis using structured ML, Pattern, and Graph evidence, marking the report `DEGRADED_FALLBACK`. The analyst can inspect all evidence items and render a decision without disruption.

---

### Q11: How would you scale this platform to 100,000+ daily transactions?
**Answer:**  
1. Replace NetworkX with Neo4j / AWS Neptune for distributed graph traversals.
2. Replace local in-memory RAG with PostgreSQL `pgvector` index / Milvus cluster.
3. Deploy FastAPI backend behind an Auto Scaling Group with Redis celery task queues.

---

### Q12: Key Takeaway Principle for Interviewers
> **"I don't just know how to call an LLM. I know how to build, control, evaluate, secure, and deploy a production AI system around a complex domain problem."**
