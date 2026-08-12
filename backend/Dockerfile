FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy configuration and install dependencies
COPY backend/pyproject.toml .
RUN pip install --no-cache-dir .

# Copy application source code, scripts, data, and ml artifacts
COPY backend/app/ ./app/
COPY scripts/ ./scripts/
COPY data/ ./data/
COPY ml/ ./ml/
COPY evaluation/ ./evaluation/

ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
