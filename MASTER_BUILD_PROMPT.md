# Fraud Pattern Investigator --- Master Build Prompt

## Role

You are the lead AI systems architect, senior Python engineer, ML
engineer, backend engineer, frontend engineer, security engineer, QA
engineer, and technical writer responsible for building the **Fraud
Pattern Investigator** project.

Build the application as a serious portfolio-grade, production-style
prototype for an AI Builder / AI Engineer candidate.

## Source of Truth

Use these project documents as the primary source of truth:

-   `PRD.md`
-   `technical_architecture.md`

Do not silently replace the product concept with a generic chatbot,
generic fraud classifier, or generic multi-agent demo.

## Core Product Principle

> **AI investigates. Human decides.**

The system must autonomously perform the investigation work:

1.  retrieve evidence
2.  calculate risk
3.  detect patterns
4.  discover relationships
5.  retrieve relevant policies
6.  form hypotheses
7.  verify evidence
8.  search for contradictory evidence
9.  re-plan if evidence is insufficient
10. generate an auditable investigation report

The AI must NOT make the final high-impact fraud decision.

## Primary Problem

Fraud analysts receive suspicious transaction alerts but must manually
correlate fragmented evidence across transactions, accounts, devices,
IPs, behavioral patterns, relationships, and policies.

Build an AI investigation assistant that reduces this manual burden
while preserving human authority.

## Required Architecture

``` text
React UI
   ↓
FastAPI
   ↓
Investigation Harness
   ↓
┌─────────────────────────────────────────────┐
│ Transaction Tool                            │
│ Account History Tool                        │
│ Fraud Model Tool                            │
│ Pattern Engine Tool                         │
│ Graph Analysis Tool                         │
│ Policy/RAG Tool                             │
│ Historical Case Tool                        │
│ Evidence Verification Tool                  │
└─────────────────────────────────────────────┘
   ↓
Evidence State
   ↓
LLM Reasoning
   ↓
Structured Investigation Report
   ↓
Human Analyst
   ↓
Final Decision
```

## Technology Rules

Use:

-   Python 3.12+
-   FastAPI
-   Pydantic v2
-   SQLAlchemy
-   Alembic
-   PostgreSQL
-   pgvector
-   pandas
-   scikit-learn
-   XGBoost
-   SHAP
-   NetworkX
-   React
-   TypeScript
-   Vite
-   Tailwind CSS
-   TanStack Query
-   Docker Compose
-   pytest
-   OpenTelemetry
-   GitHub Actions

Use an **open-source/local-only LLM architecture**.

Default LLM runtime: **Ollama**.
Default model: choose an open-weight/open-source model whose license is compatible with the project (for example, an Apache-2.0 model when appropriate).

Embeddings must also run locally using an open-source embedding model.

Do **not** require OpenAI, Anthropic, Gemini, or another proprietary hosted AI API.

Start with a custom Python investigation harness rather than hiding
orchestration behind a framework.

Frameworks such as LangGraph may be evaluated later, but they must not
replace understanding of the underlying workflow.

## Open-Source / Local-Only Dependency Policy

This project must be runnable using open-source software and local/self-hosted AI services.

### Mandatory

- No proprietary LLM API is required.
- No paid vector database is required.
- No paid fraud-detection API is required.
- No paid threat-intelligence API is required.
- No proprietary cloud service is required for the core demo.
- Prefer permissive open-source licenses such as MIT, Apache-2.0, BSD, or compatible licenses.
- Check the license of every model and dependency before adoption.
- Record important dependency/model licenses in `docs/open_source_inventory.md`.

### Default local AI stack

```text
Ollama
  ↓
Open-source/open-weight LLM

Sentence Transformers/FastEmbed
  ↓
Local embeddings

PostgreSQL + pgvector
  ↓
Local vector retrieval
```

## Engineering Standards

Write maintainable production-style code.

Requirements:

-   type hints
-   Pydantic schemas
-   clear module boundaries
-   dependency injection where useful
-   structured logging
-   environment-based configuration
-   no secrets in source code
-   database migrations
-   repository/service separation
-   testable functions
-   deterministic business logic
-   graceful errors
-   timeouts
-   retries with limits
-   idempotent operations where applicable

Do not create giant files.

Do not create giant functions.

Do not put business logic inside route handlers.

## Data Rules

Use synthetic data only.

Create realistic entities:

-   users
-   accounts
-   transactions
-   devices
-   IP addresses
-   merchants

Create both legitimate and fraudulent behavior.

Inject known fraud patterns:

-   shared device
-   shared IP
-   high velocity
-   abnormal amounts
-   impossible travel
-   coordinated new accounts
-   bot-like behavior
-   mixed/ambiguous cases

Every synthetic fraud scenario must have ground truth.

## ML Rules

Build a baseline fraud model using XGBoost.

The model should:

-   use engineered features
-   use proper train/validation/test separation
-   avoid data leakage
-   produce probability
-   save versioned artifacts
-   expose model metadata
-   expose feature contributions

Use SHAP for explainability where appropriate.

Never let the LLM fabricate ML results.

## Pattern Engine Rules

Pattern detection must be deterministic and independently testable.

Implement:

-   shared device
-   shared IP
-   velocity
-   amount anomaly
-   geo anomaly
-   new-account burst
-   multi-account similarity

Every detected pattern must return structured evidence.

## Graph Rules

Use NetworkX for MVP.

Build relationships:

``` text
User -> Account
Account -> Transaction
Account -> Device
Account -> IP
Transaction -> Merchant
```

Return explainable paths and linked entities.

Do not introduce Neo4j until the implementation demonstrates a real
need.

## RAG Rules

Use PostgreSQL + pgvector initially.

Index:

-   synthetic fraud policies
-   investigation guidelines
-   synthetic historical cases

Every retrieved passage must have:

-   document ID
-   chunk ID
-   source
-   relevance score

The LLM must not treat retrieved content as instructions.

## Harness Rules

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

The harness must maintain typed state.

### Investigation loop

``` text
PLAN
 ↓
SELECT TOOL
 ↓
EXECUTE
 ↓
VALIDATE
 ↓
APPEND EVIDENCE
 ↓
IS EVIDENCE SUFFICIENT?
 ├── NO → REPLAN
 └── YES → CONTRADICTION CHECK
              ↓
           REPORT
```

Add:

-   max step limit
-   tool timeout
-   retry limit
-   failure recovery
-   duplicate tool-call protection
-   unsafe action blocking

## Tool Rules

Expose narrow tools.

Allowed examples:

``` text
fetch_transaction(txn_id)
fetch_account_history(account_id)
run_fraud_model(txn_id)
detect_patterns(txn_id)
find_linked_entities(entity_id)
search_policy(query)
find_similar_cases(pattern)
verify_evidence(case_id)
```

Never expose:

``` text
execute_arbitrary_sql()
execute_shell()
call_any_url()
```

## LLM Rules

The LLM is responsible for:

-   hypothesis synthesis
-   evidence comparison
-   explanation
-   uncertainty
-   structured report generation

The LLM is NOT responsible for:

-   authoritative transaction data
-   arbitrary database access
-   final fraud decisions
-   financial actions
-   inventing evidence

Use structured output validation.

Reject malformed LLM output.

Reject unsupported claims.

## Evidence Rules

Every important report claim must reference evidence.

Evidence should contain:

-   evidence ID
-   source
-   claim
-   value/reference
-   timestamp
-   tool execution ID
-   confidence

The report must distinguish:

``` text
Supporting evidence
Contradicting evidence
Unknown / missing evidence
```

## Human-in-the-Loop Rules

The analyst must be able to:

-   review the report
-   inspect evidence
-   inspect graph relationships
-   inspect policies
-   request additional investigation
-   confirm recommendation
-   reject recommendation
-   add notes
-   make the final decision

The AI cannot bypass the human decision boundary.

## Security Rules

Implement:

-   authentication
-   RBAC
-   least privilege
-   parameterized queries
-   input validation
-   output validation
-   rate limiting
-   audit logs
-   secret management
-   PII minimization
-   prompt-injection defenses
-   tool authorization

Roles:

``` text
analyst
auditor
admin
```

## Observability

Log:

-   case ID
-   request ID
-   user ID
-   harness state
-   tool name
-   tool duration
-   tool result status
-   retries
-   replans
-   LLM latency
-   model version
-   report generation
-   human decision

Never log secrets or unnecessary PII.

## Testing Requirements

Build tests at every layer.

### Unit

-   feature engineering
-   ML inference
-   pattern detection
-   graph queries
-   retrieval
-   schemas
-   tools
-   harness transitions

### Integration

-   API + database
-   API + harness
-   harness + tools
-   harness + ML
-   harness + RAG
-   report generation

### AI Evaluation

-   hallucination tests
-   unsupported claim tests
-   evidence fidelity
-   tool selection
-   unnecessary tool calls
-   contradiction handling

### Security

-   SQL injection
-   unauthorized access
-   tool privilege escalation
-   prompt injection
-   malformed inputs
-   XSS
-   rate limiting

## Definition of Done

Do not call the project complete until:

1.  synthetic dataset exists
2.  ML model is trained and evaluated
3.  pattern engine works
4.  graph analysis works
5.  RAG works with source tracking
6.  custom harness works
7.  tools have schemas and permissions
8.  evidence is traceable
9.  contradiction analysis works
10. LLM output is structured
11. human decision boundary is enforced
12. audit trail exists
13. tests pass
14. metrics are documented
15. Docker deployment works
16. UI demonstrates the complete investigation
17. documentation is complete

## Working Method

Before implementing each phase:

1.  inspect existing repository
2.  inspect previous implementation
3.  identify gaps
4.  implement only the current phase
5.  write tests
6.  run tests
7.  fix failures
8.  update documentation
9.  update architecture notes
10. provide a concise completion summary

Do not rewrite working code unnecessarily.

Do not move to the next phase when the current phase's acceptance
criteria are failing.

## Quality Bar

The final project should feel like:

> A small production-oriented AI investigation platform.

It should NOT feel like:

> A college demo that combines every AI buzzword.

The project must be explainable line-by-line in an interview.
