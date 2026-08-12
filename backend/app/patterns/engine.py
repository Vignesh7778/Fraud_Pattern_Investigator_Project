from typing import List, Dict, Any, Optional
from app.patterns.detectors import (
    PatternMatch,
    detect_shared_device,
    detect_shared_ip,
    detect_velocity,
    detect_amount_anomaly,
    detect_geographic_anomaly,
    detect_new_account_burst,
    detect_bot_like_behavior
)


class PatternEngine:
    def analyze_transaction(
        self,
        transaction: Dict[str, Any],
        device_linked_accounts: Optional[List[str]] = None,
        ip_linked_accounts: Optional[List[str]] = None,
        account_recent_txns: Optional[List[Dict[str, Any]]] = None,
        historical_avg_amount: Optional[float] = None,
        previous_txn: Optional[Dict[str, Any]] = None,
        account_created_at: Optional[str] = None
    ) -> List[PatternMatch]:
        """
        Runs all deterministic pattern detectors against a target transaction and its context.
        Returns a list of detected PatternMatch objects.
        """
        matches: List[PatternMatch] = []

        # 1. Shared Device Detector
        if transaction.get("device_id") and device_linked_accounts:
            res = detect_shared_device(transaction["device_id"], device_linked_accounts)
            if res:
                matches.append(res)

        # 2. Shared IP Detector
        if transaction.get("ip_id") and ip_linked_accounts:
            res = detect_shared_ip(str(transaction["ip_id"]), ip_linked_accounts)
            if res:
                matches.append(res)

        # 3. Velocity Detector
        if account_recent_txns:
            res = detect_velocity(transaction["account_id"], account_recent_txns)
            if res:
                matches.append(res)

        # 4. Amount Anomaly Detector
        if historical_avg_amount is not None:
            res = detect_amount_anomaly(float(transaction["amount"]), historical_avg_amount)
            if res:
                matches.append(res)

        # 5. Geographic Anomaly Detector
        if previous_txn:
            res = detect_geographic_anomaly(transaction, previous_txn)
            if res:
                matches.append(res)

        # 6. New Account Burst Detector
        if account_created_at:
            res = detect_new_account_burst(account_created_at, transaction["timestamp"], float(transaction["amount"]))
            if res:
                matches.append(res)

        # 7. Bot-like Behavior Detector
        if account_recent_txns and len(account_recent_txns) >= 4:
            timestamps = [t["timestamp"] for t in account_recent_txns] + [transaction["timestamp"]]
            res = detect_bot_like_behavior(timestamps)
            if res:
                matches.append(res)

        return matches


pattern_engine = PatternEngine()
