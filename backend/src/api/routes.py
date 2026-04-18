# routes.py
from typing import Optional, List, Sequence
from collections import defaultdict
import os

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from plaid.exceptions import ApiException
from src.auth import verify_token, verify_login_credentials, create_access_token, LoginRequest, TokenResponse
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from sqlalchemy.orm import Session, joinedload

from src.constants import EXCLUDE_CATEGORIES, EXCLUDE_DETAILED_CATEGORIES
from src.db.crud.item import add_item, get_items_by_ids
from src.db.crud.transactions import (
    fetch_transactions_by_month,
    update_transaction_category,
    link_transaction,
    unlink_transaction,
    get_linked_payments,
    exclude_transaction,
    unexclude_transaction
)
from src.db.crud.vendor_rules import (
    create_or_update_vendor_rule,
    apply_vendor_rule_to_transactions,
    get_vendor_name_from_transaction
)
from src.db.models import Transaction
from src.db.db import SessionLocal
from src.db.models import Item
from src.schemas import TransactionBase, LinkTokenRequest
from src.services.plaid_client import plaid_client
from src.services.transactions_sync import sync_transactions
router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(login_request: LoginRequest):
    """
    Login endpoint - returns JWT token if credentials are valid.
    """
    if not verify_login_credentials(login_request.username, login_request.password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )

    access_token = create_access_token(login_request.username)
    return TokenResponse(access_token=access_token)

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
    current_user: str = Depends(verify_token),
):
    try:
        transactions = fetch_transactions_by_month(db=db, month=month, year=year, item_ids=item_ids)
        return [TransactionBase.model_validate(t) for t in transactions]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while fetching transactions")


@router.post("/link_token/create")
def create_link_token(body: LinkTokenRequest, current_user: str = Depends(verify_token)):
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
def exchange_public_token(body: PublicTokenRequest, db: Session = Depends(get_db), current_user: str = Depends(verify_token)):
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
def get_connected_items(db: Session = Depends(get_db), current_user: str = Depends(verify_token)):
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
def sync_all_items(db: Session = Depends(get_db), current_user: str = Depends(verify_token)):
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
    current_user: str = Depends(verify_token),
):
    try:
        items: Sequence[Item] = get_items_by_ids(db=db, item_ids=item_ids)
        summary = defaultdict(lambda: defaultdict(float))

        for item in items:
            for t in item.transactions:
                if not t.date:
                    continue
                # Skip excluded categories
                if t.primary_category and t.primary_category in EXCLUDE_CATEGORIES:
                    continue
                if t.detailed_category and t.detailed_category in EXCLUDE_DETAILED_CATEGORIES:
                    continue
                # Skip if no simplified category (shouldn't happen but be safe)
                if not t.simplified_category:
                    continue
                # Skip linked transactions (they're already subtracted from parent)
                if t.linked_to_transaction_id:
                    continue
                # Skip excluded transactions
                if t.excluded:
                    continue

                month_key = t.date.strftime("%Y-%m")  # e.g., "2025-10"
                category = t.simplified_category

                # Calculate adjusted amount (original - linked payments)
                # t.amount = 172 (positive = spending), linked = -100 (negative = income)
                # We want: 172 - 100 = 72
                linked_payments = get_linked_payments(db=db, parent_transaction_id=t.transaction_id)
                linked_total = sum(abs(p.amount) for p in linked_payments)
                adjusted_amount = t.amount - linked_total

                summary[month_key][category] += adjusted_amount

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


class UpdateCategoryRequest(BaseModel):
    simplified_category: str


@router.patch("/transactions/{transaction_id}/category")
def update_category(
    transaction_id: str,
    body: UpdateCategoryRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token),
):
    """
    Update the simplified category for a transaction.
    """
    try:
        transaction = update_transaction_category(
            db=db,
            transaction_id=transaction_id,
            simplified_category=body.simplified_category
        )
        return TransactionBase.model_validate(transaction)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while updating category")


class LinkTransactionRequest(BaseModel):
    parent_transaction_id: str


@router.post("/transactions/{transaction_id}/link")
def link_payment(
    transaction_id: str,
    body: LinkTransactionRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token),
):
    """
    Link a payment transaction to a parent transaction (e.g., Venmo to dinner).
    """
    try:
        transaction = link_transaction(
            db=db,
            payment_transaction_id=transaction_id,
            parent_transaction_id=body.parent_transaction_id
        )
        return TransactionBase.model_validate(transaction)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while linking transaction")


@router.post("/transactions/{transaction_id}/unlink")
def unlink_payment(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token),
):
    """
    Unlink a payment transaction from its parent.
    """
    try:
        transaction = unlink_transaction(
            db=db,
            payment_transaction_id=transaction_id
        )
        return TransactionBase.model_validate(transaction)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while unlinking transaction")


@router.get("/transactions/{transaction_id}/linked")
def get_linked(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token),
):
    """
    Get all payment transactions linked to a parent transaction.
    """
    try:
        linked = get_linked_payments(db=db, parent_transaction_id=transaction_id)
        return [TransactionBase.model_validate(t) for t in linked]
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while fetching linked transactions")


class SetVendorRuleRequest(BaseModel):
    simplified_category: str


@router.post("/transactions/{transaction_id}/set-vendor-rule")
def set_vendor_rule(
    transaction_id: str,
    body: SetVendorRuleRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token),
):
    """
    Set a vendor category rule based on a transaction's merchant.
    Applies to all existing and future transactions from this vendor.
    """
    try:
        # Get the transaction to extract vendor name
        transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")

        vendor_name = get_vendor_name_from_transaction(transaction)

        # Create or update the rule
        rule = create_or_update_vendor_rule(
            db=db,
            vendor_name=vendor_name,
            simplified_category=body.simplified_category
        )

        # Apply to all existing transactions from this specific vendor
        updated_count = apply_vendor_rule_to_transactions(
            db=db,
            vendor_name=vendor_name,
            simplified_category=body.simplified_category
        )

        return {
            "message": f"Vendor rule set for '{vendor_name}'",
            "vendor_name": vendor_name,
            "category": body.simplified_category,
            "transactions_updated": updated_count
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while setting vendor rule: {str(e)}")


@router.post("/transactions/{transaction_id}/exclude")
def exclude_transaction_endpoint(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token),
):
    """
    Exclude a transaction from spending view.
    """
    try:
        transaction = exclude_transaction(db=db, transaction_id=transaction_id)
        return TransactionBase.model_validate(transaction)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while excluding transaction")


@router.post("/transactions/{transaction_id}/unexclude")
def unexclude_transaction_endpoint(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token),
):
    """
    Unexclude a transaction (restore to spending view).
    """
    try:
        transaction = unexclude_transaction(db=db, transaction_id=transaction_id)
        return TransactionBase.model_validate(transaction)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while unexcluding transaction")