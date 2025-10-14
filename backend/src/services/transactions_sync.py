# sync.py
from plaid.model.transactions_sync_request import TransactionsSyncRequest
from src.db.models import Item, Transaction
from src.services.plaid_client import plaid_client
from sqlalchemy.orm import Session

def sync_transactions(item: Item, db: Session):
    cursor = item.cursor or ""
    has_more = True

    while has_more:
        request = TransactionsSyncRequest(access_token=item.access_token, cursor=cursor, count=500)
        response = plaid_client.transactions_sync(request).to_dict()

        # Process added
        for tx in response.get("added", []):
            category = (tx.get("category") or [None])[0]
            transaction = Transaction(
                transaction_id=tx["transaction_id"],
                item_id=item.id,
                account_id=tx["account_id"],
                amount=tx["amount"],
                date=tx["date"],
                category=category,
                name=tx["name"],
                pending=tx["pending"]
            )
            db.merge(transaction)

        # Process modified
        for tx in response.get("modified", []):
            db.merge(Transaction(
                transaction_id=tx["transaction_id"],
                item_id=item.id,
                account_id=tx["account_id"],
                amount=tx["amount"],
                date=tx["date"],
                category=tx.get("category", [None])[0],
                name=tx["name"],
                pending=tx["pending"]
            ))

        # Process removed
        for tx in response.get("removed", []):
            db.query(Transaction).filter_by(transaction_id=tx["transaction_id"]).delete()

        db.commit()

        cursor = response.get("next_cursor", "")
        has_more = response.get("has_more", False)
        if cursor == "":
            has_more = False

    # Save latest cursor
    item.cursor = cursor
    db.add(item)
    db.commit()
