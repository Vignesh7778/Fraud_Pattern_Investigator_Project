import zlib
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from app.tools.base import BaseTool


class FetchAccountHistoryInput(BaseModel):
    account_id: str = Field(description="Unique ID of account to inspect")


class FetchAccountHistoryOutput(BaseModel):
    account_id: str
    account_number: str
    user_id: str
    balance: float
    status: str
    risk_tier: str
    kyc_verified: bool
    account_age_days: float
    recent_transactions: List[Dict[str, Any]] = Field(default_factory=list)


class FetchAccountHistoryTool(BaseTool):
    name = "fetch_account_history"
    description = "Retrieve account profile, balance, KYC status, and recent transaction history"
    input_schema = FetchAccountHistoryInput
    output_schema = FetchAccountHistoryOutput
    required_permission = "analyst"

    async def _execute(self, input_data: FetchAccountHistoryInput) -> Dict[str, Any]:
        acc_id = input_data.account_id
        a_upper = acc_id.upper()

        if "ATO" in a_upper or "1001" in a_upper:
            return {
                "account_id": acc_id,
                "account_number": "ACC-NUM-ATO-1001",
                "user_id": "USR-ATO-1001",
                "balance": 24500.00,
                "status": "active",
                "risk_tier": "high",
                "kyc_verified": True,
                "account_age_days": 450.0,
                "recent_transactions": [
                    {"txn_id": "TXN-ATO-PREV-1", "amount": 1250.00, "merchant": "MERCH-ELECTRONICS-EXPRESS"},
                    {"txn_id": "TXN-ATO-PREV-2", "amount": 890.00, "merchant": "MERCH-APPLE-STORE"}
                ]
            }

        if "VEL" in a_upper or "2002" in a_upper:
            return {
                "account_id": acc_id,
                "account_number": "ACC-NUM-VEL-2002",
                "user_id": "USR-VEL-2002",
                "balance": 1850.00,
                "status": "active",
                "risk_tier": "medium",
                "kyc_verified": False,
                "account_age_days": 12.0,
                "recent_transactions": [
                    {"txn_id": "TXN-VEL-1", "amount": 49.99, "merchant": "MERCH-DIGITAL-GAMING"},
                    {"txn_id": "TXN-VEL-2", "amount": 49.99, "merchant": "MERCH-DIGITAL-GAMING"},
                    {"txn_id": "TXN-VEL-3", "amount": 49.99, "merchant": "MERCH-DIGITAL-GAMING"}
                ]
            }

        if "AMT" in a_upper or "4004" in a_upper:
            return {
                "account_id": acc_id,
                "account_number": "ACC-NUM-AMT-4004",
                "user_id": "USR-AMT-4004",
                "balance": 8600.00,
                "status": "new",
                "risk_tier": "critical",
                "kyc_verified": False,
                "account_age_days": 1.5,
                "recent_transactions": [
                    {"txn_id": "TXN-AMT-FIRST", "amount": 8500.00, "merchant": "MERCH-CRYPTO-EXCHANGE"}
                ]
            }

        if "LEG" in a_upper or "5005" in a_upper:
            return {
                "account_id": acc_id,
                "account_number": "ACC-NUM-LEG-5005",
                "user_id": "USR-LEG-5005",
                "balance": 5200.00,
                "status": "active",
                "risk_tier": "low",
                "kyc_verified": True,
                "account_age_days": 850.0,
                "recent_transactions": [
                    {"txn_id": "TXN-LEG-1", "amount": 35.50, "merchant": "MERCH-GROCERY"},
                    {"txn_id": "TXN-LEG-2", "amount": 18.20, "merchant": "MERCH-COFFEE-SHOP"}
                ]
            }

        # Deterministic hashing fallback for custom account IDs
        hash_val = zlib.crc32(acc_id.encode())
        balances = [1250.00, 5400.00, 18900.00, 350.00, 42000.00]
        kyc = [True, False, True, True, False]
        risk_tiers = ["low", "medium", "high", "critical", "low"]
        clean_id = acc_id.replace("ACC-", "")[:6]

        return {
            "account_id": acc_id,
            "account_number": f"ACC-NUM-{clean_id}",
            "user_id": f"USR-{clean_id}",
            "balance": balances[hash_val % len(balances)],
            "status": "active",
            "risk_tier": risk_tiers[hash_val % len(risk_tiers)],
            "kyc_verified": kyc[hash_val % len(kyc)],
            "account_age_days": float((hash_val % 500) + 1),
            "recent_transactions": [
                {"txn_id": f"TXN-PREV-{hash_val % 100}", "amount": float((hash_val % 200) + 15), "merchant": "MERCH-STANDARD"}
            ]
        }
