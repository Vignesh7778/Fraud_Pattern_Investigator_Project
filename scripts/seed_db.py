import asyncio
import os
import sys
from datetime import datetime, timezone

# Ensure root directory and backend directory are in sys.path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
sys.path.insert(0, ROOT_DIR)
sys.path.insert(0, BACKEND_DIR)


from app.db.session import engine, AsyncSessionLocal
from app.models import (
    Base, User, Account, Device, IPAddress, Merchant,
    DeviceAccountLink, IPAccountLink, Transaction,
    PolicyDocument, HistoricalCase
)
from data.synthetic.generator import SyntheticDataGenerator


async def seed_database():
    print("=== Fraud Pattern Investigator Database Seeder ===")
    
    # Check if configured engine connects, else fallback to SQLite
    active_engine = engine
    active_sessionmaker = AsyncSessionLocal

    try:
        async with active_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("1. Connected to primary PostgreSQL database & created tables.")
    except Exception as e:
        print(f"1. [NOTICE] Primary PostgreSQL database offline ({type(e).__name__}). Using local SQLite database...")
        from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
        os.makedirs("data", exist_ok=True)
        sqlite_url = "sqlite+aiosqlite:///./data/fraud_investigator.db"
        active_engine = create_async_engine(sqlite_url, echo=False, future=True)
        active_sessionmaker = async_sessionmaker(bind=active_engine, class_=AsyncSession, expire_on_commit=False)
        async with active_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("   Created local SQLite database tables at data/fraud_investigator.db.")

    print("2. Generating synthetic dataset...")
    generator = SyntheticDataGenerator(num_users=1000, target_transactions=10000)
    data = generator.generate_all()

    print("3. Seeding database records...")
    async with active_sessionmaker() as session:

        async with session.begin():
            # Seed Users
            print("  Seeding users...")
            user_objs = [
                User(
                    id=u["id"],
                    email=u["email"],
                    name=u["name"],
                    role=u["role"],
                    is_active=u["is_active"],
                    created_at=datetime.fromisoformat(u["created_at"])
                )
                for u in data["users"]
            ]
            session.add_all(user_objs)

            # Seed Accounts
            print("  Seeding accounts...")
            account_objs = [
                Account(
                    id=a["id"],
                    user_id=a["user_id"],
                    account_number=a["account_number"],
                    balance=a["balance"],
                    currency=a["currency"],
                    status=a["status"],
                    risk_tier=a["risk_tier"],
                    kyc_verified=a["kyc_verified"],
                    created_at=datetime.fromisoformat(a["created_at"])
                )
                for a in data["accounts"]
            ]
            session.add_all(account_objs)

            # Seed Devices
            print("  Seeding devices...")
            device_objs = [
                Device(
                    id=d["id"],
                    device_hash=d["device_hash"],
                    device_type=d["device_type"],
                    os=d["os"],
                    browser=d["browser"],
                    first_seen_at=datetime.fromisoformat(d["first_seen_at"])
                )
                for d in data["devices"]
            ]
            session.add_all(device_objs)

            # Seed IPs
            print("  Seeding IP addresses...")
            ip_objs = [
                IPAddress(
                    id=i["id"],
                    ip_address=i["ip_address"],
                    country=i["country"],
                    city=i["city"],
                    is_vpn=i["is_vpn"],
                    is_tor=i["is_tor"],
                    first_seen_at=datetime.fromisoformat(i["first_seen_at"])
                )
                for i in data["ips"]
            ]
            session.add_all(ip_objs)

            # Seed Merchants
            print("  Seeding merchants...")
            merchant_objs = [
                Merchant(
                    id=m["id"],
                    merchant_code=m["merchant_code"],
                    name=m["name"],
                    category=m["category"],
                    risk_level=m["risk_level"]
                )
                for m in data["merchants"]
            ]
            session.add_all(merchant_objs)

            # Seed Links
            print("  Seeding device/IP account links...")
            dev_links = [
                DeviceAccountLink(
                    id=l["id"],
                    device_id=l["device_id"],
                    account_id=l["account_id"],
                    linked_at=datetime.fromisoformat(l["linked_at"])
                )
                for l in data["device_account_links"]
            ]
            ip_links = [
                IPAccountLink(
                    id=l["id"],
                    ip_id=l["ip_id"],
                    account_id=l["account_id"],
                    linked_at=datetime.fromisoformat(l["linked_at"])
                )
                for l in data["ip_account_links"]
            ]
            session.add_all(dev_links + ip_links)

            # Seed Transactions
            print("  Seeding transactions...")
            txn_objs = [
                Transaction(
                    id=t["id"],
                    account_id=t["account_id"],
                    merchant_id=t["merchant_id"],
                    device_id=t["device_id"],
                    ip_id=t["ip_id"],
                    amount=t["amount"],
                    currency=t["currency"],
                    timestamp=datetime.fromisoformat(t["timestamp"]),
                    location_lat=t["location_lat"],
                    location_lon=t["location_lon"],
                    country=t["country"],
                    status=t["status"],
                    is_fraud=t["is_fraud"],
                    fraud_scenario=t["fraud_scenario"]
                )
                for t in data["transactions"]
            ]
            session.add_all(txn_objs)

            # Seed Policy Documents & Historical Cases
            print("  Seeding policies and historical cases...")
            policies = [
                PolicyDocument(
                    id=p["id"],
                    document_id=p["document_id"],
                    title=p["title"],
                    category=p["category"],
                    content=p["content"],
                    doc_metadata=p["doc_metadata"]
                )
                for p in data["policy_documents"]
            ]
            cases = [
                HistoricalCase(
                    id=c["id"],
                    case_reference=c["case_reference"],
                    pattern_label=c["pattern_label"],
                    summary=c["summary"],
                    resolution=c["resolution"],
                    case_metadata=c["case_metadata"]
                )
                for c in data["historical_cases"]
            ]
            session.add_all(policies + cases)

        await session.commit()
    print("=== Database Seeding Complete! ===")


if __name__ == "__main__":
    asyncio.run(seed_database())
