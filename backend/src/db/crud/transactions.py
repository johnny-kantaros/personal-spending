from typing import Optional, List, Sequence

from sqlalchemy import select, extract, or_, and_, not_
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

    # Exclude categories, BUT allow person-to-person transfers (Venmo, Zelle, etc.)
    # Exclude only actual bank transfers (account-to-account)
    statement = statement.filter(
        or_(
            # Not in excluded categories
            and_(
                Transaction.primary_category.notin_(EXCLUDE_CATEGORIES),
                Transaction.detailed_category.notin_(EXCLUDE_DETAILED_CATEGORIES)
            ),
            # OR it's a Venmo P2P transfer (not bank transfer)
            and_(
                Item.institution_name.ilike('%venmo%'),
                Transaction.detailed_category != 'TRANSFER_OUT_ACCOUNT_TRANSFER',
                Transaction.name != 'Standard transfer'
            ),
            # OR it's any transfer/income with a person's name (exclude generic transfers)
            and_(
                or_(
                    Transaction.primary_category == 'TRANSFER_IN',
                    Transaction.primary_category == 'TRANSFER_OUT',
                    Transaction.primary_category == 'INCOME'
                ),
                Transaction.detailed_category != 'TRANSFER_OUT_ACCOUNT_TRANSFER',
                Transaction.detailed_category != 'TRANSFER_IN_ACCOUNT_TRANSFER',
                Transaction.detailed_category != 'INCOME_DIVIDENDS',
                Transaction.detailed_category != 'INCOME_INTEREST_EARNED',
                Transaction.detailed_category != 'INCOME_WAGES',
                # Exclude generic transfer names
                Transaction.name != 'Standard transfer',
                ~Transaction.name.like('Transfer %'),
                ~Transaction.name.like('Online Transfer%')
            )
        )
    )
    # Exclude transactions that are linked to another transaction
    statement = statement.filter(
        Transaction.linked_to_transaction_id.is_(None)
    )
    # Exclude manually excluded transactions
    statement = statement.filter(
        Transaction.excluded == False
    )

    # Exclude specific merchant patterns (Vault transfers, Kraken, IRS refunds, generic SoFi transfers)
    statement = statement.filter(
        ~Transaction.name.ilike('%Vault%'),
        ~Transaction.name.ilike('%Kraken%'),
        ~Transaction.name.ilike('IRS %'),
        Transaction.name != 'SoFi'  # Generic SoFi transfers (not merchant purchases)
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


def link_transaction(db: Session, payment_transaction_id: str, parent_transaction_id: str) -> Transaction:
    """
    Link a payment transaction (e.g., Venmo) to a parent transaction (e.g., dinner).
    """
    payment = db.query(Transaction).filter(Transaction.transaction_id == payment_transaction_id).first()
    if not payment:
        raise ValueError(f"Payment transaction {payment_transaction_id} not found")

    parent = db.query(Transaction).filter(Transaction.transaction_id == parent_transaction_id).first()
    if not parent:
        raise ValueError(f"Parent transaction {parent_transaction_id} not found")

    payment.linked_to_transaction_id = parent_transaction_id
    db.commit()
    db.refresh(payment)
    return payment


def unlink_transaction(db: Session, payment_transaction_id: str) -> Transaction:
    """
    Unlink a payment transaction from its parent.
    """
    payment = db.query(Transaction).filter(Transaction.transaction_id == payment_transaction_id).first()
    if not payment:
        raise ValueError(f"Payment transaction {payment_transaction_id} not found")

    payment.linked_to_transaction_id = None
    db.commit()
    db.refresh(payment)
    return payment


def get_linked_payments(db: Session, parent_transaction_id: str) -> Sequence[Transaction]:
    """
    Get all payment transactions linked to a parent transaction.
    """
    return db.query(Transaction).filter(
        Transaction.linked_to_transaction_id == parent_transaction_id
    ).all()


def exclude_transaction(db: Session, transaction_id: str) -> Transaction:
    """
    Mark a transaction as excluded from spending view.
    """
    transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not transaction:
        raise ValueError(f"Transaction {transaction_id} not found")

    transaction.excluded = True
    db.commit()
    db.refresh(transaction)
    return transaction


def unexclude_transaction(db: Session, transaction_id: str) -> Transaction:
    """
    Unmark a transaction as excluded.
    """
    transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not transaction:
        raise ValueError(f"Transaction {transaction_id} not found")

    transaction.excluded = False
    db.commit()
    db.refresh(transaction)
    return transaction