# Open-Source Dependency & Model Inventory

This document tracks all third-party open-source libraries, frameworks, models, and tools used in **Fraud Pattern Investigator (FPI)** along with their versions, licenses, and deployment constraints.

## License Policy
- **Primary Licenses**: MIT, Apache-2.0, BSD-3-Clause, PostgreSQL License.
- **Model Policy**: Open-weight / permissive models only.
- **No Paid SaaS / APIs**: Complete system can run locally or via open-access interfaces (OpenRouter / Ollama / local embeddings).

---

## Open-Source Stack Inventory

| Component / Library | Version | Purpose | License | Host Location | External API Required? |
|---|---|---|---|---|---|
| **Python** | 3.12+ | Backend runtime | Python Software Foundation License | Local / Container | No |
| **FastAPI** | ^0.111.0 | Web API framework | MIT | Local / Container | No |
| **Pydantic** | ^2.7.0 | Data validation & schemas | MIT | Local / Container | No |
| **SQLAlchemy** | ^2.0.0 | Relational ORM | MIT | Local / Container | No |
| **Alembic** | ^1.13.0 | Database migrations | MIT | Local / Container | No |
| **PostgreSQL / pgvector** | 16 / ^0.7.0 | Relational DB + Vector store | PostgreSQL License / MIT | Local Docker / Supabase | No |
| **scikit-learn** | ^1.4.0 | ML algorithms & metrics | BSD-3-Clause | Local / Container | No |
| **XGBoost** | ^2.0.0 | Gradient boosted decision trees | Apache-2.0 | Local / Container | No |
| **SHAP** | ^0.45.0 | Model explainability | MIT | Local / Container | No |
| **NetworkX** | ^3.2.0 | Graph analysis engine | BSD-3-Clause | Local / Container | No |
| **structlog** | ^24.1.0 | Structured JSON logging | MIT / Apache-2.0 | Local / Container | No |
| **pytest / pytest-asyncio** | ^8.0.0 | Testing suite | MIT | Local CLI / CI | No |
| **React** | ^18.3.0 | Frontend UI library | MIT | Browser | No |
| **TypeScript** | ^5.4.0 | Typed JS programming | Apache-2.0 | Browser Build | No |
| **Vite** | ^5.2.0 | Frontend build tool & dev server | MIT | Local CLI / Container | No |
| **Tailwind CSS** | ^3.4.0 | Utility-first CSS styling | MIT | Browser Build | No |
| **TanStack Query** | ^5.28.0 | Data fetching & client cache | MIT | Browser | No |
| **Lucide React** | ^0.368.0 | UI icons | MIT | Browser | No |
| **Ollama / OpenRouter** | Latest | Local LLM runtime / Open LLM gateway | MIT / Open API | Local / Open Gateway | No (Open models used) |
