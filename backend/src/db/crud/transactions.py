from typing import Optional, List, Sequence

from sqlalchemy import select, extract
from sqlalchemy.orm import joinedload, Session

from src.constants import EXCLUDE_CATEGORIES, EXCLUDE_DETAILED_CATEGORIES
from src.db.models import Transaction, Item


def fetch_transactions_by_month(db: Session, month: Optional[int], year: Optional[int], item_ids: Optional[List[str]]) -> Sequence[Transaction]:

    statement =select(Transaction).join(Item).options(joinedload(Transaction.item))
    if item_ids:
        statement = statement.filter(Transaction.item_id.in_(item_ids))

    if month and year:
        statement = statement.filter(
            extract("year", Transaction.date) == year,
            extract("month", Transaction.date) == month,
        )

    statement = statement.filter(
        Transaction.primary_category.notin_(EXCLUDE_CATEGORIES)
    )
    statement = statement.filter(
        Transaction.detailed_category.notin_(EXCLUDE_DETAILED_CATEGORIES)
    )

    statement = statement.order_by(Transaction.date.desc())
    transactions = db.scalars(statement).all()
    return transactions


def update_transaction_category(db: Session, transaction_id: str, simplified_category: str) -> Transaction:
    """
    Update the simplified_category of a transaction.
    """
    transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not transaction:
        raise ValueError(f"Transaction {transaction_id} not found")

    transaction.simplified_category = simplified_category
    db.commit()
    db.refresh(transaction)
    return transaction