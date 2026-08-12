from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Float, Boolean, ForeignKey, Index, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, generate_uuid


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="analyst", index=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    accounts: Mapped[List["Account"]] = relationship("Account", back_populates="user", cascade="all, delete-orphan")


class Account(Base, TimestampMixin):
    __tablename__ = "accounts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    account_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    balance: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", index=True, nullable=False)
    risk_tier: Mapped[str] = mapped_column(String(20), default="low", nullable=False)
    kyc_verified: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="accounts")
    transactions: Mapped[List["Transaction"]] = relationship("Transaction", back_populates="account")
    device_links: Mapped[List["DeviceAccountLink"]] = relationship("DeviceAccountLink", back_populates="account")
    ip_links: Mapped[List["IPAccountLink"]] = relationship("IPAccountLink", back_populates="account")


class Device(Base, TimestampMixin):
    __tablename__ = "devices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    device_hash: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    device_type: Mapped[str] = mapped_column(String(50), nullable=False)
    os: Mapped[str] = mapped_column(String(50), nullable=False)
    browser: Mapped[str] = mapped_column(String(50), nullable=False)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    account_links: Mapped[List["DeviceAccountLink"]] = relationship("DeviceAccountLink", back_populates="device")


class IPAddress(Base, TimestampMixin):
    __tablename__ = "ips"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    ip_address: Mapped[str] = mapped_column(String(45), unique=True, index=True, nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_vpn: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_tor: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    account_links: Mapped[List["IPAccountLink"]] = relationship("IPAccountLink", back_populates="ip")


class Merchant(Base, TimestampMixin):
    __tablename__ = "merchants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    merchant_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), default="low", nullable=False)


class DeviceAccountLink(Base):
    __tablename__ = "device_account_links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    device_id: Mapped[str] = mapped_column(String(36), ForeignKey("devices.id", ondelete="CASCADE"), index=True, nullable=False)
    account_id: Mapped[str] = mapped_column(String(36), ForeignKey("accounts.id", ondelete="CASCADE"), index=True, nullable=False)
    linked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    device: Mapped["Device"] = relationship("Device", back_populates="account_links")
    account: Mapped["Account"] = relationship("Account", back_populates="device_links")


class IPAccountLink(Base):
    __tablename__ = "ip_account_links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    ip_id: Mapped[str] = mapped_column(String(36), ForeignKey("ips.id", ondelete="CASCADE"), index=True, nullable=False)
    account_id: Mapped[str] = mapped_column(String(36), ForeignKey("accounts.id", ondelete="CASCADE"), index=True, nullable=False)
    linked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    ip: Mapped["IPAddress"] = relationship("IPAddress", back_populates="account_links")
    account: Mapped["Account"] = relationship("Account", back_populates="ip_links")


class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    account_id: Mapped[str] = mapped_column(String(36), ForeignKey("accounts.id", ondelete="CASCADE"), index=True, nullable=False)
    merchant_id: Mapped[str] = mapped_column(String(36), ForeignKey("merchants.id"), index=True, nullable=False)
    device_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("devices.id"), index=True, nullable=True)
    ip_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("ips.id"), index=True, nullable=True)

    amount: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True, nullable=False)

    location_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    location_lon: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    country: Mapped[str] = mapped_column(String(100), default="USA", nullable=False)

    status: Mapped[str] = mapped_column(String(50), default="approved", index=True, nullable=False)
    is_fraud: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    fraud_scenario: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)

    account: Mapped["Account"] = relationship("Account", back_populates="transactions")
    merchant: Mapped["Merchant"] = relationship("Merchant")
    device: Mapped[Optional["Device"]] = relationship("Device")
    ip: Mapped[Optional["IPAddress"]] = relationship("IPAddress")


# Composite indexes for fast fraud query lookups
Index("idx_txn_acc_time", Transaction.account_id, Transaction.timestamp)
Index("idx_txn_device_time", Transaction.device_id, Transaction.timestamp)
Index("idx_txn_ip_time", Transaction.ip_id, Transaction.timestamp)
