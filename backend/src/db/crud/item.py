from typing import List, Sequence

from sqlalchemy import select
from sqlalchemy.orm import joinedload, Session

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

def get_items_by_ids(db: Session, item_ids: List[str]) -> Sequence[Item]:
    statement = select(Item).options(joinedload(Item.transactions))
    if item_ids:
        statement = statement.filter(Item.id.in_(item_ids))
    result = db.execute(statement).unique().scalars().all()
    return result