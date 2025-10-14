from sqlmodel import Session

from src.db.models import Item


def add_item(item_id: str, access_token: str, institution_name: str, db: Session) -> Item:
    new_item = Item(
        id=item_id,
        access_token=access_token,
        institution_name=institution_name,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item