from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np


FEATURE_NAMES = [
    "amount",
    "account_age_days",
    "txns_last_1h",
    "txns_last_24h",
    "avg_amount_history",
    "amount_deviation_ratio",
    "device_account_count",
    "ip_account_count",
    "hour_of_day",
    "merchant_risk_score"
]

MERCHANT_RISK_MAP = {
    "retail": 0.1,
    "groceries": 0.05,
    "travel": 0.4,
    "electronics": 0.5,
    "luxury": 0.7,
    "crypto_exchange": 0.9,
    "peer_transfer": 0.6
}


def extract_features_from_dataset(raw_data: Dict[str, List[Dict[str, Any]]]) -> Tuple[pd.DataFrame, pd.Series]:

    """
    Extract ML features from synthetic raw data using temporal ordering to prevent data leakage.
    Returns (X_df, y_series, txns_df)
    """
    txns = sorted(raw_data["transactions"], key=lambda x: x["timestamp"])
    accounts_map = {a["id"]: a for a in raw_data["accounts"]}
    merchants_map = {m["id"]: m for m in raw_data["merchants"]}

    # Pre-aggregate device/IP counts
    dev_counts: Dict[str, set] = {}
    for link in raw_data["device_account_links"]:
        dev_counts.setdefault(link["device_id"], set()).add(link["account_id"])

    ip_counts: Dict[str, set] = {}
    for link in raw_data["ip_account_links"]:
        ip_counts.setdefault(link["ip_id"], set()).add(link["account_id"])

    # Account transaction history state for sequential feature computation
    account_history: Dict[str, List[Dict[str, Any]]] = {}

    rows = []
    y_list = []

    for txn in txns:
        acc_id = txn["account_id"]
        acc = accounts_map.get(acc_id, {})
        merchant = merchants_map.get(txn["merchant_id"], {})

        txn_dt = datetime.fromisoformat(txn["timestamp"])
        acc_created_dt = datetime.fromisoformat(acc.get("created_at", txn["timestamp"]))
        account_age_days = max(0.1, (txn_dt - acc_created_dt).total_seconds() / 86400.0)

        # Look back at historical transactions for this account BEFORE current timestamp
        past_txns = account_history.get(acc_id, [])
        txns_1h = sum(1 for t in past_txns if (txn_dt - t["dt"]).total_seconds() <= 3600)
        txns_24h = sum(1 for t in past_txns if (txn_dt - t["dt"]).total_seconds() <= 86400)

        amounts = [t["amount"] for t in past_txns]
        avg_amount = float(np.mean(amounts)) if amounts else float(txn["amount"])
        deviation_ratio = float(txn["amount"]) / max(1.0, avg_amount)

        dev_acc_count = len(dev_counts.get(txn["device_id"], set()))
        ip_acc_count = len(ip_counts.get(txn["ip_id"], set()))

        hour_of_day = txn_dt.hour
        merch_risk = MERCHANT_RISK_MAP.get(merchant.get("category", ""), 0.3)

        row = {
            "transaction_id": txn["id"],
            "timestamp": txn["timestamp"],
            "amount": float(txn["amount"]),
            "account_age_days": round(account_age_days, 2),
            "txns_last_1h": txns_1h,
            "txns_last_24h": txns_24h,
            "avg_amount_history": round(avg_amount, 2),
            "amount_deviation_ratio": round(deviation_ratio, 2),
            "device_account_count": dev_acc_count,
            "ip_account_count": ip_acc_count,
            "hour_of_day": hour_of_day,
            "merchant_risk_score": merch_risk,
        }

        rows.append(row)
        y_list.append(1 if txn["is_fraud"] else 0)

        # Append current transaction to history state AFTER feature calculation
        account_history.setdefault(acc_id, []).append({"dt": txn_dt, "amount": txn["amount"]})

    df = pd.DataFrame(rows)
    y = pd.Series(y_list, name="is_fraud")

    return df, y

