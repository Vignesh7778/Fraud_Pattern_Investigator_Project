# FRAUD PATTERN INVESTIGATOR — DEPLOYMENT & CONTAINERIZATION GUIDE

## 1. System Overview

Fraud Pattern Investigator (FPI) is containerized using Docker and Docker Compose.

### Architecture Services:
- **`fpi-postgres`**: PostgreSQL 16 database with `pgvector` vector similarity search extension.
- **`fpi-backend`**: FastAPI Python 3.12 application exposing REST API endpoints, ML inference service, Pattern Engine, NetworkX Graph Engine, RAG engine, and custom 15-state Investigation Harness.
- **`fpi-frontend`**: React TypeScript Vite application with Tailwind CSS dark enterprise theme.

---

## 2. Quick Start Deployment Commands

### Step 1: Clone Repository & Configure Environment
```bash
cp .env.example .env
```

### Step 2: Launch Complete System via Docker Compose
```bash
docker-compose up -d --build
```

### Step 3: Seed Synthetic Data & ML Model Artifacts
```bash
docker-compose exec backend python scripts/seed_db.py
docker-compose exec backend python ml/training/train_model.py
```

### Step 4: Access Applications
- **Analyst UI**: `http://localhost:5173`
- **FastAPI OpenAPI Documentation**: `http://localhost:8000/docs`
- **System Health Check**: `http://localhost:8000/health`

---

## 3. Production Environment Variables

| Variable | Description | Default Value |
|---|---|---|
| `ENVIRONMENT` | Deployment stage | `production` |
| `DATABASE_URL` | Async PostgreSQL connection string | `postgresql+asyncpg://postgres:...@db:5432/fraud_investigator` |
| `SECRET_KEY` | JWT signing secret key | *(Required in production)* |
| `OLLAMA_BASE_URL` | Local LLM Ollama host endpoint | `http://localhost:11434` |
| `OPENROUTER_API_KEY` | OpenRouter API Key (Optional fallback) | `""` |

---

## 4. Verification & Testing

Run the complete backend test suite inside container:
```bash
docker-compose exec backend pytest backend
```
