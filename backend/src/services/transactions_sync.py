# sync.py
from src.db.models import Item, Transaction
from src.services.plaid_client import plaid_client
from src.constants import get_simplified_category
from src.db.crud.vendor_rules import get_vendor_rule, get_vendor_name_from_transaction
from sqlalchemy.orm import Session
from plaid.model.transactions_sync_request import TransactionsSyncRequest
from plaid.model.transactions_sync_request_options import TransactionsSyncRequestOptions

def sync_transactions(item: Item, db: Session):
    cursor = item.cursor or ""
    has_more = True

    try:
        while has_more:
            # For initial sync (empty cursor), request more historical data
            options = None
            if not cursor:
                options = TransactionsSyncRequestOptions(
                    include_original_description=True,
                    days_requested=730  # Request up to 2 years of history
                )

            request = TransactionsSyncRequest(
                access_token=item.access_token,
                cursor=cursor,
                count=500,
                options=options
            )
            response = plaid_client.transactions_sync(request).to_dict()

            for tx in response.get("added", []) + response.get("modified", []):
                pf_category = tx.get("personal_finance_category") or {}
                primary = pf_category.get("primary")
                detailed = pf_category.get("detailed")

                # Determine simplified category (default to "Other" for uncategorized)
                default_category = get_simplified_category(primary, detailed) if primary else "Other"
                if default_category is None:
                    default_category = "Other"

                transaction = Transaction(
                    transaction_id=tx["transaction_id"],
                    item_id=item.id,
                    account_id=tx["account_id"],
                    amount=tx["amount"],
                    iso_currency_code=tx.get("iso_currency_code"),
                    name=tx.get("name"),
                    merchant_name=tx.get("merchant_name"),
                    merchant_entity_id=tx.get("merchant_entity_id"),
                    website=tx.get("website"),
                    logo_url=tx.get("logo_url"),

                    date=tx.get("date"),
                    authorized_date=tx.get("authorized_date"),
                    pending=tx.get("pending", False),

                    location=tx.get("location"),
                    payment_meta=tx.get("payment_meta"),
                    personal_finance_category=pf_category,
                    counterparties=tx.get("counterparties"),

                    primary_category=primary,
                    detailed_category=detailed,
                    simplified_category=default_category,
                )

                # Check for vendor rule override
                vendor_name = get_vendor_name_from_transaction(transaction)
                vendor_rule = get_vendor_rule(db, item.user_id, vendor_name)
                if vendor_rule:
                    transaction.simplified_category = vendor_rule.simplified_category

                db.merge(transaction)

            # Handle removed transactions
            for tx in response.get("removed", []):
                db.query(Transaction).filter_by(transaction_id=tx["transaction_id"]).delete()

            db.commit()

            cursor = response.get("next_cursor", "")
            has_more = response.get("has_more", False)
            if not cursor:
                has_more = False

        # Save updated cursor
        item.cursor = cursor
        db.add(item)
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
