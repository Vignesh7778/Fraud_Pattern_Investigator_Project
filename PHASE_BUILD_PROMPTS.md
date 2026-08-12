# Fraud Pattern Investigator --- Phase-by-Phase Build Prompts

## How to Use This Document

Run **one phase at a time** in your coding environment/AI coding agent.

Before every phase:

-   read `PRD.md`
-   read `technical_architecture.md`
-   inspect the current repository
-   preserve existing working code
-   implement only the requested phase
-   run tests
-   update documentation

Never skip acceptance criteria.

------------------------------------------------------------------------

# PHASE 0 --- Project Initialization & Engineering Contract

## Master Prompt

You are starting Phase 0 of Fraud Pattern Investigator.

Read:

-   PRD.md
-   technical_architecture.md
-   MASTER_BUILD_PROMPT.md

Create the repository foundation.

### Tasks

1.  Create the complete directory structure.
2.  Initialize backend Python project.
3.  Initialize frontend React + TypeScript + Vite project.
4.  Add Docker Compose foundation.
5.  Add `.env.example`.
6.  Add `.gitignore`.
7.  Add configuration management.
8.  Add structured logging foundation.
9.  Add health endpoint.
10. Add frontend/backend development instructions.
11. Add pre-commit or formatting configuration where useful.
12. Add initial CI workflow.
13. Create architecture documentation placeholders.
14. Create a clear README.

### Backend

Use:

-   Python 3.12+
-   FastAPI
-   Pydantic v2
-   SQLAlchemy
-   Alembic
-   pytest

Create:

``` text
backend/app/
    api/
    core/
    db/
    domain/
    models/
    schemas/
    services/
    tools/
    harness/
    ml/
    patterns/
    graph/
    rag/
    llm/
    observability/
```

### Frontend

Create:

``` text
frontend/src/
    components/
    features/
    pages/
    api/
    types/
```

### Acceptance Criteria

-   backend starts
-   frontend starts
-   Docker Compose starts
-   `/health` works
-   environment configuration works
-   tests run
-   CI runs
-   README explains startup
-   no secrets committed

------------------------------------------------------------------------

# PHASE 1 --- Database & Synthetic Data

## Master Prompt

Build the complete synthetic data foundation.

### Database

Create PostgreSQL schema and Alembic migrations.

Tables:

-   users
-   accounts
-   transactions
-   devices
-   ips
-   merchants
-   device_account_links
-   ip_account_links
-   investigations
-   investigation_evidence
-   tool_executions
-   analyst_decisions
-   policy_documents
-   historical_cases
-   model_versions
-   audit_events

Use:

-   UUID or safe IDs
-   timestamps
-   indexes
-   foreign keys
-   constraints

### Synthetic Generator

Use Faker and controlled random generation.

Generate:

-   1,000 users
-   1--3 accounts/user
-   10,000+ transactions
-   devices
-   IPs
-   merchants
-   realistic timestamps
-   amounts
-   locations

Inject labeled scenarios:

1.  legitimate traffic
2.  shared-device fraud
3.  shared-IP fraud
4.  high-velocity fraud
5.  abnormal transaction amount
6.  impossible travel
7.  coordinated new accounts
8.  bot-like behavior
9.  ambiguous legitimate shared-device cases

Store ground-truth pattern labels.

### Acceptance Criteria

-   database migration succeeds
-   seed script is repeatable
-   dataset is realistic
-   fraud labels exist
-   ground-truth pattern labels exist
-   indexes exist for investigation queries
-   tests validate relationships

------------------------------------------------------------------------

# PHASE 2 --- Feature Engineering & Fraud Model

## Master Prompt

Build the baseline ML fraud-risk system.

### Tasks

Create features:

-   transaction amount
-   account age
-   transaction count in rolling windows
-   average amount
-   amount deviation
-   failed attempts
-   device age
-   number of accounts per device
-   number of accounts per IP
-   location change
-   time-of-day
-   merchant frequency

Use temporal or leakage-safe splitting.

Train:

-   baseline Logistic Regression
-   XGBoost final baseline

Evaluate:

-   precision
-   recall
-   F1
-   ROC-AUC
-   PR-AUC
-   confusion matrix

Use SHAP for feature contribution analysis.

Save:

``` text
model artifact
feature schema
model version
metrics JSON
training metadata
```

Create a reusable inference service.

### Acceptance Criteria

-   model trains reproducibly
-   test metrics are documented
-   inference returns structured output
-   model version is tracked
-   no training leakage
-   SHAP output is available

------------------------------------------------------------------------

# PHASE 3 --- Pattern Engine

## Master Prompt

Build deterministic fraud-pattern detection.

Implement:

### Shared Device

Detect device reuse across multiple accounts.

### Shared IP

Detect unusual IP/account reuse.

### Velocity

Detect excessive transactions in a rolling time window.

### Amount Anomaly

Compare transaction amount against account/merchant baseline.

### Geographic Anomaly

Detect unrealistic location transitions.

### New Account Burst

Detect clusters of newly created accounts with similar behavior.

### Bot-like Behavior

Detect repeated rapid transactions.

Every detector must return:

``` json
{
  "pattern_id": "...",
  "severity": "...",
  "confidence": 0.0,
  "description": "...",
  "evidence": [...]
}
```

### Acceptance Criteria

-   each pattern has unit tests
-   false-positive examples exist
-   pattern results reference evidence
-   patterns are independently callable
-   no LLM dependency exists in this layer

------------------------------------------------------------------------

# PHASE 4 --- Graph Investigation

## Master Prompt

Implement relationship analysis using NetworkX.

Create graph nodes:

-   user
-   account
-   transaction
-   device
-   IP
-   merchant

Create edges:

-   owns
-   performs
-   uses_device
-   uses_ip
-   transacts_with

Implement:

-   linked account discovery
-   shared device discovery
-   shared IP discovery
-   connected component analysis
-   short-path discovery
-   suspicious cluster summaries

Return explainable paths.

### Example

``` text
User A
 → Account A
 → Device D22
 ← Account B
 ← User B
```

### Acceptance Criteria

-   graph can be generated from database data
-   linked entities are correct
-   graph results include relationship evidence
-   suspicious clusters can be demonstrated
-   tests cover graph traversal

------------------------------------------------------------------------

# PHASE 5 --- Evidence Model & Investigation State

## Master Prompt

Build the evidence-first foundation before adding the LLM.

Create typed models for:

-   InvestigationState
-   Evidence
-   Hypothesis
-   PatternFinding
-   LinkedEntity
-   ToolExecution
-   InvestigationReport
-   AnalystDecision

Implement persistence.

Every evidence item must contain:

-   evidence ID
-   source type
-   source reference
-   claim
-   value/reference
-   confidence
-   timestamp
-   tool execution ID

Implement evidence deduplication.

Implement evidence validation.

### Acceptance Criteria

-   evidence can be persisted
-   evidence can be retrieved
-   duplicate evidence is removed
-   every evidence item belongs to a case
-   schema validation works

------------------------------------------------------------------------

# PHASE 6 --- Tool Registry

## Master Prompt

Build the typed investigation tool layer.

Implement:

``` text
fetch_transaction
fetch_account_history
run_fraud_model
detect_patterns
find_linked_entities
search_policy
find_similar_cases
verify_evidence
```

Each tool must define:

-   name
-   description
-   input schema
-   output schema
-   permission
-   timeout
-   retry policy

Implement a central ToolRegistry.

Do not expose unrestricted SQL.

Add tool-level audit logging.

### Acceptance Criteria

-   every tool is independently testable
-   invalid parameters fail safely
-   unauthorized tools are blocked
-   tool execution is logged
-   tool outputs are typed

------------------------------------------------------------------------

# PHASE 7 --- Custom Investigation Harness

## Master Prompt

Build the core AI investigation Harness.

Do NOT use a framework to hide the workflow.

Implement an explicit state machine.

Required states:

``` text
CREATED
LOAD_CASE
INITIAL_ASSESSMENT
PLAN
EXECUTE_TOOL
VALIDATE_RESULT
APPEND_EVIDENCE
CHECK_SUFFICIENCY
REPLAN
CONTRADICTION_CHECK
GENERATE_REPORT
HUMAN_REVIEW
FINAL_DECISION
AUDIT
FAILED
```

Implement:

-   investigation state
-   step limits
-   tool timeouts
-   retries
-   error recovery
-   re-planning
-   termination
-   audit events

Initial planning can be deterministic/rule-driven.

Do not add LLM planning yet.

### Acceptance Criteria

Given a transaction:

``` text
load
→ risk
→ patterns
→ graph
→ evidence
→ report preparation
```

works through the harness.

Test:

-   successful path
-   tool failure
-   missing data
-   retry
-   max-step termination
-   unauthorized action

------------------------------------------------------------------------

# PHASE 8 --- RAG Knowledge System

## Master Prompt

Build the policy and historical-case RAG system.

Use:

-   PostgreSQL
-   pgvector
-   embedding provider abstraction

Create synthetic knowledge documents:

-   fraud policies
-   investigation guidelines
-   synthetic historical cases
-   pattern descriptions
-   analyst procedures

Pipeline:

``` text
Document
→ chunk
→ embed
→ pgvector
→ retrieve
→ source-aware context
```

Implement:

-   metadata filtering
-   similarity retrieval
-   source tracking
-   top-k retrieval
-   context formatting

### Acceptance Criteria

-   documents can be indexed
-   retrieval returns relevant passages
-   every passage has source metadata
-   irrelevant documents are minimized
-   RAG tests exist

------------------------------------------------------------------------

# PHASE 9 --- LLM Reasoning & Structured Report

## Master Prompt

Integrate a **local open-source LLM through Ollama**.

The project must run without OpenAI, Anthropic, Gemini, or other proprietary hosted LLM APIs.

The LLM must receive only grounded investigation context.

Build a provider abstraction.

Prompt sections:

``` text
SYSTEM RULES
INVESTIGATION OBJECTIVE
TRANSACTION DATA
ML FINDINGS
PATTERN FINDINGS
GRAPH FINDINGS
RAG CONTEXT
SUPPORTING EVIDENCE
CONTRADICTING EVIDENCE
KNOWN LIMITATIONS
```

Require structured JSON output.

The report must contain:

-   risk level
-   primary hypothesis
-   alternative hypotheses
-   supporting evidence IDs
-   contradicting evidence IDs
-   confidence
-   relevant policies
-   recommendation
-   limitations

Implement output validation.

Reject unsupported evidence references.

### Acceptance Criteria

-   report conforms to schema
-   evidence IDs are valid
-   unsupported claims are detected
-   hallucinated transaction facts are rejected
-   provider failures are handled

------------------------------------------------------------------------

# PHASE 10 --- Dynamic AI Investigation Loop

## Master Prompt

Now upgrade the deterministic Harness into a genuinely adaptive
investigation system.

The LLM may recommend the next tool, but the Harness remains the
authority.

Implement:

``` text
Observe
→ Hypothesize
→ Select next tool
→ Validate permission
→ Execute
→ Verify
→ Update evidence
→ Decide whether more investigation is needed
→ Re-plan
```

The model must never directly execute tools.

It proposes a structured action:

``` json
{
  "tool": "find_linked_entities",
  "reason": "Device reuse was detected and related accounts should be investigated",
  "required_inputs": {
    "entity_id": "D22"
  }
}
```

The Harness validates and executes it.

Add:

-   max steps
-   repeated-tool protection
-   tool allowlist
-   action validation
-   confidence thresholds
-   early termination

### Acceptance Criteria

Demonstrate at least three different investigation paths.

Example:

``` text
Case A:
risk → shared device → graph → RAG → report

Case B:
risk → velocity → account history → report

Case C:
risk → location anomaly → transaction history → contradiction → report
```

This is the core Agentic AI demonstration.

------------------------------------------------------------------------

# PHASE 11 --- Contradiction & Verification Engine

## Master Prompt

Build a dedicated verification layer.

The system must ask:

> "What evidence supports this hypothesis?"

and:

> "What evidence contradicts this hypothesis?"

Implement:

-   supporting evidence scoring
-   contradicting evidence detection
-   missing evidence detection
-   confidence adjustment
-   source reliability
-   unsupported claim detection

Before report generation:

``` text
validate evidence
→ detect contradictions
→ calculate evidence coverage
→ calculate confidence
→ generate report
```

### Acceptance Criteria

Create test cases where:

-   evidence supports fraud
-   evidence contradicts fraud
-   evidence is incomplete
-   sources disagree

The report must represent uncertainty instead of forcing a fraud
conclusion.

------------------------------------------------------------------------

# PHASE 12 --- Human Review UI

## Master Prompt

Build the analyst-facing React interface.

Pages:

``` text
Login
Dashboard
Investigation Search
Investigation Detail
Evidence Explorer
Relationship Graph
Policy Evidence
Audit Timeline
```

Investigation detail should show:

-   risk score
-   risk level
-   primary hypothesis
-   evidence
-   contradictions
-   graph
-   policy references
-   tool timeline
-   AI recommendation
-   confidence
-   limitations

Human actions:

``` text
Confirm
Reject
Request More Investigation
Add Notes
```

Never label the AI recommendation as the final decision.

### Acceptance Criteria

A complete investigation can be performed from the UI.

------------------------------------------------------------------------

# PHASE 13 --- Authentication, RBAC & Security

## Master Prompt

Implement production-style security.

Roles:

``` text
analyst
auditor
admin
```

Permissions:

-   investigate
-   view evidence
-   view audit
-   make decision
-   manage policies
-   manage users

Implement:

-   JWT/OAuth2
-   password hashing
-   RBAC middleware
-   tool authorization
-   rate limiting
-   CORS
-   secure headers
-   parameterized SQL

Add prompt-injection defenses:

-   treat retrieved text as untrusted
-   separate instructions from evidence
-   validate structured model output
-   prevent tool escalation
-   never execute LLM-generated arbitrary code

### Acceptance Criteria

Security tests demonstrate:

-   unauthorized access blocked
-   analyst cannot administer users
-   auditor cannot make final decisions
-   unsafe tool calls blocked
-   SQL injection attempts fail
-   prompt injection attempts do not change tool permissions

------------------------------------------------------------------------

# PHASE 14 --- Auditability & Observability

## Master Prompt

Implement complete observability.

Use structured JSON logging.

Track:

-   request ID
-   case ID
-   user ID
-   harness state
-   tool calls
-   tool latency
-   retry count
-   replan count
-   LLM calls
-   model versions
-   report generation
-   human decision

Use OpenTelemetry.

Create metrics for:

``` text
investigation_duration
tool_latency
tool_failure_rate
llm_latency
investigation_success_rate
unsupported_claim_rate
analyst_disagreement_rate
```

### Acceptance Criteria

A single investigation can be reconstructed from logs/audit events.

------------------------------------------------------------------------

# PHASE 15 --- Evaluation System

## Master Prompt

Build a repeatable AI evaluation pipeline.

Evaluate:

### ML

-   precision
-   recall
-   F1
-   ROC-AUC
-   PR-AUC

### Pattern

-   precision
-   recall

### RAG

-   retrieval correctness
-   source correctness

### Harness

-   tool-selection accuracy
-   unnecessary tool calls
-   average steps
-   recovery rate
-   completion rate

### LLM

-   evidence fidelity
-   unsupported claim rate
-   contradiction handling
-   schema validity

### Human workflow

-   investigation time
-   analyst agreement
-   report clarity

Create:

``` text
evaluation/
    datasets/
    runners/
    metrics/
    reports/
```

Produce a machine-readable evaluation report.

Do not fabricate metrics.

------------------------------------------------------------------------

# PHASE 16 --- Performance & Reliability

## Master Prompt

Optimize only after measuring.

Test:

-   API latency
-   investigation latency
-   database query latency
-   RAG retrieval latency
-   LLM latency
-   concurrent investigations

Use caching only where measurement supports it.

Add:

-   connection pooling
-   bounded retries
-   timeouts
-   graceful degradation

Example degradation:

``` text
LLM unavailable
→ still show ML + pattern + graph evidence
→ mark AI synthesis unavailable
```

### Acceptance Criteria

System remains useful when non-critical AI components fail.

------------------------------------------------------------------------

# PHASE 17 --- Docker & Deployment

## Master Prompt

Containerize the complete system.

Services:

``` text
frontend
backend
postgres
```

Optional:

``` text
redis
prometheus
grafana
```

Create:

-   Dockerfiles
-   docker-compose.yml
-   health checks
-   environment configuration
-   production-like startup
-   database migration process

Document deployment.

Do not commit secrets.

### Acceptance Criteria

A fresh machine can start the application with documented commands.

------------------------------------------------------------------------

# PHASE 18 --- Final Security & Quality Audit

## Master Prompt

Perform a complete engineering audit.

Inspect:

-   architecture
-   security
-   AI behavior
-   tool permissions
-   data access
-   prompt injection
-   SQL injection
-   authentication
-   RBAC
-   audit logs
-   error handling
-   tests
-   performance
-   documentation

Find issues.

Do not immediately rewrite everything.

Create:

``` text
docs/final_audit.md
```

with:

-   issue
-   severity
-   evidence
-   recommended fix
-   status

Fix critical and high-severity issues.

Re-run tests.

------------------------------------------------------------------------

# PHASE 19 --- Portfolio & Interview Readiness

## Master Prompt

Prepare the project for AI Builder applications.

Create:

### README

Include:

-   problem
-   solution
-   architecture
-   demo
-   tech stack
-   investigation example
-   evaluation
-   security
-   setup

### Architecture Diagram

Show:

``` text
User
→ React
→ FastAPI
→ Harness
→ Tools
→ ML
→ Pattern
→ Graph
→ RAG
→ LLM
→ Evidence
→ Human
```

### Demo Scenario

Create one compelling fraud case.

The demo should show:

1.  alert
2.  AI investigation
3.  dynamic tool selection
4.  evidence collection
5.  graph relationships
6.  policy retrieval
7.  contradiction check
8.  final report
9.  human decision

### Interview Document

Create:

``` text
docs/interview_guide.md
```

Answer:

-   Why an agent?
-   Why a custom harness?
-   Why RAG?
-   Why graph analysis?
-   Why ML + LLM?
-   Why human-in-the-loop?
-   How do you prevent hallucination?
-   How do you evaluate the agent?
-   How do you secure tools?
-   What happens when the LLM fails?
-   How would you scale it?
-   What would you improve next?

### Open-Source Inventory

Create `docs/open_source_inventory.md` containing:

- dependency name
- purpose
- version
- license
- whether it runs locally
- whether it requires an external API

Reject dependencies that introduce an unnecessary proprietary/paid requirement.

### Final Deliverables

-   working application
-   GitHub-ready repository
-   PRD
-   technical architecture
-   evaluation report
-   threat model
-   deployment guide
-   demo script
-   interview guide
-   screenshots
-   architecture diagrams

## Final Principle

The final project should communicate:

> **I don't just know how to call an LLM. I know how to build, control,
> evaluate, secure, and deploy an AI system around a real business
> problem.**
