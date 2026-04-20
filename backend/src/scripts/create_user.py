#!/usr/bin/env python3
"""
Script to manually create users or update user passwords.
Run from the backend directory: python src/scripts/create_user.py
"""
import sys
import os
import getpass
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.db.db import SessionLocal
from src.db.crud.users import create_user, get_user_by_username, update_user_password


def main():
    """Interactive script to create or update users."""
    print("=== User Management Script ===\n")

    db = SessionLocal()

    try:
        # Ask for username
        username = input("Enter username: ").strip()
        if not username:
            print("❌ Username cannot be empty")
            return

        # Check if user already exists
        existing_user = get_user_by_username(db, username)

        if existing_user:
            print(f"\n⚠️  User '{username}' already exists.")
            update = input("Do you want to update their password? (y/n): ").strip().lower()

            if update == 'y':
                password = getpass.getpass("Enter new password: ")
                password_confirm = getpass.getpass("Confirm new password: ")

                if password != password_confirm:
                    print("❌ Passwords do not match")
                    return

                if len(password) < 8:
                    print("❌ Password must be at least 8 characters")
                    return

                update_user_password(db, existing_user.id, password)
                print(f"✅ Password updated for user '{username}'")
            else:
                print("Cancelled")
        else:
            # Create new user
            print(f"\nCreating new user '{username}'")

            # Ask for optional email
            email = input("Enter email (optional, press Enter to skip): ").strip()
            if email == "":
                email = None

            # Get password
            password = getpass.getpass("Enter password: ")
            password_confirm = getpass.getpass("Confirm password: ")

            if password != password_confirm:
                print("❌ Passwords do not match")
                return

            if len(password) < 8:
                print("❌ Password must be at least 8 characters")
                return

            # Create user
            user = create_user(db, username, password, email)
            print(f"✅ User created successfully!")
            print(f"   Username: {user.username}")
            if user.email:
                print(f"   Email: {user.email}")
            print(f"   User ID: {user.id}")

    except ValueError as e:
        print(f"❌ Error: {e}")
    except KeyboardInterrupt:
        print("\n\nCancelled")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
