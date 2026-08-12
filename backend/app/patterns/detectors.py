import numpy as np
from math import radians, cos, sin, asin, sqrt
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field



class PatternMatch(BaseModel):
    pattern_id: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    confidence: float
    description: str
    evidence: List[Dict[str, Any]] = Field(default_factory=list)


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Great Circle distance in km between two lat/lon points."""
    r = 6371.0  # Earth radius in km
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)**2
    c = 2 * asin(sqrt(a))
    return r * c


def detect_shared_device(
    device_id: str,
    linked_accounts: List[str],
    threshold: int = 3
) -> Optional[PatternMatch]:
    unique_accounts = list(set(linked_accounts))
    acc_count = len(unique_accounts)

    if acc_count >= threshold:
        severity = "CRITICAL" if acc_count >= 6 else "HIGH"
        confidence = min(0.99, 0.70 + (acc_count - threshold) * 0.08)
        return PatternMatch(
            pattern_id="shared_device",
            severity=severity,
            confidence=round(confidence, 2),
            description=f"Device '{device_id}' is shared across {acc_count} distinct user accounts.",
            evidence=[{
                "type": "device_reuse",
                "device_id": device_id,
                "account_count": acc_count,
                "accounts": unique_accounts[:10]
            }]
        )
    return None


def detect_shared_ip(
    ip_address: str,
    linked_accounts: List[str],
    threshold: int = 5
) -> Optional[PatternMatch]:
    unique_accounts = list(set(linked_accounts))
    acc_count = len(unique_accounts)

    if acc_count >= threshold:
        severity = "CRITICAL" if acc_count >= 10 else "HIGH"
        confidence = min(0.98, 0.65 + (acc_count - threshold) * 0.05)
        return PatternMatch(
            pattern_id="shared_ip",
            severity=severity,
            confidence=round(confidence, 2),
            description=f"IP address '{ip_address}' is associated with {acc_count} distinct user accounts.",
            evidence=[{
                "type": "ip_reuse",
                "ip_address": ip_address,
                "account_count": acc_count,
                "accounts": unique_accounts[:10]
            }]
        )
    return None


def detect_velocity(
    account_id: str,
    recent_transactions: List[Dict[str, Any]],
    time_window_minutes: int = 5,
    threshold_count: int = 5
) -> Optional[PatternMatch]:
    if len(recent_transactions) >= threshold_count:
        count = len(recent_transactions)
        total_amount = sum(float(t.get("amount", 0.0)) for t in recent_transactions)
        severity = "CRITICAL" if count >= 10 or total_amount >= 3000 else "HIGH"
        return PatternMatch(
            pattern_id="velocity",
            severity=severity,
            confidence=0.95,
            description=f"Account '{account_id}' executed {count} transactions totaling ${total_amount:,.2f} within {time_window_minutes} minutes.",
            evidence=[{
                "type": "transaction_burst",
                "account_id": account_id,
                "transaction_count": count,
                "window_minutes": time_window_minutes,
                "total_amount": round(total_amount, 2)
            }]
        )
    return None


def detect_amount_anomaly(
    current_amount: float,
    historical_avg_amount: float,
    multiplier_threshold: float = 8.0
) -> Optional[PatternMatch]:
    if historical_avg_amount > 0:
        ratio = current_amount / historical_avg_amount
        if ratio >= multiplier_threshold and current_amount >= 1000.0:
            severity = "CRITICAL" if ratio >= 15.0 else "HIGH"
            confidence = min(0.95, 0.70 + (ratio / 50.0))
            return PatternMatch(
                pattern_id="amount_anomaly",
                severity=severity,
                confidence=round(confidence, 2),
                description=f"Transaction amount of ${current_amount:,.2f} is {ratio:.1f}x higher than historical average (${historical_avg_amount:,.2f}).",
                evidence=[{
                    "type": "amount_spike",
                    "current_amount": current_amount,
                    "historical_avg": historical_avg_amount,
                    "multiplier_ratio": round(ratio, 2)
                }]
            )
    return None


def detect_geographic_anomaly(
    current_txn: Dict[str, Any],
    previous_txn: Optional[Dict[str, Any]],
    speed_threshold_kmh: float = 800.0
) -> Optional[PatternMatch]:
    if not previous_txn:
        return None

    lat1, lon1 = current_txn.get("location_lat"), current_txn.get("location_lon")
    lat2, lon2 = previous_txn.get("location_lat"), previous_txn.get("location_lon")

    if None in (lat1, lon1, lat2, lon2):
        return None

    dist_km = haversine_distance_km(lat1, lon1, lat2, lon2)

    dt1 = datetime.fromisoformat(current_txn["timestamp"])
    dt2 = datetime.fromisoformat(previous_txn["timestamp"])

    time_diff_hours = abs((dt1 - dt2).total_seconds()) / 3600.0
    if time_diff_hours <= 0.001:
        time_diff_hours = 0.001

    speed_kmh = dist_km / time_diff_hours

    if speed_kmh >= speed_threshold_kmh and dist_km >= 200.0:
        return PatternMatch(
            pattern_id="geographic_anomaly",
            severity="CRITICAL",
            confidence=0.96,
            description=f"Impossible travel detected: {dist_km:.0f} km transition in {time_diff_hours*60:.0f} minutes ({speed_kmh:.0f} km/h).",
            evidence=[{
                "type": "impossible_travel",
                "distance_km": round(dist_km, 1),
                "elapsed_minutes": round(time_diff_hours * 60, 1),
                "required_speed_kmh": round(speed_kmh, 1),
                "from_country": previous_txn.get("country", "Unknown"),
                "to_country": current_txn.get("country", "Unknown")
            }]
        )
    return None


def detect_new_account_burst(
    account_created_at_iso: str,
    txn_timestamp_iso: str,
    amount: float
) -> Optional[PatternMatch]:
    created_dt = datetime.fromisoformat(account_created_at_iso)
    txn_dt = datetime.fromisoformat(txn_timestamp_iso)

    age_hours = (txn_dt - created_dt).total_seconds() / 3600.0
    if age_hours <= 24.0 and amount >= 1500.0:
        return PatternMatch(
            pattern_id="new_account_burst",
            severity="HIGH",
            confidence=0.88,
            description=f"Newly created account ({age_hours:.1f} hours old) executed high-value transaction of ${amount:,.2f}.",
            evidence=[{
                "type": "new_account_high_risk",
                "account_age_hours": round(age_hours, 1),
                "amount": amount
            }]
        )
    return None


def detect_bot_like_behavior(
    recent_timestamps: List[str]
) -> Optional[PatternMatch]:
    if len(recent_timestamps) < 4:
        return None

    dts = sorted([datetime.fromisoformat(t) for t in recent_timestamps])
    deltas = [(dts[i+1] - dts[i]).total_seconds() for i in range(len(dts)-1)]

    # Check if delta standard deviation is near zero (robotic interval)
    if np.std(deltas) <= 2.0 and np.mean(deltas) <= 60.0:
        return PatternMatch(
            pattern_id="bot_like_behavior",
            severity="HIGH",
            confidence=0.92,
            description=f"Automated robotic transaction cadence detected ({len(recent_timestamps)} operations at fixed ~{np.mean(deltas):.1f}s intervals).",
            evidence=[{
                "type": "cadence_regularity",
                "mean_interval_seconds": round(float(np.mean(deltas)), 2),
                "std_interval_seconds": round(float(np.std(deltas)), 2)
            }]
        )
    return None
