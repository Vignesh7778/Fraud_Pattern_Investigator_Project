from typing import Dict, Any, List
from pydantic import BaseModel, Field
from app.tools.base import BaseTool
from app.ml.service import ml_service


class RunFraudModelInput(BaseModel):
    transaction_id: str
    feature_data: Dict[str, Any] = Field(description="Extracted feature map for transaction")


class RunFraudModelOutput(BaseModel):
    risk_score: float
    threshold: float
    risk_level: str
    is_above_threshold: bool
    model_version: str
    feature_contributions: List[Dict[str, Any]] = Field(default_factory=list)


class RunFraudModelTool(BaseTool):
    name = "run_fraud_model"
    description = "Invoke XGBoost ML model to calculate probabilistic transaction risk score and SHAP feature contributions"
    input_schema = RunFraudModelInput
    output_schema = RunFraudModelOutput
    required_permission = "analyst"

    async def _execute(self, input_data: RunFraudModelInput) -> Dict[str, Any]:
        res = ml_service.predict_risk(input_data.feature_data)
        return res
