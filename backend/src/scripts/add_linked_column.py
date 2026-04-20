"""
Migration script to add linked_to_transaction_id column.
"""
from sqlalchemy import text
from src.db.db import SessionLocal


def add_linked_column():
    db = SessionLocal()
    try:
        # Add column if it doesn't exist
        try:
            db.execute(text("ALTER TABLE transactions ADD COLUMN linked_to_transaction_id VARCHAR"))
            db.commit()
            print("✓ Added linked_to_transaction_id column")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("✓ Column linked_to_transaction_id already exists")
            else:
                raise

    except Exception as e:
        db.rollback()
        print(f"✗ Error during migration: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    add_linked_column()
