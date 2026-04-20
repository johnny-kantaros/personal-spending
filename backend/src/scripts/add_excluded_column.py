"""
Migration script to add excluded column to transactions.
"""
from sqlalchemy import text
from src.db.db import SessionLocal


def add_excluded_column():
    db = SessionLocal()
    try:
        # Add column if it doesn't exist
        try:
            db.execute(text("ALTER TABLE transactions ADD COLUMN excluded BOOLEAN DEFAULT 0 NOT NULL"))
            db.commit()
            print("✓ Added excluded column")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("✓ Column excluded already exists")
            else:
                raise

    except Exception as e:
        db.rollback()
        print(f"✗ Error during migration: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    add_excluded_column()
