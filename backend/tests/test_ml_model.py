import os
import json
import pytest
from app.ml.features import extract_features_from_dataset, FEATURE_NAMES
from app.ml.service import ml_service
from data.synthetic.generator import SyntheticDataGenerator


def test_feature_extraction():
    generator = SyntheticDataGenerator(num_users=10, target_transactions=50)
    data = generator.generate_all()
    df, y = extract_features_from_dataset(data)

    assert len(df) > 0
    assert len(y) == len(df)
    for feat in FEATURE_NAMES:
        assert feat in df.columns
        assert not df[feat].isnull().any()


def test_ml_artifacts_exist():
    assert os.path.exists("ml/artifacts/model.joblib")
    assert os.path.exists("ml/artifacts/metrics.json")
    assert os.path.exists("ml/artifacts/feature_schema.json")

    with open("ml/artifacts/metrics.json", "r") as f:
        metrics = json.load(f)
        assert "metrics" in metrics
        assert metrics["metrics"]["precision"] >= 0.85
        assert metrics["metrics"]["recall"] >= 0.85
        assert metrics["metrics"]["f1_score"] >= 0.85


def test_ml_inference_service():
    sample_features = {
        "amount": 12500.00,
        "account_age_days": 1.5,
        "txns_last_1h": 8,
        "txns_last_24h": 15,
        "avg_amount_history": 45.0,
        "amount_deviation_ratio": 277.7,
        "device_account_count": 6,
        "ip_account_count": 12,
        "hour_of_day": 3,
        "merchant_risk_score": 0.9
    }

    result = ml_service.predict_risk(sample_features)

    assert "risk_score" in result
    assert 0.0 <= result["risk_score"] <= 1.0
    assert result["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert "threshold" in result
    assert "feature_contributions" in result
    assert len(result["feature_contributions"]) > 0
    assert result["risk_level"] in ["HIGH", "CRITICAL"]
