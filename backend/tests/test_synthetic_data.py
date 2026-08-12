import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, func

from app.models import Base, User, Account, Transaction, Device, IPAddress, Merchant
from data.synthetic.generator import SyntheticDataGenerator


@pytest.fixture(scope="module")
def synthetic_data():
    generator = SyntheticDataGenerator(num_users=100, target_transactions=1000)
    return generator.generate_all()


def test_generator_counts(synthetic_data):
    assert len(synthetic_data["users"]) == 100
    assert len(synthetic_data["accounts"]) >= 100
    assert len(synthetic_data["devices"]) > 0
    assert len(synthetic_data["ips"]) > 0
    assert len(synthetic_data["merchants"]) == 100
    assert len(synthetic_data["transactions"]) > 500


def test_generator_ground_truth_labels(synthetic_data):
    scenarios = set(t["fraud_scenario"] for t in synthetic_data["transactions"])
    assert "legitimate_traffic" in scenarios
    assert "shared_device" in scenarios
    assert "shared_ip" in scenarios
    assert "high_velocity" in scenarios
    assert "unusual_amount" in scenarios
    assert "impossible_travel" in scenarios
    assert "legitimate_shared_device" in scenarios

    fraud_txns = [t for t in synthetic_data["transactions"] if t["is_fraud"]]
    assert len(fraud_txns) > 0


@pytest_asyncio.fixture
async def in_memory_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session

    await engine.dispose()


@pytest.mark.asyncio
async def test_database_models_in_memory(in_memory_db, synthetic_data):
    session = in_memory_db

    # Insert 10 users & accounts
    user = User(
        id=synthetic_data["users"][0]["id"],
        email=synthetic_data["users"][0]["email"],
        name=synthetic_data["users"][0]["name"],
        role="analyst"
    )
    session.add(user)
    await session.commit()

    result = await session.execute(select(User).where(User.id == user.id))
    fetched_user = result.scalar_one()
    assert fetched_user.email == synthetic_data["users"][0]["email"]
