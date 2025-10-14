from sqlalchemy import Column, String, Float, Date, Boolean, ForeignKey, JSON

from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Item(Base):
    __tablename__ = "items"
    id = Column(String, primary_key=True)
    access_token = Column(String, nullable=False)
    institution_name = Column(String, nullable=False, unique=True)
    cursor = Column(String, default="")

    transactions = relationship("Transaction", back_populates="item")

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

    item = relationship("Item", back_populates="transactions")

