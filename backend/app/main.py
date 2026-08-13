from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.api.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info("starting_fraud_pattern_investigator_api", environment=settings.ENVIRONMENT, version=settings.VERSION)
    yield
    logger.info("stopping_fraud_pattern_investigator_api")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Autonomous Fraud Investigation Assistant — AI Investigates. Human Decides.",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from app.api import health
from app.api import investigations
from app.api import auth
from app.api import audit
from app.api import graph

app.include_router(health.router)
app.include_router(investigations.router)
app.include_router(auth.router)
app.include_router(audit.router)
app.include_router(graph.router)
app.include_router(health.router, prefix="/api/v1", tags=["Health V1"])




@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response



@app.get("/")
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "documentation": "/docs"
    }
