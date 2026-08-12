import zlib
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from app.tools.base import BaseTool


class FetchTransactionInput(BaseModel):
    transaction_id: str = Field(description="Unique ID of transaction to retrieve")


class FetchTransactionOutput(BaseModel):
    transaction_id: str
    account_id: str
    merchant_id: str
    device_id: Optional[str] = None
    ip_id: Optional[str] = None
    amount: float
    currency: str
    timestamp: str
    status: str
    country: str


class FetchTransactionTool(BaseTool):
    name = "fetch_transaction"
    description = "Retrieve authoritative transaction details by transaction_id"
    input_schema = FetchTransactionInput
    output_schema = FetchTransactionOutput
    required_permission = "analyst"

    async def _execute(self, input_data: FetchTransactionInput) -> Dict[str, Any]:
        txn_id = input_data.transaction_id
        t_upper = txn_id.upper()

        # Scenario 1: Account Takeover via Shared Device Pool
        if "ATO" in t_upper or "1001" in t_upper:
            return {
                "transaction_id": txn_id,
                "account_id": "ACC-ATO-1001",
                "merchant_id": "MERCH-ELECTRONICS-EXPRESS",
                "device_id": "DEV-SHARED-POOL-9901",
                "ip_id": "IP-PROXY-5501",
                "amount": 1250.00,
                "currency": "USD",
                "timestamp": "2026-08-12T14:20:00+00:00",
                "status": "flagged",
                "country": "USA"
            }

        # Scenario 2: High-Velocity Rapid Micro-Transactions (Bot Burst)
        if "VEL" in t_upper or "2002" in t_upper:
            return {
                "transaction_id": txn_id,
                "account_id": "ACC-VEL-2002",
                "merchant_id": "MERCH-DIGITAL-GAMING-KEYS",
                "device_id": "DEV-BOT-BURST-22",
                "ip_id": "IP-TOR-EXIT-7701",
                "amount": 49.99,
                "currency": "USD",
                "timestamp": "2026-08-12T14:21:05+00:00",
                "status": "flagged",
                "country": "BRAZIL"
            }

        # Scenario 3: Geographic Impossible Travel Anomaly
        if "GEO" in t_upper or "3003" in t_upper:
            return {
                "transaction_id": txn_id,
                "account_id": "ACC-GEO-3003",
                "merchant_id": "MERCH-LUXURY-JEWELRY-LONDON",
                "device_id": "DEV-MOBILE-IOS-55",
                "ip_id": "IP-LONDON-PROXY-44",
                "amount": 4800.00,
                "currency": "GBP",
                "timestamp": "2026-08-12T14:22:15+00:00",
                "status": "flagged",
                "country": "UK"
            }

        # Scenario 4: High Amount Deviation on Brand New Account
        if "AMT" in t_upper or "4004" in t_upper:
            return {
                "transaction_id": txn_id,
                "account_id": "ACC-AMT-4004",
                "merchant_id": "MERCH-CRYPTO-EXCHANGE-GLOBAL",
                "device_id": "DEV-NEW-ACC-11",
                "ip_id": "IP-RESIDENTIAL-NIGERIA-12",
                "amount": 8500.00,
                "currency": "USD",
                "timestamp": "2026-08-12T14:23:00+00:00",
                "status": "flagged",
                "country": "NIGERIA"
            }

        # Scenario 5: Household Shared Family Tablet (False Positive Control)
        if "LEG" in t_upper or "5005" in t_upper:
            return {
                "transaction_id": txn_id,
                "account_id": "ACC-LEG-5005",
                "merchant_id": "MERCH-GROCERY-SUPERSTORE",
                "device_id": "DEV-FAMILY-TABLET-01",
                "ip_id": "IP-HOME-FIBER-99",
                "amount": 35.50,
                "currency": "USD",
                "timestamp": "2026-08-12T14:24:00+00:00",
                "status": "cleared",
                "country": "USA"
            }

        # Deterministic hashing fallback for custom transaction IDs
        hash_val = zlib.crc32(txn_id.encode())
        amounts = [120.50, 450.00, 1250.00, 3400.00, 89.99, 5200.00, 18.75]
        countries = ["USA", "UK", "GERMANY", "BRAZIL", "JAPAN", "CANADA", "SINGAPORE"]
        merchants = ["MERCH-AMAZON-PAY", "MERCH-STRIPE-PAY", "MERCH-AIRLINE-TICKETS", "MERCH-ELECTRONICS-HUB", "MERCH-STEAM-GAMES"]
        
        amount_idx = hash_val % len(amounts)
        country_idx = (hash_val >> 2) % len(countries)
        merchant_idx = (hash_val >> 4) % len(merchants)
        clean_id = txn_id.replace("TXN-", "").replace("CASE-", "")[:6]

        return {
            "transaction_id": txn_id,
            "account_id": f"ACC-DISTINCT-{clean_id}",
            "merchant_id": merchants[merchant_idx],
            "device_id": f"DEV-HASH-{hash_val % 1000:03d}",
            "ip_id": f"IP-ADDR-{192 + (hash_val % 50)}.{168 + (hash_val % 10)}.1.{hash_val % 255}",
            "amount": amounts[amount_idx],
            "currency": "USD",
            "timestamp": "2026-08-12T14:25:00+00:00",
            "status": "flagged" if amounts[amount_idx] > 300 else "cleared",
            "country": countries[country_idx]
        }
