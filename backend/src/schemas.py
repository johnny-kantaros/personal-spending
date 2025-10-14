from datetime import date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class LocationSchema(BaseModel):
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    postal_code: Optional[str] = None
    region: Optional[str] = None
    store_number: Optional[str] = None


class PaymentMetaSchema(BaseModel):
    by_order_of: Optional[str] = None
    payee: Optional[str] = None
    payer: Optional[str] = None
    payment_method: Optional[str] = None
    payment_processor: Optional[str] = None
    ppd_id: Optional[str] = None
    reason: Optional[str] = None
    reference_number: Optional[str] = None


class PersonalFinanceCategorySchema(BaseModel):
    primary: Optional[str] = None
    detailed: Optional[str] = None
    confidence_level: Optional[str] = None
    version: Optional[str] = None


class CounterpartySchema(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    confidence_level: Optional[str] = None
    entity_id: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    phone_number: Optional[str] = None


class TransactionBase(BaseModel):
    transaction_id: str
    account_id: str
    item_id: str
    amount: float
    iso_currency_code: Optional[str] = None

    name: str
    merchant_name: Optional[str] = None
    merchant_entity_id: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None

    date: date
    authorized_date: Optional[date] = None
    pending: bool

    location: Optional[LocationSchema] = None
    payment_meta: Optional[PaymentMetaSchema] = None
    personal_finance_category: Optional[PersonalFinanceCategorySchema] = None
    counterparties: Optional[List[CounterpartySchema]] = None

    primary_category: Optional[str] = None
    detailed_category: Optional[str] = None

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "transaction_id": "Kgmm5KZgzzhLN8knj8nNh9oqwxLR8vhJj6RWr",
                "account_id": "VK995jrKeeCjpJaNAJNpSaJrlyeXmbU3dpqP4",
                "item_id": "item_123",
                "amount": -500.0,
                "iso_currency_code": "USD",
                "name": "United Airlines",
                "merchant_name": "United Airlines",
                "date": "2025-10-14",
                "pending": False,
                "personal_finance_category": {
                    "primary": "TRAVEL",
                    "detailed": "TRAVEL_FLIGHTS",
                    "confidence_level": "VERY_HIGH",
                },
                "logo_url": "https://plaid-merchant-logos.plaid.com/united_airlines_1065.png",
                "website": "united.com"
            }
        }


class LinkTokenRequest(BaseModel):
    user_id: str