#!/usr/bin/env python3
"""
Test if /transactions/get endpoint provides more historical data than /transactions/sync
"""

from datetime import datetime, timedelta
from src.db.db import SessionLocal
from src.db.models import Item
from src.services.plaid_client import plaid_client
from plaid.model.transactions_get_request import TransactionsGetRequest


def test_transactions_get():
    """Test how far back we can fetch with /transactions/get endpoint."""
    db = SessionLocal()

    try:
        # Get first item (SoFi)
        item = db.query(Item).filter(Item.institution_name == "SoFi").first()

        if not item:
            print("❌ No SoFi item found")
            return

        print(f"Testing with: {item.institution_name}")
        print(f"Current earliest transaction: 2026-01-17\n")

        # Try requesting 2 years back
        end_date = datetime.now().date()
        start_date = (datetime.now() - timedelta(days=730)).date()

        print(f"Requesting transactions from {start_date} to {end_date}")
        print("(This is 2 years back from today)\n")

        try:
            request = TransactionsGetRequest(
                access_token=item.access_token,
                start_date=start_date,
                end_date=end_date,
            )

            response = plaid_client.transactions_get(request)
            transactions = response.transactions

            if transactions:
                dates = [t.date for t in transactions if t.date]
                if dates:
                    earliest = min(dates)
                    latest = max(dates)

                    print(f"✅ SUCCESS! Retrieved {len(transactions)} transactions")
                    print(f"📅 Date range: {earliest} to {latest}")

                    if earliest < datetime(2026, 1, 17).date():
                        print(f"\n🎉 GOOD NEWS! We can get data before January 17!")
                        print(f"   We can fetch back to: {earliest}")
                        print(f"\n💡 Recommendation: Implement a backfill using /transactions/get")
                    else:
                        print(f"\n😔 Unfortunately, {earliest} is still the earliest available.")
                        print(f"   This confirms the 90-day limit is enforced by Plaid/Institution.")
                else:
                    print("⚠️  No dates found in transactions")
            else:
                print("⚠️  No transactions returned")

        except Exception as e:
            error_msg = str(e)
            print(f"❌ Error: {error_msg}")

            if "INVALID_FIELD" in error_msg or "date" in error_msg.lower():
                print("\n💡 The date range might be too far back for this institution.")
            elif "PRODUCT_NOT_READY" in error_msg:
                print("\n💡 Transactions product might still be initializing.")

    finally:
        db.close()


if __name__ == "__main__":
    print("="*60)
    print("TESTING /transactions/get ENDPOINT")
    print("="*60)
    print()
    test_transactions_get()
