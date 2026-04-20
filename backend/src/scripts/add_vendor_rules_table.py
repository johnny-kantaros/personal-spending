"""
Migration script to add vendor_category_rules table.
"""
from sqlalchemy import text
from src.db.db import SessionLocal


def add_vendor_rules_table():
    db = SessionLocal()
    try:
        # Create table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS vendor_category_rules (
                id VARCHAR PRIMARY KEY,
                vendor_name VARCHAR NOT NULL UNIQUE,
                simplified_category VARCHAR NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))

        # Create index
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_vendor_name ON vendor_category_rules(vendor_name)
        """))

        db.commit()
        print("✓ Created vendor_category_rules table")

    except Exception as e:
        db.rollback()
        print(f"✗ Error during migration: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    add_vendor_rules_table()
