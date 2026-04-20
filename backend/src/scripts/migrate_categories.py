"""
Migration script to add simplified_category column and populate it for existing transactions.
"""
from sqlalchemy import text
from src.db.db import SessionLocal
from src.db.models import Transaction
from src.constants import get_simplified_category


def migrate_categories():
    db = SessionLocal()
    try:
        # Add column if it doesn't exist (SQLite ALTER TABLE)
        try:
            db.execute(text("ALTER TABLE transactions ADD COLUMN simplified_category VARCHAR"))
            db.commit()
            print("✓ Added simplified_category column")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("✓ Column simplified_category already exists")
            else:
                raise

        # Populate simplified_category for all existing transactions
        transactions = db.query(Transaction).all()
        updated = 0

        for t in transactions:
            if t.primary_category:
                simplified = get_simplified_category(t.primary_category, t.detailed_category)
                t.simplified_category = simplified
                updated += 1

        db.commit()
        print(f"✓ Updated {updated} transactions with simplified categories")

    except Exception as e:
        db.rollback()
        print(f"✗ Error during migration: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate_categories()
