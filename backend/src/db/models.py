from sqlalchemy import Column, String, DateTime, Float, Boolean, ForeignKey
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
    item_id = Column(String, ForeignKey("items.id"))
    account_id = Column(String)
    amount = Column(Float)
    date = Column(DateTime)
    name = Column(String)
    category = Column(String, nullable=True)
    pending = Column(Boolean)

    item = relationship("Item", back_populates="transactions")
