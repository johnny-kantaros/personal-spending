from typing import Optional, List

from sqlalchemy import select, extract, Sequence
from sqlalchemy.orm import joinedload
from sqlmodel import Session

from src.constants import EXCLUDE_CATEGORIES
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

    statement = statement.order_by(Transaction.date.desc())
    transactions = db.scalars(statement).all()
    return transactions