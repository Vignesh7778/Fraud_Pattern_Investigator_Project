from datetime import datetime
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(default="ok", json_schema_extra={"example": "ok"})
    environment: str = Field(json_schema_extra={"example": "development"})
    version: str = Field(json_schema_extra={"example": "0.1.0"})
    timestamp: datetime
    database_status: str = Field(default="unknown", json_schema_extra={"example": "connected"})
    services: dict = Field(default_factory=dict)

