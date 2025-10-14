# sync.py
from src.db.models import Item, Transaction
from src.services.plaid_client import plaid_client
from sqlalchemy.orm import Session
from plaid.model.transactions_sync_request import TransactionsSyncRequest

def sync_transactions(item: Item, db: Session):
    cursor = item.cursor or ""
    has_more = True

    while has_more:
        request = TransactionsSyncRequest(
            access_token=item.access_token,
            cursor=cursor,
            count=500
        )
        response = plaid_client.transactions_sync(request).to_dict()

        for tx in response.get("added", []) + response.get("modified", []):
            pf_category = tx.get("personal_finance_category") or {}
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

                primary_category=pf_category.get("primary"),
                detailed_category=pf_category.get("detailed"),
            )

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
