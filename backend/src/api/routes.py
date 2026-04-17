# routes.py
from typing import Optional, List, Sequence
from collections import defaultdict
import os

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from plaid.exceptions import ApiException
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from sqlalchemy.orm import Session, joinedload

from src.constants import EXCLUDE_CATEGORIES
from src.db.crud.item import add_item, get_items_by_ids
from src.db.crud.transactions import fetch_transactions_by_month
from src.db.db import SessionLocal
from src.db.models import Item
from src.schemas import TransactionBase, LinkTokenRequest
from src.services.plaid_client import plaid_client
from src.services.transactions_sync import sync_transactions
router = APIRouter()

def format_error(e: ApiException):
    return {
        "status_code": e.status,
        "error": str(e.body)
    }

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/transactions", response_model=List[TransactionBase])
def get_transactions(
    item_ids: Optional[List[str]] = Query(None),
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
):
    try:
        transactions = fetch_transactions_by_month(db=db, month=month, year=year, item_ids=item_ids)
        return [TransactionBase.model_validate(t) for t in transactions]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while fetching transactions")


@router.post("/link_token/create")
def create_link_token(body: LinkTokenRequest):
    environment = os.getenv("PLAID_ENV", "sandbox")
    redirect_uri = os.getenv("PLAID_REDIRECT_URI_PROD") if environment == "production" else os.getenv("PLAID_REDIRECT_URI_DEV")
    request = LinkTokenCreateRequest(
        user={"client_user_id": body.user_id},
        client_name="Johnny's Spending Tracker",
        products=[Products("transactions")],
        country_codes=[CountryCode("US")],
        language="en",
        redirect_uri=redirect_uri,
    )
    response = plaid_client.link_token_create(request)
    return response.to_dict()


class PublicTokenRequest(BaseModel):
    public_token: str


@router.post("/item/public_token/exchange")
def exchange_public_token(body: PublicTokenRequest, db: Session = Depends(get_db)):
    try:
        # Exchange the public_token for an access_token
        request = ItemPublicTokenExchangeRequest(public_token=body.public_token)
        response = plaid_client.item_public_token_exchange(request).to_dict()

        access_token = response.get("access_token")
        item_id = response.get("item_id")

        if not access_token or not item_id:
            raise HTTPException(status_code=500, detail="Invalid response from Plaid: missing access_token or item_id")

        # Fetch institution info for a human-readable name
        item_response = plaid_client.item_get({"access_token": access_token})
        institution_id = item_response.item.institution_id

        institution_name = None
        if institution_id:
            inst_response = plaid_client.institutions_get_by_id(
                {"institution_id": institution_id, "country_codes": ["US"]}
            )
            institution_name = inst_response.institution.name

        new_item: Item = add_item(
            item_id=item_id,
            access_token=access_token,
            institution_name=institution_name,
            db=db
        )

        sync_transactions(new_item, db)

        return {"message": "Item created successfully", "item": new_item.id}

    except ApiException as e:
        raise HTTPException(status_code=e.status, detail=format_error(e))



@router.get("/items")
def get_connected_items(db: Session = Depends(get_db)):
    """
    Returns a list of connected items (banks) stored in the database.
    """
    items = db.query(Item).options(joinedload(Item.transactions)).all()
    result = []

    for item in items:
        result.append({
            "id": item.id,
            "institution_name": item.institution_name or item.id
        })

    return {"items": result}

@router.post("/items/sync")
def sync_all_items(db: Session = Depends(get_db)):
    items = db.query(Item).options(joinedload(Item.transactions)).all()
    results = []

    for item in items:
        try:
            sync_transactions(item, db)
            results.append({
                "institution": item.institution_name or item.id,
                "status": "success"
            })
        except ApiException as e:
            results.append({
                "institution": item.institution_name or item.id,
                "status": "error",
                "error": f"Plaid API error: {e.status}"
            })
        except Exception as e:
            results.append({
                "institution": item.institution_name or item.id,
                "status": "error",
                "error": "Sync failed"
            })

    return {"results": results}

@router.get("/transactions/summary")
def get_monthly_summary(
    item_ids: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
):
    try:
        items: Sequence[Item] = get_items_by_ids(db=db, item_ids=item_ids)
        summary = defaultdict(lambda: defaultdict(float))

        for item in items:
            for t in item.transactions:
                if not t.date:
                    continue
                if t.primary_category and t.primary_category in EXCLUDE_CATEGORIES:
                    continue
                month_key = t.date.strftime("%Y-%m")  # e.g., "2025-10"
                category = t.primary_category or "Other"
                summary[month_key][category] += t.amount

        # Convert to list of dicts for easier frontend consumption
        result = [
            {
                "month": month,
                "categories": [{"name": cat, "total": total} for cat, total in cats.items()],
                "total": sum(cats.values()),
            }
            for month, cats in sorted(summary.items())
        ]

        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while generating summary")