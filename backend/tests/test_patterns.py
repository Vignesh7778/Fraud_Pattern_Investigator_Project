from datetime import datetime, timedelta, timezone
from app.patterns.detectors import (
    detect_shared_device,
    detect_shared_ip,
    detect_velocity,
    detect_amount_anomaly,
    detect_geographic_anomaly,
    detect_new_account_burst,
    detect_bot_like_behavior
)
from app.patterns.engine import pattern_engine


def test_detect_shared_device():
    # Positive case: 5 accounts on 1 device
    match = detect_shared_device("DEV-101", ["ACC1", "ACC2", "ACC3", "ACC4", "ACC5"])
    assert match is not None
    assert match.pattern_id == "shared_device"
    assert match.severity in ["HIGH", "CRITICAL"]

    # Negative control case: 2 accounts on 1 device
    no_match = detect_shared_device("DEV-102", ["ACC1", "ACC2"])
    assert no_match is None


def test_detect_shared_ip():
    match = detect_shared_ip("192.168.1.50", [f"ACC{i}" for i in range(8)])
    assert match is not None
    assert match.pattern_id == "shared_ip"
    assert match.severity in ["HIGH", "CRITICAL"]

    no_match = detect_shared_ip("192.168.1.51", ["ACC1", "ACC2"])
    assert no_match is None


def test_detect_velocity():
    now = datetime.now(timezone.utc)
    recent = [{"amount": 500.0, "timestamp": (now - timedelta(seconds=i*30)).isoformat()} for i in range(6)]
    match = detect_velocity("ACC-900", recent)
    assert match is not None
    assert match.pattern_id == "velocity"


def test_detect_amount_anomaly():
    match = detect_amount_anomaly(12000.0, 500.0)  # 24x average
    assert match is not None
    assert match.pattern_id == "amount_anomaly"

    no_match = detect_amount_anomaly(550.0, 500.0)  # 1.1x average
    assert no_match is None


def test_detect_geographic_anomaly():
    now = datetime.now(timezone.utc)
    current_txn = {
        "timestamp": now.isoformat(),
        "location_lat": 35.6762,
        "location_lon": 139.6503,
        "country": "Japan"
    }
    prev_txn = {
        "timestamp": (now - timedelta(minutes=30)).isoformat(),
        "location_lat": 40.7128,
        "location_lon": -74.0060,
        "country": "USA"
    }
    match = detect_geographic_anomaly(current_txn, prev_txn)
    assert match is not None
    assert match.pattern_id == "geographic_anomaly"


def test_detect_bot_like_behavior():
    now = datetime.now(timezone.utc)
    # Fixed 10.0s intervals
    timestamps = [(now - timedelta(seconds=i * 10)).isoformat() for i in range(5)]
    match = detect_bot_like_behavior(timestamps)
    assert match is not None
    assert match.pattern_id == "bot_like_behavior"


def test_false_positive_household_shared_kiosk():
    # Legitimate household tablet shared between 2 family accounts
    match = detect_shared_device("DEV-HOUSEHOLD", ["ACC_MOM", "ACC_DAD"])
    assert match is None
