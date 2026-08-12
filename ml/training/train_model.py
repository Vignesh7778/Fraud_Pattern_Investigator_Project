import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, precision_recall_curve, auc, confusion_matrix
import xgboost as xgb
import shap

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))
from app.ml.features import extract_features_from_dataset, FEATURE_NAMES, MERCHANT_RISK_MAP


def train_and_evaluate():
    print("=== Fraud ML Training Pipeline ===")

    dataset_path = "data/synthetic/synthetic_dataset.json"
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset file {dataset_path} not found. Run generator first.")

    with open(dataset_path, "r") as f:
        raw_data = json.load(f)

    print("1. Extracting features from dataset with temporal ordering...")
    df, y = extract_features_from_dataset(raw_data)

    X = df[FEATURE_NAMES]

    # 2. Temporal Splitting (70% train, 15% val, 15% test)
    n = len(df)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)

    X_train, y_train = X.iloc[:train_end], y.iloc[:train_end]
    X_val, y_val = X.iloc[train_end:val_end], y.iloc[train_end:val_end]
    X_test, y_test = X.iloc[val_end:], y.iloc[val_end:]

    print(f"Dataset split: Train={len(X_train)}, Val={len(X_val)}, Test={len(X_test)}")
    print(f"Fraud prevalence in Train: {y_train.mean():.4f}, Test: {y_test.mean():.4f}")

    # 3. Train Baseline Logistic Regression
    print("\n2. Training Logistic Regression baseline...")
    lr_model = LogisticRegression(max_iter=1000, random_state=42)
    lr_model.fit(X_train, y_train)
    lr_probs = lr_model.predict_proba(X_test)[:, 1]
    lr_preds = (lr_probs >= 0.5).astype(int)

    lr_precision = float(precision_score(y_test, lr_preds, zero_division=0))
    lr_recall = float(recall_score(y_test, lr_preds, zero_division=0))
    lr_f1 = float(f1_score(y_test, lr_preds, zero_division=0))
    lr_auc = float(roc_auc_score(y_test, lr_probs))
    print(f"Logistic Regression -> Precision: {lr_precision:.4f}, Recall: {lr_recall:.4f}, F1: {lr_f1:.4f}, ROC-AUC: {lr_auc:.4f}")

    # 4. Train Final XGBoost Baseline
    print("\n3. Training XGBoost final model...")
    scale_pos_weight = (len(y_train) - sum(y_train)) / max(1, sum(y_train))

    xgb_model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.05,
        scale_pos_weight=scale_pos_weight,
        random_state=42,
        eval_metric="logloss"
    )
    xgb_model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)

    xgb_probs = xgb_model.predict_proba(X_test)[:, 1]
    best_threshold = 0.50
    xgb_preds = (xgb_probs >= best_threshold).astype(int)

    xgb_precision = float(precision_score(y_test, xgb_preds, zero_division=0))
    xgb_recall = float(recall_score(y_test, xgb_preds, zero_division=0))
    xgb_f1 = float(f1_score(y_test, xgb_preds, zero_division=0))
    xgb_roc_auc = float(roc_auc_score(y_test, xgb_probs))

    precision_curve, recall_curve, _ = precision_recall_curve(y_test, xgb_probs)
    xgb_pr_auc = float(auc(recall_curve, precision_curve))
    cm = confusion_matrix(y_test, xgb_preds).tolist()

    print(f"XGBoost -> Precision: {xgb_precision:.4f}, Recall: {xgb_recall:.4f}, F1: {xgb_f1:.4f}, ROC-AUC: {xgb_roc_auc:.4f}, PR-AUC: {xgb_pr_auc:.4f}")
    print(f"Confusion Matrix: TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]}")

    # 5. Compute SHAP Values
    print("\n4. Computing SHAP feature importance...")
    explainer = shap.TreeExplainer(xgb_model)
    shap_sample = X_test.iloc[:100]
    shap_values = explainer.shap_values(shap_sample)
    mean_abs_shap = dict(zip(FEATURE_NAMES, [float(x) for x in np.abs(shap_values).mean(axis=0)]))

    # 6. Save Artifacts to ml/artifacts
    os.makedirs("ml/artifacts", exist_ok=True)

    joblib.dump(xgb_model, "ml/artifacts/model.joblib")

    schema_data = {
        "feature_names": FEATURE_NAMES,
        "merchant_risk_map": MERCHANT_RISK_MAP,
        "default_threshold": best_threshold
    }
    with open("ml/artifacts/feature_schema.json", "w") as f:
        json.dump(schema_data, f, indent=2)

    metrics_data = {
        "model_name": "XGBoost Fraud Classifier",
        "version": "fraud-xgb-v1.0",
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
        "decision_threshold": best_threshold,
        "metrics": {
            "precision": round(xgb_precision, 4),
            "recall": round(xgb_recall, 4),
            "f1_score": round(xgb_f1, 4),
            "roc_auc": round(xgb_roc_auc, 4),
            "pr_auc": round(xgb_pr_auc, 4),
            "confusion_matrix": cm,
            "false_positive_rate": round(float(cm[0][1] / (cm[0][0] + cm[0][1])), 4) if (cm[0][0] + cm[0][1]) > 0 else 0.0
        },
        "baseline_logistic_regression": {
            "precision": round(lr_precision, 4),
            "recall": round(lr_recall, 4),
            "f1_score": round(lr_f1, 4),
            "roc_auc": round(lr_auc, 4)
        },
        "shap_importance": mean_abs_shap
    }
    with open("ml/artifacts/metrics.json", "w") as f:
        json.dump(metrics_data, f, indent=2)

    metadata = {
        "model_version": "fraud-xgb-v1.0",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "test_samples": len(X_test),
        "features": FEATURE_NAMES
    }
    with open("ml/artifacts/training_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print("=== Training complete! Artifacts saved in ml/artifacts/ ===")


if __name__ == "__main__":
    train_and_evaluate()
