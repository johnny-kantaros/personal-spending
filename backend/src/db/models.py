from sqlalchemy import Column, String, Float, Date, Boolean, ForeignKey, JSON, Index, DateTime
from datetime import datetime
import uuid

from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=True, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("Item", back_populates="user")
    vendor_rules = relationship("VendorCategoryRule", back_populates="user")

class Item(Base):
    __tablename__ = "items"
    id = Column(String, primary_key=True)
    access_token = Column(String, nullable=False)
    institution_name = Column(String, nullable=True)
    cursor = Column(String, default="")
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)

    transactions = relationship("Transaction", back_populates="item")
    user = relationship("User", back_populates="items")

class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(String, primary_key=True)
    item_id = Column(String, ForeignKey("items.id"), nullable=False)
    account_id = Column(String, nullable=False)

    amount = Column(Float, nullable=False)
    iso_currency_code = Column(String, nullable=True)

    name = Column(String, nullable=False)
    merchant_name = Column(String, nullable=True)
    merchant_entity_id = Column(String, nullable=True)
    website = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)

    date = Column(Date, nullable=False)
    authorized_date = Column(Date, nullable=True)
    pending = Column(Boolean, nullable=False)

    # JSON blobs for complex nested data
    location = Column(JSON, nullable=True)
    payment_meta = Column(JSON, nullable=True)
    personal_finance_category = Column(JSON, nullable=True)
    counterparties = Column(JSON, nullable=True)

    # Simplified text fields for quick filtering
    primary_category = Column(String, nullable=True)
    detailed_category = Column(String, nullable=True)
    simplified_category = Column(String, nullable=True)

    # Linking transactions (e.g., Venmo payments to dinner splits)
    linked_to_transaction_id = Column(String, ForeignKey("transactions.transaction_id"), nullable=True)

    # Exclude from spending view
    excluded = Column(Boolean, default=False, nullable=False)

    item = relationship("Item", back_populates="transactions")
    linked_to = relationship("Transaction", remote_side="Transaction.transaction_id", foreign_keys=[linked_to_transaction_id])

    __table_args__ = (
        Index('ix_transaction_item_id', 'item_id'),
        Index('ix_transaction_date', 'date'),
        Index('ix_transaction_primary_category', 'primary_category'),
        Index('ix_transaction_item_date', 'item_id', 'date'),
    )


class VendorCategoryRule(Base):
    __tablename__ = "vendor_category_rules"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    vendor_name = Column(String, nullable=False, index=True)
    simplified_category = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="vendor_rules")

    __table_args__ = (
        Index('ix_vendor_user_name', 'user_id', 'vendor_name', unique=True),
    )
