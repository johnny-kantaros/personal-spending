#!/usr/bin/env python3
"""
Backfill script to re-sync existing Items with more historical data.

This script resets the cursor for each Item to empty string, then re-runs sync_transactions
with the updated logic that requests 2 years of history on initial sync.

Usage:
    python backfill_transactions.py
"""

from src.db.db import SessionLocal
from src.db.models import Item
from src.services.transactions_sync import sync_transactions


def backfill_all_items():
    """Reset cursors and re-sync all items to fetch more historical data."""
    db = SessionLocal()

    try:
        items = db.query(Item).all()

        if not items:
            print("No items found in database.")
            return

        print(f"Found {len(items)} item(s) to backfill.")

        for item in items:
            print(f"\nBackfilling: {item.institution_name or item.id}")
            print(f"  Current cursor: {item.cursor[:50] if item.cursor else 'empty'}...")

            # Reset cursor to trigger initial sync with 2-year lookback
            item.cursor = ""
            db.add(item)
            db.commit()

            print(f"  Reset cursor. Starting sync with 730-day lookback...")

            try:
                sync_transactions(item, db)
                print(f"  ✅ Successfully synced {item.institution_name}")
            except Exception as e:
                print(f"  ❌ Error syncing {item.institution_name}: {str(e)}")
                db.rollback()
                continue

        print("\n🎉 Backfill complete!")

        # Show results
        from sqlalchemy import func
        from src.db.models import Transaction

        result = db.query(
            func.min(Transaction.date).label('earliest'),
            func.max(Transaction.date).label('latest'),
            func.count(Transaction.transaction_id).label('count')
        ).first()

        print(f"\nTransaction Summary:")
        print(f"  Earliest: {result.earliest}")
        print(f"  Latest: {result.latest}")
        print(f"  Total: {result.count}")

    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("BACKFILL TRANSACTIONS - Fetch 2 Years of Historical Data")
    print("=" * 60)

    response = input("\nThis will reset cursors and re-sync all Items. Continue? (yes/no): ")

    if response.lower() in ['yes', 'y']:
        backfill_all_items()
    else:
        print("Cancelled.")
