"""
Migration script to add users table and user_id foreign keys.
This migrates the existing single-user database to support multiple users.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy import text
from src.db.db import engine, SessionLocal
from src.db.models import Base, User
import uuid

def run_migration():
    """Run the migration to add users table and foreign keys."""

    with engine.begin() as conn:
        print("Starting migration...")

        # Create users table
        print("Creating users table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE,
                hashed_password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))

        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_username ON users(username)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_email ON users(email)"))

        # Create a default user for existing data
        print("Creating default user for existing data...")
        default_user_id = str(uuid.uuid4())
        default_username = os.getenv("AUTH_USERNAME", "admin")

        # Check if user already exists
        result = conn.execute(text("SELECT id FROM users WHERE username = :username"),
                            {"username": default_username})
        existing_user = result.fetchone()

        if existing_user:
            default_user_id = existing_user[0]
            print(f"Default user '{default_username}' already exists with id: {default_user_id}")
        else:
            # Note: You'll need to set a real password using the create_user.py script
            conn.execute(text("""
                INSERT INTO users (id, username, email, hashed_password, created_at)
                VALUES (:id, :username, NULL, :hashed_password, CURRENT_TIMESTAMP)
            """), {
                "id": default_user_id,
                "username": default_username,
                "hashed_password": "CHANGE_ME_RUN_create_user_script"
            })
            print(f"Created default user '{default_username}' with id: {default_user_id}")
            print("⚠️  WARNING: Default password is placeholder. Run create_user.py to set a real password!")

        # Add user_id column to items table
        print("Adding user_id column to items table...")
        try:
            conn.execute(text("ALTER TABLE items ADD COLUMN user_id TEXT"))
        except Exception as e:
            print(f"Column might already exist: {e}")

        # Set default user_id for existing items
        print(f"Assigning existing items to default user...")
        conn.execute(text("""
            UPDATE items
            SET user_id = :user_id
            WHERE user_id IS NULL
        """), {"user_id": default_user_id})

        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_items_user_id ON items(user_id)"))

        # Add user_id column to vendor_category_rules table
        print("Adding user_id column to vendor_category_rules table...")
        try:
            conn.execute(text("ALTER TABLE vendor_category_rules ADD COLUMN user_id TEXT"))
        except Exception as e:
            print(f"Column might already exist: {e}")

        # Set default user_id for existing vendor rules
        print(f"Assigning existing vendor rules to default user...")
        conn.execute(text("""
            UPDATE vendor_category_rules
            SET user_id = :user_id
            WHERE user_id IS NULL
        """), {"user_id": default_user_id})

        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_vendor_rules_user_id ON vendor_category_rules(user_id)"))

        # Drop old unique constraint on vendor_name and create new composite unique constraint
        print("Updating vendor_category_rules indexes...")
        try:
            # SQLite doesn't support DROP INDEX IF EXISTS with same syntax, so try-catch
            conn.execute(text("DROP INDEX ix_vendor_name"))
        except:
            pass

        conn.execute(text("""
            CREATE UNIQUE INDEX IF NOT EXISTS ix_vendor_user_name
            ON vendor_category_rules(user_id, vendor_name)
        """))

        print("✅ Migration completed successfully!")
        print(f"\nNext steps:")
        print(f"1. Run 'python backend/src/scripts/create_user.py' to set a password for '{default_username}'")
        print(f"2. Or create new users with that script")

if __name__ == "__main__":
    run_migration()
