from typing import Optional
from sqlalchemy.orm import Session
from src.db.models import VendorCategoryRule, Transaction
import uuid


def get_vendor_rule(db: Session, vendor_name: str) -> Optional[VendorCategoryRule]:
    """Get the category rule for a vendor."""
    return db.query(VendorCategoryRule).filter(
        VendorCategoryRule.vendor_name == vendor_name
    ).first()


def create_or_update_vendor_rule(db: Session, vendor_name: str, simplified_category: str) -> VendorCategoryRule:
    """Create or update a vendor category rule."""
    existing = get_vendor_rule(db, vendor_name)

    if existing:
        existing.simplified_category = simplified_category
        db.commit()
        db.refresh(existing)
        return existing
    else:
        rule = VendorCategoryRule(
            id=str(uuid.uuid4()),
            vendor_name=vendor_name,
            simplified_category=simplified_category
        )
        db.add(rule)
        db.commit()
        db.refresh(rule)
        return rule


def apply_vendor_rule_to_transactions(db: Session, vendor_name: str, simplified_category: str) -> int:
    """Apply a specific vendor rule to existing transactions. Returns count of updated transactions."""
    # Update all transactions matching this vendor
    transactions = db.query(Transaction).filter(
        (Transaction.merchant_name == vendor_name) | (Transaction.name == vendor_name)
    ).all()

    updated_count = 0
    for t in transactions:
        t.simplified_category = simplified_category
        updated_count += 1

    db.commit()
    return updated_count


def apply_vendor_rules_to_all_transactions(db: Session) -> int:
    """Apply all vendor rules to existing transactions. Returns count of updated transactions."""
    rules = db.query(VendorCategoryRule).all()
    updated_count = 0

    for rule in rules:
        # Update all transactions matching this vendor
        transactions = db.query(Transaction).filter(
            (Transaction.merchant_name == rule.vendor_name) | (Transaction.name == rule.vendor_name)
        ).all()

        for t in transactions:
            t.simplified_category = rule.simplified_category
            updated_count += 1

    db.commit()
    return updated_count


def get_vendor_name_from_transaction(transaction: Transaction) -> str:
    """Get the canonical vendor name for a transaction (prefer merchant_name over name)."""
    return transaction.merchant_name or transaction.name
