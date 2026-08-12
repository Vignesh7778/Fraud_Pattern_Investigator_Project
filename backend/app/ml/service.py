import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
import shap

from app.core.config import settings
from app.core.logging import logger
from app.ml.features import FEATURE_NAMES


class FraudMLService:
    def __init__(self, artifacts_dir: str = "ml/artifacts"):
        self.artifacts_dir = artifacts_dir
        self.model = None
        self.schema = None
        self.metrics = None
        self.metadata = None
        self.explainer = None
        self._load_artifacts()

    def _load_artifacts(self):
        model_path = os.path.join(self.artifacts_dir, "model.joblib")
        metrics_path = os.path.join(self.artifacts_dir, "metrics.json")
        schema_path = os.path.join(self.artifacts_dir, "feature_schema.json")
        metadata_path = os.path.join(self.artifacts_dir, "training_metadata.json")

        if os.path.exists(model_path):
            try:
                self.model = joblib.load(model_path)
                self.explainer = shap.TreeExplainer(self.model)
                logger.info("loaded_xgb_fraud_model", path=model_path)
            except Exception as e:
                logger.error("failed_loading_xgb_model", error=str(e))

        if os.path.exists(metrics_path):
            with open(metrics_path, "r") as f:
                self.metrics = json.load(f)

        if os.path.exists(schema_path):
            with open(schema_path, "r") as f:
                self.schema = json.load(f)

        if os.path.exists(metadata_path):
            with open(metadata_path, "r") as f:
                self.metadata = json.load(f)

    def predict_risk(self, feature_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run inference on feature dictionary and compute SHAP explanations.
        """
        threshold = self.schema.get("default_threshold", 0.50) if self.schema else 0.50
        model_version = self.metadata.get("model_version", "fraud-xgb-v1.0") if self.metadata else "fraud-xgb-v1.0"

        # Construct feature DataFrame
        row = {f: feature_dict.get(f, 0.0) for f in FEATURE_NAMES}
        df_feat = pd.DataFrame([row])

        if self.model is None:
            # Rule-based fallback if model is un-trained
            score = self._fallback_risk_calculation(feature_dict)
            feature_contribs = self._fallback_contributions(feature_dict)
        else:
            probs = self.model.predict_proba(df_feat)[0]
            score = float(probs[1])

            # Calculate SHAP feature contributions
            try:
                shap_vals = self.explainer.shap_values(df_feat)[0]
                feature_contribs = []
                for idx, feat in enumerate(FEATURE_NAMES):
                    val = float(df_feat[feat].iloc[0])
                    s_val = float(shap_vals[idx])
                    feature_contribs.append({
                        "feature": feat,
                        "value": val,
                        "shap_impact": round(s_val, 4),
                        "direction": "increases_risk" if s_val > 0 else "decreases_risk"
                    })
                # Sort by absolute SHAP impact descending
                feature_contribs.sort(key=lambda x: abs(x["shap_impact"]), reverse=True)
            except Exception as e:
                logger.error("shap_explanation_failed", error=str(e))
                feature_contribs = self._fallback_contributions(feature_dict)

        # Categorize Risk Level
        if score >= 0.85:
            risk_level = "CRITICAL"
        elif score >= 0.70:
            risk_level = "HIGH"
        elif score >= 0.40:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        return {
            "risk_score": round(score, 4),
            "threshold": threshold,
            "risk_level": risk_level,
            "is_above_threshold": score >= threshold,
            "model_version": model_version,
            "feature_contributions": feature_contribs[:5],  # Top 5 contributing factors
            "model_metrics": self.metrics.get("metrics", {}) if self.metrics else {}
        }

    def _fallback_risk_calculation(self, feat: Dict[str, Any]) -> float:
        score = 0.1
        if feat.get("amount", 0) > 1000:
            score += 0.25
        if feat.get("device_account_count", 0) > 3:
            score += 0.35
        if feat.get("ip_account_count", 0) > 5:
            score += 0.25
        if feat.get("txns_last_1h", 0) > 5:
            score += 0.20
        return min(0.99, score)

    def _fallback_contributions(self, feat: Dict[str, Any]) -> List[Dict[str, Any]]:
        return [
            {"feature": "amount", "value": feat.get("amount", 0.0), "shap_impact": 0.25, "direction": "increases_risk"},
            {"feature": "device_account_count", "value": feat.get("device_account_count", 1), "shap_impact": 0.20, "direction": "increases_risk"}
        ]


# Singleton Service Instance
ml_service = FraudMLService()
