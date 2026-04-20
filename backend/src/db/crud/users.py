"""
CRUD operations for User model.
"""
from typing import Optional
from sqlalchemy.orm import Session
from src.db.models import User
from src.password_utils import hash_password, verify_password
import uuid


def create_user(db: Session, username: str, password: str, email: Optional[str] = None) -> User:
    """
    Create a new user.

    Args:
        db: Database session
        username: Unique username
        password: Plain text password (will be hashed)
        email: Optional email address

    Returns:
        Created User object

    Raises:
        ValueError: If username or email already exists
    """
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise ValueError(f"Username '{username}' already exists")

    # Check if email already exists (if provided)
    if email:
        existing_email = db.query(User).filter(User.email == email).first()
        if existing_email:
            raise ValueError(f"Email '{email}' already exists")

    # Create new user with hashed password
    hashed_password = hash_password(password)
    user = User(
        id=str(uuid.uuid4()),
        username=username,
        email=email,
        hashed_password=hashed_password
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """
    Get a user by username.

    Args:
        db: Database session
        username: Username to search for

    Returns:
        User object if found, None otherwise
    """
    return db.query(User).filter(User.username == username).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """
    Get a user by ID.

    Args:
        db: Database session
        user_id: User ID to search for

    Returns:
        User object if found, None otherwise
    """
    return db.query(User).filter(User.id == user_id).first()


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """
    Authenticate a user by username and password.

    Args:
        db: Database session
        username: Username
        password: Plain text password

    Returns:
        User object if authentication succeeds, None otherwise
    """
    user = get_user_by_username(db, username)
    if not user:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    return user


def update_user_password(db: Session, user_id: str, new_password: str) -> User:
    """
    Update a user's password.

    Args:
        db: Database session
        user_id: User ID
        new_password: New plain text password (will be hashed)

    Returns:
        Updated User object

    Raises:
        ValueError: If user not found
    """
    user = get_user_by_id(db, user_id)
    if not user:
        raise ValueError(f"User with id '{user_id}' not found")

    user.hashed_password = hash_password(new_password)
    db.commit()
    db.refresh(user)

    return user
