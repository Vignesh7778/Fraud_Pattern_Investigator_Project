# Fraud Pattern Investigator --- Technical Architecture

## 1. Architecture Objective

Build a modular, production-style AI investigation platform where the AI
autonomously performs evidence gathering and analysis while a human
analyst retains final decision authority.

The uploaded PRD describes the Investigation Harness as the core
coordinator for database retrieval, ML scoring, pattern detection, graph
analysis, RAG retrieval, and LLM report generation.
fileciteturn1file0L107-L139

## 2. Architecture Principles

1.  **Evidence before reasoning**
2.  **Deterministic systems before probabilistic systems**
3.  **LLM is not the source of truth**
4.  **Narrow tools instead of unrestricted access**
5.  **Every claim should be traceable**
6.  **Human approval for high-impact decisions**
7.  **Fail closed**
8.  **Observable by default**
9.  **Evaluated continuously**
10. **Modular provider abstraction**

## 3. System Context

``` mermaid
flowchart LR
    Analyst[Fraud Analyst]
    UI[React Web App]
    API[FastAPI API]
    H[Investigation Harness]
    DB[(PostgreSQL + pgvector)]
    ML[Fraud Risk Model]
    PE[Pattern Engine]
    G[Graph Analysis]
    RAG[RAG Retrieval]
    LLM[LLM Provider]
    AUDIT[(Audit / Evidence Store)]

    Analyst --> UI
    UI --> API
    API --> H

    H --> DB
    H --> ML
    H --> PE
    H --> G
    H --> RAG
    H --> LLM
    H --> AUDIT

    DB --> ML
    DB --> PE
    DB --> G
```

## 4. Layered Architecture

### Layer 1 --- Presentation

Responsibilities:

-   login
-   investigation submission
-   investigation progress
-   report visualization
-   evidence exploration
-   relationship graph
-   analyst decision
-   audit history

Technology:

-   React
-   TypeScript
-   Vite
-   Tailwind CSS
-   TanStack Query

### Layer 2 --- API

Responsibilities:

-   authentication
-   authorization
-   request validation
-   case creation
-   investigation status
-   report retrieval
-   analyst decisions

Technology:

-   FastAPI
-   Pydantic
-   SQLAlchemy

### Layer 3 --- Investigation Harness

This is the most important layer.

Responsibilities:

-   create investigation state
-   select next investigation step
-   invoke tools
-   validate results
-   append evidence
-   detect missing evidence
-   re-plan
-   terminate safely
-   call the LLM only after sufficient grounded context exists
-   enforce action boundaries

## 5. Harness State Machine

``` mermaid
stateDiagram-v2
    [*] --> CREATED
    CREATED --> LOAD_CASE
    LOAD_CASE --> INITIAL_ASSESSMENT
    INITIAL_ASSESSMENT --> PLAN

    PLAN --> EXECUTE_TOOL
    EXECUTE_TOOL --> VALIDATE_RESULT

    VALIDATE_RESULT --> APPEND_EVIDENCE: valid
    VALIDATE_RESULT --> RETRY: transient failure
    VALIDATE_RESULT --> FAIL_SAFE: invalid/unsafe

    RETRY --> EXECUTE_TOOL
    APPEND_EVIDENCE --> SUFFICIENT?

    SUFFICIENT? --> PLAN: no
    SUFFICIENT? --> CONTRADICTION_CHECK: yes

    CONTRADICTION_CHECK --> REPORT_GENERATION
    REPORT_GENERATION --> HUMAN_REVIEW
    HUMAN_REVIEW --> FINAL_DECISION
    FINAL_DECISION --> AUDIT
    AUDIT --> [*]

    FAIL_SAFE --> AUDIT
```

## 6. Investigation State

Use a typed state object.

``` python
InvestigationState:
    case_id
    transaction_id
    status
    objective
    risk_score
    risk_model_version
    hypotheses[]
    evidence[]
    linked_entities[]
    patterns[]
    retrieved_context[]
    contradictions[]
    tool_history[]
    next_actions[]
    confidence
    report
    errors[]
```

The state must be serializable so investigations can later become
resumable.

## 7. Tool Architecture

The harness should use a registry.

``` text
ToolRegistry
 ├── fetch_transaction
 ├── fetch_account_history
 ├── run_fraud_model
 ├── detect_patterns
 ├── find_linked_entities
 ├── search_policy
 ├── find_similar_cases
 └── verify_evidence
```

Each tool exposes:

-   name
-   description
-   input schema
-   output schema
-   permission requirement
-   timeout
-   retry policy
-   audit metadata

### Example contract

``` python
class FetchTransactionInput(BaseModel):
    txn_id: str

class FetchTransactionOutput(BaseModel):
    txn_id: str
    account_id: str
    amount: float
    timestamp: str
    device_id: str | None
    ip_address: str | None
```

## 8. Deterministic Investigation Tools

### Transaction Tool

Source:

PostgreSQL.

Purpose:

Return authoritative transaction information.

### Account Tool

Purpose:

Return account age, KYC status, transaction history, failed attempts,
and behavior summaries.

### Risk Tool

Purpose:

Run the trained ML model.

Output:

``` json
{
  "risk_score": 0.91,
  "threshold": 0.72,
  "model_version": "fraud-xgb-v1"
}
```

### Pattern Tool

Purpose:

Detect deterministic suspicious behaviors.

### Graph Tool

Purpose:

Discover linked entities.

MVP:

-   NetworkX

Future:

-   Neo4j

### Policy Tool

Purpose:

Retrieve policy/rule context through RAG.

## 9. Fraud ML Architecture

``` mermaid
flowchart LR
    Raw[Transactions] --> Features[Feature Engineering]
    Features --> Split[Train/Validation/Test]
    Split --> XGB[XGBoost]
    XGB --> Eval[Evaluation]
    XGB --> Artifact[Model Artifact]
    Artifact --> API[Risk Tool]
```

Recommended features:

-   transaction amount
-   account age
-   transactions in last N minutes
-   average amount
-   amount deviation
-   failed transaction count
-   device age
-   device-account count
-   IP-account count
-   location change
-   time-of-day
-   merchant frequency

Avoid data leakage.

Use temporal splitting where possible.

## 10. Pattern Engine

Patterns should be deterministic and testable.

Examples:

### Shared Device

``` text
device_id -> accounts > threshold
```

### Shared IP

``` text
ip -> accounts > threshold
```

### Velocity

``` text
count(txns in rolling window) > threshold
```

### Geographic Impossibility

``` text
distance / elapsed_time > realistic_travel_limit
```

### New Account Burst

``` text
multiple newly-created accounts
+
similar behavior
+
same infrastructure
```

Every pattern returns:

``` json
{
  "pattern_id": "shared_device",
  "severity": "high",
  "confidence": 0.94,
  "evidence_ids": ["E12", "E13"]
}
```

## 11. Graph Architecture

MVP graph:

``` text
User
 ↓
Account
 ↓
Transaction
 ↓
Device
 ↓
IP
 ↓
Merchant
```

Edges:

-   user OWNS account
-   account PERFORMS transaction
-   account USES device
-   account USES IP
-   transaction AT merchant

Graph queries should return explainable paths.

Example:

``` text
U101 -> A101 -> D22 <- A204 <- U204
```

This is more useful than returning only a generic cluster score.

## 12. RAG Architecture

Use PostgreSQL + pgvector initially. This keeps structured data and vector retrieval in one self-hosted open-source stack.

Pipeline:

``` mermaid
flowchart LR
    Docs[Policy / Historical Case Docs]
    Chunk[Chunking]
    Embed[Embedding]
    PG[(PostgreSQL + pgvector)]

    Docs --> Chunk --> Embed --> PG

    Query[Investigation Pattern]
    Query --> Retrieve[Hybrid Retrieval]
    PG --> Retrieve
    Retrieve --> Context[Evidence Context]
    Context --> LLM
```

Recommended retrieval approach (all local/self-hosted):

1.  metadata filtering
2.  semantic retrieval
3.  optional keyword/BM25-like retrieval
4.  reranking if needed
5.  source citation

Do not let RAG content override system instructions.

## 13. LLM Architecture

Use a local open-source LLM runtime behind a provider interface:

``` python
class LLMProvider:
    def generate_investigation_report(
        self,
        investigation_context: InvestigationContext
    ) -> InvestigationReport:
        ...
```

This allows switching between providers.

LLM responsibilities:

-   synthesize evidence
-   compare hypotheses
-   explain patterns
-   summarize policies
-   identify uncertainty
-   generate structured report

LLM must NOT:

-   invent transaction data
-   execute arbitrary SQL
-   decide final fraud status
-   execute financial actions
-   override deterministic evidence

## 14. Report Schema

``` python
InvestigationReport:
    case_id
    transaction_id
    risk_level
    risk_score
    primary_hypothesis
    alternative_hypotheses[]
    supporting_evidence[]
    contradicting_evidence[]
    linked_entities[]
    relevant_policies[]
    confidence
    recommended_action
    limitations[]
    generated_at
    model_versions
    harness_version
```

## 15. Evidence Model

Every evidence item should have:

``` text
evidence_id
case_id
source_type
source_reference
claim
raw_value/reference
confidence
timestamp
tool_execution_id
```

Example:

``` json
{
  "evidence_id": "E-104",
  "source_type": "device_analysis",
  "source_reference": "device:D22",
  "claim": "Device D22 was used by 5 accounts",
  "confidence": 1.0
}
```

## 16. Verification Layer

Before report generation:

### Data validation

-   required fields
-   valid IDs
-   valid timestamps
-   valid relationships

### Evidence validation

-   evidence belongs to case
-   source exists
-   evidence isn't duplicated

### Reasoning validation

-   every major claim references evidence
-   unsupported claims are rejected
-   confidence cannot exceed evidence quality
-   contradictory evidence is included

## 17. Human Review Architecture

``` text
AI Report
   ↓
Analyst Review
   ├── Confirm
   ├── Reject
   ├── Request More Investigation
   └── Add Notes
        ↓
Final Decision
        ↓
Audit Store
```

No autonomous financial action in MVP.

## 18. Database Architecture

Use PostgreSQL.

Core tables:

``` text
users
accounts
transactions
devices
ips
merchants
device_account_links
ip_account_links

investigations
investigation_evidence
tool_executions
analyst_decisions
policy_documents
historical_cases
model_versions
audit_events
```

Use JSONB for flexible evidence metadata.

Use pgvector for document embeddings.

Use Alembic for migrations.

## 19. API Design

### Auth

``` http
POST /api/v1/auth/login
```

### Create Investigation

``` http
POST /api/v1/investigations
```

Request:

``` json
{
  "transaction_id": "TXN1001"
}
```

### Investigation Status

``` http
GET /api/v1/investigations/{case_id}
```

### Investigation Report

``` http
GET /api/v1/investigations/{case_id}/report
```

### Evidence

``` http
GET /api/v1/investigations/{case_id}/evidence
```

### Graph

``` http
GET /api/v1/investigations/{case_id}/graph
```

### Human Decision

``` http
POST /api/v1/investigations/{case_id}/decision
```

### Audit

``` http
GET /api/v1/investigations/{case_id}/audit
```

## 20. Security Architecture

``` text
User
 ↓
Authentication
 ↓
RBAC
 ↓
API Authorization
 ↓
Harness
 ↓
Permission-aware Tool Registry
 ↓
Least-privilege data access
```

Security controls:

-   JWT/OAuth2
-   role-based authorization
-   parameterized SQL
-   database least privilege
-   input validation
-   strict tool schemas
-   secret management
-   prompt injection defense
-   output validation
-   PII redaction
-   audit logging
-   rate limiting

## 21. Observability

Track:

### Application

-   request latency
-   error rate
-   throughput
-   database latency

### Harness

-   investigation duration
-   tool count
-   tool latency
-   retries
-   replans
-   termination reason

### LLM

-   latency
-   token usage
-   provider
-   model
-   failures
-   structured-output validation failures

### AI Quality

-   unsupported claim rate
-   evidence coverage
-   analyst disagreement
-   investigation success rate

Use:

-   OpenTelemetry
-   structured JSON logging
-   Prometheus/Grafana optionally

## 22. Deployment

Local:

``` text
Docker Compose
 ├── frontend
 ├── backend
 ├── postgres
 └── optional observability services
```

Production-style path:

``` text
Frontend
   ↓
HTTPS
   ↓
API
   ↓
Backend services
   ↓
PostgreSQL
   ↓
LLM provider
```

Keep the backend stateless where possible.

## 23. Recommended Final Stack

  Layer            Choice
  ---------------- -----------------------------
  Language         Python 3.12+
  API              FastAPI
  Validation       Pydantic v2
  ORM              SQLAlchemy
  Migrations       Alembic
  DB               PostgreSQL
  Vector           pgvector
  ML               XGBoost + scikit-learn
  Explainability   SHAP
  Graph MVP        NetworkX
  Graph future     Neo4j
  RAG              Custom retrieval + pgvector
  LLM              Provider abstraction
  Harness          Custom Python state machine
  Frontend         React + TypeScript + Vite
  Styling          Tailwind CSS
  Data Fetching    TanStack Query
  Testing          Pytest
  Load Testing     Locust
  Containers       Docker Compose
  CI/CD            GitHub Actions
  Observability    OpenTelemetry
  Metrics          Prometheus
  Dashboards       Grafana
  Cache            Redis only when justified

## 24. Why Custom Harness Instead of Starting With a Framework?

The original PRD allows LangChain/LlamaIndex/OpenAI Agents SDK. For this
implementation, a custom harness is preferable initially.

Reason:

``` text
Framework-first
    ↓
Harder to understand what the agent actually does

Custom Harness
    ↓
Explicit state
Explicit tool contracts
Explicit retries
Explicit verification
Explicit termination
Explicit audit
```

Once the custom loop is stable, a framework can be evaluated against it.

The source PRD itself allows a custom loop in FastAPI as an option.
fileciteturn1file0L548-L567

## 25. Open-Source / Local-Only Policy

The project must be buildable without proprietary AI APIs or paid SaaS dependencies.

### Required policy

- **LLM:** Ollama + an open-weight/open-source model with a license compatible with the project.
- **Embeddings:** local open-source model using Sentence Transformers/FastEmbed.
- **Vector search:** PostgreSQL + pgvector.
- **Graph:** NetworkX for MVP.
- **Database:** PostgreSQL.
- **Backend:** FastAPI.
- **Frontend:** React/TypeScript.
- **Observability:** OpenTelemetry + Prometheus/Grafana where needed.
- **Infrastructure:** Docker/Docker Compose.
- **CI:** GitHub Actions.

### Explicitly prohibited as required dependencies

- OpenAI API
- Anthropic API
- Gemini API
- Pinecone hosted service
- Weaviate Cloud
- proprietary paid agent APIs
- proprietary paid fraud APIs
- commercial threat-intelligence APIs

External services may be added later only if an open-source/self-hosted equivalent is not sufficient and the project owner explicitly approves it.

## 26. Architecture Quality Gates

Before moving to the next layer:

### Harness

-   deterministic state transitions tested
-   tool contracts validated
-   retries tested
-   unsafe actions blocked

### ML

-   temporal leakage checked
-   baseline established
-   metrics documented

### RAG

-   retrieval evaluation completed
-   sources traceable

### LLM

-   structured output enforced
-   hallucination/unsupported claim tests pass

### Human Review

-   final decision cannot be bypassed

### Security

-   unauthorized tools blocked
-   SQL injection tests pass
-   prompt injection tests pass

## 27. Scaling Path

``` text
MVP
PostgreSQL + pgvector + NetworkX
        ↓
Larger dataset
Redis + async workers
        ↓
Large relationship graph
Neo4j
        ↓
High investigation volume
Queue / event-driven architecture
        ↓
Advanced intelligence
Graph ML + anomaly detection
        ↓
Enterprise
SSO + advanced RBAC + compliance
```

Do not implement the entire scaling path before the MVP proves the need.
