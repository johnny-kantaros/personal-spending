#!/usr/bin/env python3
"""
Test script to check what date range is available from a Plaid Item
before actually reconnecting.

This queries Plaid's Item metadata to see transaction availability.
"""

from src.db.db import SessionLocal
from src.db.models import Item
from src.services.plaid_client import plaid_client
from plaid.model.item_get_request import ItemGetRequest


def check_item_dates():
    """Check available transaction date range for each item."""
    db = SessionLocal()

    try:
        items = db.query(Item).all()

        for item in items:
            print(f"\n{'='*60}")
            print(f"Institution: {item.institution_name or item.id}")
            print(f"{'='*60}")

            try:
                # Get item details
                request = ItemGetRequest(access_token=item.access_token)
                response = plaid_client.item_get(request)

                item_data = response.item

                print(f"Item ID: {item_data.item_id}")
                print(f"Institution ID: {item_data.institution_id}")

                # Check if there's available_products which shows what data we can access
                if hasattr(item_data, 'available_products'):
                    print(f"Available Products: {item_data.available_products}")

                if hasattr(item_data, 'billed_products'):
                    print(f"Billed Products: {item_data.billed_products}")

                # Note: Plaid doesn't directly expose "how far back can I go" in the API
                # The only way to know is to try syncing with days_requested
                print(f"\n💡 To test historical availability, you would need to:")
                print(f"   1. Disconnect this item")
                print(f"   2. Reconnect via Plaid Link")
                print(f"   3. Initial sync will fetch available history")

            except Exception as e:
                print(f"❌ Error checking {item.institution_name}: {str(e)}")

    finally:
        db.close()


if __name__ == "__main__":
    print("\n🔍 Checking Plaid Item Information\n")
    check_item_dates()

    print("\n" + "="*60)
    print("RECOMMENDATION:")
    print("="*60)
    print("""
To test if reconnecting provides more history:

1. Choose ONE institution (e.g., SoFi)
2. Note its current earliest transaction date
3. Delete the item from the database
4. Reconnect via the frontend "Add Bank" button
5. Check if earliest transaction date goes back further

If it works for one, it will work for all.
If it doesn't, reconnecting won't help.
    """)
