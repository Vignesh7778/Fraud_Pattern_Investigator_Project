# Fraud Pattern Investigator --- Product Requirements Document (PRD)

## 1. Executive Summary

**Fraud Pattern Investigator (FPI)** is a production-style, AI-powered
investigation platform for fintech and financial-risk workflows.

The system does **not** make the final fraud decision. Its purpose is to
autonomously perform the investigation work that normally requires a
human analyst: gather evidence, analyze transaction behavior, correlate
related accounts/devices/IPs, detect suspicious patterns, retrieve
applicable policies and prior knowledge, verify evidence, and generate
an auditable investigation report.

The human fraud/risk analyst remains the final authority.

### Core principle

> **AI investigates. Human decides.**

The source PRD defines the system as taking suspicious transactions,
analyzing evidence across data sources, identifying underlying fraud
patterns, and producing a structured report with risk score, evidence
chain, relevant policies, confidence, and recommended actions. It also
specifies a lightweight agent harness to coordinate data retrieval, ML
inference, pattern detection, graph analysis, and LLM reasoning.

## 2. Problem Statement

Fraud and risk teams frequently receive alerts that say a transaction is
suspicious but do not provide enough context to understand **why**.

The investigation information is fragmented across:

-   transaction history
-   account history
-   devices
-   IP addresses
-   locations
-   merchants
-   behavioral patterns
-   historical cases
-   fraud policies

Manual analysts must correlate these signals themselves.

### Core problems

1.  **Low explainability** --- a score such as `0.92 fraud probability`
    does not explain the evidence.
2.  **Fragmented evidence** --- relevant signals live in different
    systems.
3.  **Cross-transaction blind spots** --- coordinated fraud can only
    become obvious when related entities are examined together.
4.  **Manual investigation cost** --- analysts spend time collecting and
    correlating evidence.
5.  **Decision risk** --- an AI-only decision is inappropriate for
    high-impact financial workflows.

## 3. Product Vision

Build an AI investigation assistant that can take a suspicious
transaction/case and autonomously answer:

-   What happened?
-   Why is it suspicious?
-   Which entities are related?
-   What fraud patterns are present?
-   What evidence supports the hypothesis?
-   What evidence contradicts it?
-   Which policies or historical cases are relevant?
-   What additional investigation is necessary?
-   What should the human analyst consider next?

The system produces an **evidence-backed recommendation**, never an
autonomous final fraud decision.

## 4. Target Users

### Primary --- Fraud Analyst

Needs fast, explainable investigation results and evidence for final
review.

### Secondary --- Security/SOC Analyst

Uses the system to investigate suspicious account activity and connected
entities.

### Compliance/Audit Officer

Needs reproducible investigation trails, evidence, policies, timestamps,
and analyst decisions.

### Product/Engineering Owner

Needs metrics for model quality, investigation quality, latency,
reliability, and analyst efficiency.

## 5. Product Goals

### MVP goals

-   Investigate a single suspicious transaction or case.
-   Calculate an ML-based risk score.
-   Detect deterministic suspicious patterns.
-   Discover linked accounts/devices/IPs.
-   Retrieve relevant fraud-policy knowledge.
-   Use an AI investigation harness to decide which tools to call.
-   Verify tool results before continuing.
-   Produce a structured investigation report.
-   Show supporting and contradicting evidence.
-   Require human review for the final decision.
-   Record a complete audit trail.

### Target metrics

The uploaded PRD proposes:

-   Precision/recall target around 85% for the baseline fraud
    classifier.
-   Explanation fidelity target around 90%.
-   At least 50% reduction in investigation time compared with a manual
    baseline.
-   Core API latency target below 200 ms for simple calls.
-   End-to-end investigation target around 1--2 seconds for cached demo
    cases.
-   Track precision, recall, F1, explanation fidelity, latency,
    throughput, analyst disagreement, and robustness.

These targets should be treated as **engineering goals**, not claims
until measured.

## 6. Non-Goals

The MVP will NOT:

-   automatically block accounts
-   automatically refund transactions
-   automatically accuse a customer of fraud
-   use real payment credentials
-   connect to production banking systems
-   replace a fraud analyst
-   claim regulatory compliance without an actual compliance assessment
-   start with a large multi-agent architecture
-   require a graph database before the MVP proves the need

## 7. Product Principles

1.  **Human remains the final decision-maker.**
2.  **Structured systems are sources of truth.**
3.  **LLMs synthesize evidence; they do not invent evidence.**
4.  **Every important claim must have traceable evidence.**
5.  **The investigation process must be auditable.**
6.  **Tools expose narrow capabilities, never unrestricted SQL or system
    access.**
7.  **The architecture should be modular and replaceable.**
8.  **Every AI component must have an evaluation strategy.**
9.  **Use the simplest architecture that solves the problem.**
10. **Synthetic data only for the portfolio prototype.**

## 8. Core User Journey

``` text
Analyst selects suspicious transaction
        ↓
Investigation created
        ↓
Harness retrieves transaction
        ↓
Initial ML risk scoring
        ↓
Pattern detection
        ↓
Harness decides whether more investigation is required
        ↓
Account / device / IP / merchant investigation
        ↓
Graph relationship analysis
        ↓
RAG policy / historical knowledge retrieval
        ↓
Evidence verification
        ↓
Contradiction search
        ↓
AI synthesis
        ↓
Structured investigation report
        ↓
Human analyst reviews evidence
        ↓
Human final decision
        ↓
Decision + reasoning stored in audit trail
```

## 9. Functional Requirements

### FR-01 Case Creation

The system shall create an investigation case from a transaction ID.

### FR-02 Transaction Retrieval

The system shall retrieve structured transaction data and associated
account metadata.

### FR-03 Risk Scoring

The system shall invoke a trained fraud-risk model and return:

-   risk score
-   model version
-   threshold
-   relevant feature contributions

### FR-04 Pattern Detection

The system shall detect at least:

-   shared device
-   shared IP
-   transaction velocity
-   unusual amount
-   geographic anomaly
-   new-account behavior
-   repeated behavioral patterns

### FR-05 Relationship Investigation

The system shall identify relationships between:

-   users
-   accounts
-   transactions
-   devices
-   IP addresses
-   merchants

### FR-06 Dynamic Investigation

The harness shall determine whether additional tools are required based
on current evidence.

### FR-07 RAG

The system shall retrieve relevant:

-   fraud policies
-   internal investigation rules
-   synthetic historical case summaries
-   investigation guidance

### FR-08 Evidence Verification

The system shall verify:

-   required fields exist
-   evidence is associated with the correct case
-   sources are valid
-   duplicate evidence is removed
-   contradictory signals are surfaced

### FR-09 Contradiction Analysis

The system should actively search for evidence that weakens the current
investigation hypothesis.

### FR-10 Investigation Report

The report shall contain:

-   case ID
-   transaction ID
-   risk level
-   risk score
-   investigation hypothesis
-   suspicious patterns
-   supporting evidence
-   contradicting evidence
-   linked entities
-   relevant policy references
-   confidence
-   recommended next action
-   tool execution summary
-   model/harness versions
-   timestamp

### FR-11 Human Decision

The analyst shall be able to:

-   approve/confirm the recommendation
-   reject the recommendation
-   request additional investigation
-   add analyst notes

The system shall not execute high-impact actions automatically.

### FR-12 Auditability

The system shall store:

-   case creation
-   tool calls
-   tool outputs
-   evidence IDs
-   AI recommendation
-   confidence
-   analyst decision
-   analyst notes
-   timestamps
-   system/model versions

## 10. AI Architecture

The system deliberately separates responsibilities.

``` text
Deterministic Rules
    ↓
Known suspicious signals

ML Model
    ↓
Probabilistic transaction risk

Pattern Engine
    ↓
Behavioral patterns

Graph Analysis
    ↓
Entity relationships

RAG
    ↓
Relevant knowledge/policy

LLM
    ↓
Evidence synthesis + explanation

Investigation Harness
    ↓
Coordinates the complete workflow

Human
    ↓
Final decision
```

## 11. Investigation Harness

The Harness is the core AI orchestration component.

### Lifecycle

``` text
START
  ↓
Load Case
  ↓
Build Investigation State
  ↓
Plan Next Investigation Step
  ↓
Execute One Tool
  ↓
Validate Result
  ↓
Append Evidence
  ↓
Evaluate Evidence Sufficiency
  ↓
 ┌───────────────┐
 │ More evidence?│
 └───────┬───────┘
     YES │    NO
         ↓     ↓
      Re-plan  Verify
         ↓      ↓
       Tool   Report
         └──────┘
            ↓
          HUMAN
```

### Important design rule

The LLM should not receive arbitrary application access.

The harness exposes typed tools such as:

``` python
fetch_transaction(txn_id)
fetch_account_history(account_id)
run_fraud_model(transaction_id)
detect_patterns(transaction_id)
find_linked_entities(entity_id)
search_policy(query)
find_similar_cases(pattern)
verify_evidence(case_id)
```

Each tool has a strict input/output schema.

## 12. Data Model

Core entities:

-   users
-   accounts
-   transactions
-   devices
-   IP addresses
-   merchants
-   device-account links
-   IP-account links
-   investigations
-   investigation evidence
-   tool executions
-   analyst decisions
-   policy documents
-   historical cases

The source PRD proposes PostgreSQL and pgvector for structured data and
embeddings.

## 13. Synthetic Dataset

The MVP will use synthetic data.

Suggested initial scale:

-   \~1,000 users
-   1--3 accounts per user
-   \~10,000 transactions
-   multiple months of activity

Injected scenarios:

1.  single-transaction anomaly
2.  device-pool fraud
3.  IP reuse
4.  high-velocity activity
5.  bot-like behavior
6.  coordinated new-account activity
7.  geographic anomalies
8.  legitimate shared-device false positives

Every injected scenario should include a ground-truth pattern label.

## 14. Evaluation

### ML

-   precision
-   recall
-   F1
-   ROC-AUC
-   PR-AUC
-   false-positive rate

### Pattern Engine

-   pattern precision
-   pattern recall
-   false-positive rate

### Graph Analysis

-   correct linked-entity discovery
-   fraud-ring detection accuracy

### RAG

-   retrieval precision
-   retrieval recall
-   citation/source correctness

### Agent/Harness

-   correct tool selection
-   unnecessary tool calls
-   investigation completion rate
-   recovery rate
-   average steps per case
-   failed-tool recovery

### Explanation

-   evidence fidelity
-   evidence completeness
-   unsupported claim rate
-   contradiction handling

### Business/Workflow

-   analyst investigation time
-   analyst agreement/disagreement
-   cases requiring re-investigation
-   report usefulness

## 15. Security

### Authentication

Use OAuth2/JWT or API keys for the prototype.

### RBAC

Roles:

-   analyst
-   auditor
-   admin

### Tool Security

The agent must never receive unrestricted database access.

Bad:

``` text
execute_sql(any_query)
```

Good:

``` text
fetch_transaction(txn_id)
fetch_account_history(account_id)
```

### Prompt Injection

-   do not expose raw user prompts to the reasoning model unnecessarily
-   treat retrieved documents and transaction fields as untrusted data
-   separate instructions from evidence
-   validate tool parameters
-   use structured outputs
-   never allow retrieved text to redefine system instructions

### Privacy

-   use synthetic data
-   minimize PII
-   use identifiers rather than names in prompts
-   redact sensitive values from logs
-   encrypt secrets
-   use HTTPS in deployed environments

### Human Safety Boundary

AI recommendations must never automatically execute
irreversible/high-impact financial actions.

## 16. Recommended Tech Stack

### Frontend

-   React
-   TypeScript
-   Vite
-   Tailwind CSS
-   TanStack Query
-   React Router
-   Recharts

### Backend

-   Python 3.12+
-   FastAPI
-   Pydantic v2
-   SQLAlchemy
-   Alembic

### Database

-   PostgreSQL
-   pgvector

Use PostgreSQL + pgvector initially rather than introducing a separate
vector database.

### ML

-   pandas
-   NumPy
-   scikit-learn
-   XGBoost
-   SHAP for model explanation

### Graph

-   NetworkX for MVP
-   Neo4j only when scale/use-case justifies it

### RAG

-   pgvector
-   embedding model abstraction
-   custom retrieval layer initially
-   optional LlamaIndex/LangChain only where they provide measurable
    value

### LLM

Use a provider abstraction so the application can switch between:

-   OpenAI
-   Anthropic
-   another compatible provider

### Agent/Harness

**Preferred:** custom Python state-machine/orchestration layer.

Optional later:

-   LangGraph
-   OpenAI Agents SDK
-   another agent framework

The custom harness is preferred for this portfolio project because the
implementation itself demonstrates AI-system engineering.

### Infrastructure

-   Docker
-   Docker Compose
-   Redis only if caching/background work becomes necessary
-   GitHub Actions
-   OpenTelemetry
-   Prometheus/Grafana optional for deeper observability

### Testing

-   pytest
-   pytest-asyncio
-   httpx
-   factory-boy
-   Locust for load testing

## 17. Repository Structure

``` text
fraud-pattern-investigator/
├── docs/
│   ├── PRD.md
│   ├── technical_architecture.md
│   ├── evaluation.md
│   └── threat_model.md
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── domain/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── tools/
│   │   ├── harness/
│   │   ├── ml/
│   │   ├── patterns/
│   │   ├── graph/
│   │   ├── rag/
│   │   ├── llm/
│   │   └── observability/
│   ├── tests/
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── features/
│   │   ├── api/
│   │   └── types/
│   └── package.json
├── data/
│   ├── synthetic/
│   ├── policies/
│   └── seeds/
├── ml/
│   ├── notebooks/
│   ├── training/
│   └── artifacts/
├── scripts/
├── infra/
├── docker-compose.yml
├── .env.example
└── README.md
```

## 18. MVP Deliverables

1.  Working synthetic data generator.
2.  PostgreSQL schema and seed data.
3.  Baseline fraud model.
4.  Pattern engine.
5.  NetworkX relationship analysis.
6.  RAG policy retrieval.
7.  Custom investigation harness.
8.  Tool registry with typed contracts.
9.  Evidence store.
10. Structured investigation report.
11. Human review interface.
12. Audit logging.
13. Authentication/RBAC.
14. Automated test suite.
15. Evaluation report.
16. Dockerized local deployment.
17. Architecture documentation.
18. 5--10 minute demo.

## 19. Definition of Done

The MVP is complete only when:

-   a transaction can be submitted
-   the system creates a case
-   the harness performs an investigation
-   multiple tools can be invoked
-   tool results are verified
-   suspicious patterns are identified
-   related entities can be displayed
-   relevant policy context is retrieved
-   evidence is cited in the report
-   contradictions can be shown
-   the LLM cannot invent unsupported evidence
-   a human can make the final decision
-   the complete investigation is auditable
-   automated tests pass
-   evaluation metrics are reported
-   the application runs through Docker
-   the architecture can be explained without relying on buzzwords

## 20. Future Extensions

Only after the MVP is measured:

-   multi-transaction case investigations
-   persistent fraud-ring graph database
-   investigation memory
-   specialized sub-agents
-   streaming investigation
-   advanced anomaly detection
-   graph ML/GNN
-   analyst feedback learning
-   notification integrations
-   enterprise SSO
-   advanced compliance workflows

## 21. Career Positioning

The project should be presented as:

> **Fraud Pattern Investigator --- Autonomous AI Investigation Harness
> for Evidence-Based Fraud Analysis**

Resume-level description:

> Built an AI-powered investigation harness that orchestrates
> transaction risk scoring, behavioral pattern detection, graph-based
> entity analysis, policy retrieval, evidence verification, and LLM
> reasoning to generate auditable fraud investigation reports while
> keeping final decisions under human control.
