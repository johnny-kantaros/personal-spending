"""
Script to unlink all linked transactions (for cleanup).
"""
from src.db.db import SessionLocal
from src.db.models import Transaction


def unlink_all():
    db = SessionLocal()
    try:
        # Find all transactions that are linked
        linked = db.query(Transaction).filter(Transaction.linked_to_transaction_id.isnot(None)).all()
        print(f'Found {len(linked)} linked transactions')
        for t in linked:
            print(f'{t.transaction_id}: {t.name} (amount: {t.amount}) linked to {t.linked_to_transaction_id}')
            # Unlink them
            t.linked_to_transaction_id = None
        db.commit()
        print('✓ Unlinked all transactions')
    finally:
        db.close()


if __name__ == "__main__":
    unlink_all()
