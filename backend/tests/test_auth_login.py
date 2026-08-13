import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_login_success_with_analyst_user_id():
    response = client.post("/api/v1/auth/login", json={
        "email": "USR-001",
        "password": "analyst123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["id"] == "USR-001"
    assert data["user"]["role"] == "analyst"
    assert data["user"]["name"] == "Sarah Jenkins"


def test_login_success_with_analyst_email():
    response = client.post("/api/v1/auth/login", json={
        "email": "analyst@fpi.io",
        "password": "analyst123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["id"] == "USR-001"
    assert data["user"]["email"] == "analyst@fpi.io"


def test_login_success_with_auditor_credentials():
    response = client.post("/api/v1/auth/login", json={
        "email": "USR-002",
        "password": "auditor123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["id"] == "USR-002"
    assert data["user"]["role"] == "auditor"
    assert data["user"]["name"] == "Marcus Vance"


def test_login_success_with_admin_credentials():
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@fpi.io",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["id"] == "USR-003"
    assert data["user"]["role"] == "admin"
    assert data["user"]["name"] == "Elena Rostova"


def test_login_failure_invalid_password():
    response = client.post("/api/v1/auth/login", json={
        "email": "USR-001",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]


def test_login_failure_unknown_user():
    response = client.post("/api/v1/auth/login", json={
        "email": "NONEXISTENT_USER",
        "password": "analyst123"
    })
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]
