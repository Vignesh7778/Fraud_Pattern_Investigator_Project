import uuid
import random
import json
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Tuple
from faker import Faker

fake = Faker()
fake.seed_instance(42)
random.seed(42)


class SyntheticDataGenerator:
    def __init__(self, num_users: int = 1000, target_transactions: int = 10000):
        self.num_users = num_users
        self.target_transactions = target_transactions

        self.users: List[Dict[str, Any]] = []
        self.accounts: List[Dict[str, Any]] = []
        self.devices: List[Dict[str, Any]] = []
        self.ips: List[Dict[str, Any]] = []
        self.merchants: List[Dict[str, Any]] = []
        self.device_account_links: List[Dict[str, Any]] = []
        self.ip_account_links: List[Dict[str, Any]] = []
        self.transactions: List[Dict[str, Any]] = []
        self.policy_documents: List[Dict[str, Any]] = []
        self.historical_cases: List[Dict[str, Any]] = []

    def generate_all(self) -> Dict[str, List[Dict[str, Any]]]:
        print("Generating synthetic merchants...")
        self._generate_merchants()

        print("Generating synthetic users and accounts...")
        self._generate_users_and_accounts()

        print("Generating synthetic devices and IP addresses...")
        self._generate_infrastructure()

        print("Generating baseline transactions...")
        self._generate_baseline_transactions()

        print("Injecting labeled fraud scenarios...")
        self._inject_fraud_scenarios()

        print("Generating synthetic policy knowledge base...")
        self._generate_policies_and_cases()

        print(f"Generation Complete! Total transactions: {len(self.transactions)}")
        return {
            "users": self.users,
            "accounts": self.accounts,
            "devices": self.devices,
            "ips": self.ips,
            "merchants": self.merchants,
            "device_account_links": self.device_account_links,
            "ip_account_links": self.ip_account_links,
            "transactions": self.transactions,
            "policy_documents": self.policy_documents,
            "historical_cases": self.historical_cases,
        }

    def _generate_merchants(self):
        categories = [
            ("retail", "low"),
            ("groceries", "low"),
            ("travel", "medium"),
            ("electronics", "medium"),
            ("luxury", "high"),
            ("crypto_exchange", "high"),
            ("peer_transfer", "medium"),
        ]
        for i in range(100):
            cat, risk = random.choice(categories)
            merchant = {
                "id": str(uuid.uuid4()),
                "merchant_code": f"MERCH-{i+1000}",
                "name": fake.company(),
                "category": cat,
                "risk_level": risk,
            }
            self.merchants.append(merchant)

    def _generate_users_and_accounts(self):
        start_date = datetime.now(timezone.utc) - timedelta(days=180)

        roles = ["analyst"] * 950 + ["auditor"] * 40 + ["admin"] * 10
        for i in range(self.num_users):
            created_at = start_date + timedelta(days=random.randint(0, 150))
            user_id = str(uuid.uuid4())
            user = {
                "id": user_id,
                "email": f"user_{i+100}@example.com",
                "name": fake.name(),
                "role": roles[i],
                "is_active": True,
                "created_at": created_at.isoformat(),
            }
            self.users.append(user)

            # Generate 1 to 3 accounts per user
            num_accounts = random.choices([1, 2, 3], weights=[0.7, 0.2, 0.1])[0]
            for j in range(num_accounts):
                account = {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "account_number": f"ACC-{i+1000}-{j+1}",
                    "balance": round(random.uniform(500.0, 50000.0), 2),
                    "currency": "USD",
                    "status": "active",
                    "risk_tier": "low",
                    "kyc_verified": True,
                    "created_at": created_at.isoformat(),
                }
                self.accounts.append(account)

    def _generate_infrastructure(self):
        # Generate 1,200 devices
        for _ in range(1200):
            device = {
                "id": str(uuid.uuid4()),
                "device_hash": fake.sha256()[:32],
                "device_type": random.choice(["mobile_ios", "mobile_android", "desktop_windows", "desktop_mac"]),
                "os": random.choice(["iOS 17", "Android 14", "Windows 11", "macOS Sonoma"]),
                "browser": random.choice(["Safari", "Chrome", "Firefox", "Edge"]),
                "first_seen_at": (datetime.now(timezone.utc) - timedelta(days=random.randint(30, 180))).isoformat(),
            }
            self.devices.append(device)

        # Generate 1,500 IP addresses
        for _ in range(1500):
            ip = {
                "id": str(uuid.uuid4()),
                "ip_address": fake.ipv4(),
                "country": random.choice(["USA", "Canada", "UK", "Germany", "Japan"]),
                "city": fake.city(),
                "is_vpn": random.random() < 0.05,
                "is_tor": random.random() < 0.01,
                "first_seen_at": (datetime.now(timezone.utc) - timedelta(days=random.randint(30, 180))).isoformat(),
            }
            self.ips.append(ip)

        # Link primary devices and IPs to accounts
        for acc in self.accounts:
            primary_device = random.choice(self.devices)
            primary_ip = random.choice(self.ips)

            self.device_account_links.append({
                "id": str(uuid.uuid4()),
                "device_id": primary_device["id"],
                "account_id": acc["id"],
                "linked_at": acc["created_at"],
            })
            self.ip_account_links.append({
                "id": str(uuid.uuid4()),
                "ip_id": primary_ip["id"],
                "account_id": acc["id"],
                "linked_at": acc["created_at"],
            })

    def _generate_baseline_transactions(self):
        start_date = datetime.now(timezone.utc) - timedelta(days=90)
        end_date = datetime.now(timezone.utc)

        # Create ~9,000 legitimate transactions
        for _ in range(9000):
            acc = random.choice(self.accounts)
            merchant = random.choice(self.merchants)

            # Get user linked device/IP or pick random
            linked_devs = [l["device_id"] for l in self.device_account_links if l["account_id"] == acc["id"]]
            linked_ips = [l["ip_id"] for l in self.ip_account_links if l["account_id"] == acc["id"]]

            device_id = linked_devs[0] if linked_devs else random.choice(self.devices)["id"]
            ip_id = linked_ips[0] if linked_ips else random.choice(self.ips)["id"]

            txn_time = start_date + timedelta(seconds=random.randint(0, int((end_date - start_date).total_seconds())))

            txn = {
                "id": str(uuid.uuid4()),
                "account_id": acc["id"],
                "merchant_id": merchant["id"],
                "device_id": device_id,
                "ip_id": ip_id,
                "amount": round(random.uniform(5.0, 450.0), 2),
                "currency": "USD",
                "timestamp": txn_time.isoformat(),
                "location_lat": 40.7128 + random.uniform(-0.1, 0.1),
                "location_lon": -74.0060 + random.uniform(-0.1, 0.1),
                "country": "USA",
                "status": "approved",
                "is_fraud": False,
                "fraud_scenario": "legitimate_traffic",
            }
            self.transactions.append(txn)

    def _inject_fraud_scenarios(self):
        start_date = datetime.now(timezone.utc) - timedelta(days=90)
        end_date = datetime.now(timezone.utc)

        def random_timestamp():
            sec = random.randint(0, int((end_date - start_date).total_seconds()))
            return start_date + timedelta(seconds=sec)

        # 1. Multiple Shared Device Fraud Scenarios (50 incidents)
        for _ in range(50):
            base_time = random_timestamp()
            shared_dev = random.choice(self.devices)
            victim_accounts = random.sample(self.accounts, min(6, len(self.accounts)))
            for i, acc in enumerate(victim_accounts):
                self.device_account_links.append({
                    "id": str(uuid.uuid4()),
                    "device_id": shared_dev["id"],
                    "account_id": acc["id"],
                    "linked_at": (base_time - timedelta(hours=i)).isoformat(),
                })
                self.transactions.append({
                    "id": str(uuid.uuid4()),
                    "account_id": acc["id"],
                    "merchant_id": random.choice(self.merchants)["id"],
                    "device_id": shared_dev["id"],
                    "ip_id": random.choice(self.ips)["id"],
                    "amount": round(random.uniform(1200.0, 4500.0), 2),
                    "currency": "USD",
                    "timestamp": (base_time + timedelta(minutes=i * 15)).isoformat(),
                    "location_lat": 34.0522,
                    "location_lon": -118.2437,
                    "country": "USA",
                    "status": "flagged",
                    "is_fraud": True,
                    "fraud_scenario": "shared_device",
                })

        # 2. Multiple Shared IP Fraud Scenarios (50 incidents)
        for _ in range(50):
            base_time = random_timestamp()
            shared_ip = random.choice(self.ips)
            ip_accounts = random.sample(self.accounts, min(8, len(self.accounts)))
            for acc in ip_accounts:
                self.transactions.append({
                    "id": str(uuid.uuid4()),
                    "account_id": acc["id"],
                    "merchant_id": random.choice(self.merchants)["id"],
                    "device_id": random.choice(self.devices)["id"],
                    "ip_id": shared_ip["id"],
                    "amount": round(random.uniform(850.0, 2500.0), 2),
                    "currency": "USD",
                    "timestamp": (base_time + timedelta(minutes=random.randint(1, 45))).isoformat(),
                    "location_lat": 41.8781,
                    "location_lon": -87.6298,
                    "country": "USA",
                    "status": "flagged",
                    "is_fraud": True,
                    "fraud_scenario": "shared_ip",
                })

        # 3. Multiple High Velocity Fraud Scenarios (60 incidents)
        for _ in range(60):
            base_time = random_timestamp()
            velocity_acc = random.choice(self.accounts)
            for k in range(8):
                self.transactions.append({
                    "id": str(uuid.uuid4()),
                    "account_id": velocity_acc["id"],
                    "merchant_id": random.choice(self.merchants)["id"],
                    "device_id": random.choice(self.devices)["id"],
                    "ip_id": random.choice(self.ips)["id"],
                    "amount": round(random.uniform(200.0, 950.0), 2),
                    "currency": "USD",
                    "timestamp": (base_time + timedelta(seconds=k * 15)).isoformat(),
                    "location_lat": 25.7617,
                    "location_lon": -80.1918,
                    "country": "USA",
                    "status": "flagged",
                    "is_fraud": True,
                    "fraud_scenario": "high_velocity",
                })

        # 4. Multiple Unusual Amount Anomaly Scenarios (100 incidents)
        for _ in range(100):
            amount_acc = random.choice(self.accounts)
            self.transactions.append({
                "id": str(uuid.uuid4()),
                "account_id": amount_acc["id"],
                "merchant_id": random.choice(self.merchants)["id"],
                "device_id": random.choice(self.devices)["id"],
                "ip_id": random.choice(self.ips)["id"],
                "amount": round(random.uniform(8000.0, 25000.0), 2),  # Extreme spike
                "currency": "USD",
                "timestamp": random_timestamp().isoformat(),
                "location_lat": 40.7128,
                "location_lon": -74.0060,
                "country": "USA",
                "status": "flagged",
                "is_fraud": True,
                "fraud_scenario": "unusual_amount",
            })

        # 5. Multiple Impossible Travel Scenarios (40 incidents)
        for _ in range(40):
            base_time = random_timestamp()
            travel_acc = random.choice(self.accounts)
            self.transactions.append({
                "id": str(uuid.uuid4()),
                "account_id": travel_acc["id"],
                "merchant_id": random.choice(self.merchants)["id"],
                "device_id": random.choice(self.devices)["id"],
                "ip_id": random.choice(self.ips)["id"],
                "amount": 450.00,
                "currency": "USD",
                "timestamp": base_time.isoformat(),
                "location_lat": 40.7128,  # New York
                "location_lon": -74.0060,
                "country": "USA",
                "status": "approved",
                "is_fraud": False,
                "fraud_scenario": "impossible_travel",
            })
            self.transactions.append({
                "id": str(uuid.uuid4()),
                "account_id": travel_acc["id"],
                "merchant_id": random.choice(self.merchants)["id"],
                "device_id": random.choice(self.devices)["id"],
                "ip_id": random.choice(self.ips)["id"],
                "amount": 3200.00,
                "currency": "USD",
                "timestamp": (base_time + timedelta(minutes=30)).isoformat(),  # 30 mins later in Tokyo
                "location_lat": 35.6762,  # Tokyo
                "location_lon": 139.6503,
                "country": "Japan",
                "status": "flagged",
                "is_fraud": True,
                "fraud_scenario": "impossible_travel",
            })

        # 6. Multiple Legitimate Shared Device False Positives (50 incidents)
        for _ in range(50):
            base_time = random_timestamp()
            kiosk_dev = random.choice(self.devices)
            family_accounts = random.sample(self.accounts, min(4, len(self.accounts)))
            for acc in family_accounts:
                self.transactions.append({
                    "id": str(uuid.uuid4()),
                    "account_id": acc["id"],
                    "merchant_id": random.choice(self.merchants)["id"],
                    "device_id": kiosk_dev["id"],
                    "ip_id": random.choice(self.ips)["id"],
                    "amount": round(random.uniform(25.0, 80.0), 2),
                    "currency": "USD",
                    "timestamp": (base_time + timedelta(hours=random.randint(12, 72))).isoformat(),
                    "location_lat": 37.7749,
                    "location_lon": -122.4194,
                    "country": "USA",
                    "status": "approved",
                    "is_fraud": False,
                    "fraud_scenario": "legitimate_shared_device",
                })


    def _generate_policies_and_cases(self):
        self.policy_documents = [
            {
                "id": str(uuid.uuid4()),
                "document_id": "POL-DEVICE-001",
                "title": "Shared Device & Account Association Rules",
                "category": "device_risk",
                "content": "Rule 4.1: If a single device hash is observed operating across more than 4 distinct customer accounts within a rolling 24-hour window, all subsequent high-value transactions (> $500) originating from that device must be flagged for manual review.",
                "doc_metadata": {"author": "Risk Operations", "version": "2.1"}
            },
            {
                "id": str(uuid.uuid4()),
                "document_id": "POL-VELOCITY-002",
                "title": "Transaction Velocity & Frequency Limits",
                "category": "velocity_risk",
                "content": "Rule 3.2: Accounts attempting more than 8 transactions in a 5-minute window exceed velocity thresholds. If the total cumulative value exceeds $2,000, trigger automated risk escalation.",
                "doc_metadata": {"author": "Risk Operations", "version": "1.4"}
            },
            {
                "id": str(uuid.uuid4()),
                "document_id": "POL-GEO-003",
                "title": "Geographic Impossibility & Location Velocity Policy",
                "category": "geo_risk",
                "content": "Rule 5.3: Physical location change exceeding 800 km/hour equivalent travel speed between consecutive transaction timestamps indicates impossible travel. Requires immediate device verification.",
                "doc_metadata": {"author": "Security Team", "version": "3.0"}
            }
        ]

        self.historical_cases = [
            {
                "id": str(uuid.uuid4()),
                "case_reference": "CASE-2025-0891",
                "pattern_label": "shared_device",
                "summary": "Shared device pool utilized by compromised account takeover network across 8 user accounts.",
                "resolution": "Confirmed Fraud. Account access revoked.",
                "case_metadata": {"confidence": 0.96, "recovered_amount": 14200.0}
            },
            {
                "id": str(uuid.uuid4()),
                "case_reference": "CASE-2025-0412",
                "pattern_label": "legitimate_shared_device",
                "summary": "Shared tablet device used by family members residing at same household address.",
                "resolution": "Confirmed Legitimate. Device whitelisted for household.",
                "case_metadata": {"confidence": 0.92, "action": "whitelist"}
            }
        ]


if __name__ == "__main__":
    generator = SyntheticDataGenerator()
    data = generator.generate_all()
    with open("data/synthetic/synthetic_dataset.json", "w") as f:
        json.dump(data, f, indent=2)
    print("Dataset saved to data/synthetic/synthetic_dataset.json")
