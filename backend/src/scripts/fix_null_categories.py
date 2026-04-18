#!/usr/bin/env python
"""Set simplified_category to 'Other' for all NULL values"""
import sys
sys.path.insert(0, '.')

from src.db.db import SessionLocal
from src.db.models import Transaction

db = SessionLocal()

# Find all transactions with NULL simplified_category
null_cats = db.query(Transaction).filter(
    Transaction.simplified_category.is_(None)
).all()

print(f"Found {len(null_cats)} transactions with NULL simplified_category")

if null_cats:
    print("Updating to 'Other'...")
    for tx in null_cats:
        tx.simplified_category = "Other"

    db.commit()
    print(f"✅ Updated {len(null_cats)} transactions to 'Other'")
else:
    print("No updates needed")
