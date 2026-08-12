# Open-Source & Local-Only Policy

## Goal

Fraud Pattern Investigator must be buildable and demonstrable without depending on proprietary AI APIs or paid SaaS services.

## Default stack

| Capability | Required implementation |
|---|---|
| LLM | Ollama + compatible open-source/open-weight model |
| Embeddings | Sentence Transformers/FastEmbed + compatible open model |
| Vector DB | PostgreSQL + pgvector |
| Relational DB | PostgreSQL |
| Graph MVP | NetworkX |
| Backend | FastAPI |
| Frontend | React + TypeScript + Vite |
| ML | scikit-learn + XGBoost |
| Explainability | SHAP |
| Observability | OpenTelemetry + Prometheus/Grafana |
| Containers | Docker + Docker Compose |
| CI | GitHub Actions |

## No required proprietary APIs

The core project must not require:

- OpenAI API
- Anthropic API
- Gemini API
- Pinecone hosted service
- Weaviate Cloud
- proprietary fraud APIs
- proprietary threat-intelligence APIs
- paid agent platforms

## Model-license rule

The runtime is open-source, but **model licenses vary by model**. Before selecting a model, verify its license and record it in the project's open-source inventory.

Prefer permissive licenses compatible with the intended portfolio/demo use.

## External API rule

If an external API is considered later:

1. identify an open-source/self-hosted alternative first
2. document why the local alternative is insufficient
3. obtain explicit project-owner approval
4. keep the external integration optional
5. never make the core demo depend on it
