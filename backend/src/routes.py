# routes.py

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from plaid.exceptions import ApiException
from plaid.model.transactions_sync_request import TransactionsSyncRequest
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
import os

from src.plaid_client import plaid_client
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

def format_error(e: ApiException):
    return {
        "status_code": e.status,
        "error": str(e.body)
    }


def fetch_transactions_for_token(access_token: str):
    cursor = ""
    added = []
    modified = []
    removed = []
    has_more = True

    while has_more:
        request = TransactionsSyncRequest(
            access_token=access_token,
            cursor=cursor
        )
        response = plaid_client.transactions_sync(request).to_dict()
        cursor = response.get("next_cursor", "")

        added.extend(response.get("added", []))
        modified.extend(response.get("modified", []))
        removed.extend(response.get("removed", []))
        has_more = response.get("has_more", False)

        # Avoid infinite loop if next_cursor doesn't change
        if cursor == "":
            has_more = False

    # Return 8 most recent transactions by date
    latest_transactions = sorted(added, key=lambda t: t["date"], reverse=True)[:100]
    return latest_transactions

@router.get("/transactions")
def get_transactions(
    items: Optional[List[str]] = Query(
        None,
        description="Optional list of item names (banks) to fetch transactions for, e.g. ?items=chase&items=sofi"
    )
):
    """
    Fetch transactions for specified items, or all items if none are specified.
    """
    try:
        result = {}
        # Determine which items to fetch
        if items:
            selected_items = [item.lower() for item in items]
        else:
            # default to all environment access tokens
            selected_items = [
                key.replace("_ACCESS_TOKEN", "").lower()
                for key in os.environ.keys()
                if key.endswith("_ACCESS_TOKEN")
            ]

        for item in selected_items:
            access_token = os.getenv(f"{item.upper()}_ACCESS_TOKEN")
            if not access_token:
                result[item] = {"error": f"Access token for '{item}' not found."}
                continue

            try:
                transactions = fetch_transactions_for_token(access_token)
                result[item] = transactions
            except ApiException as e:
                result[item] = {"error": format_error(e)}

        return result

    except ApiException as e:
        raise HTTPException(status_code=e.status, detail=format_error(e))

class LinkTokenRequest(BaseModel):
    user_id: str


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
        redirect_uri=os.getenv("PLAID_REDIRECT_URI_DEV"),
    )
    response = plaid_client.link_token_create(request)
    return response.to_dict()


class PublicTokenRequest(BaseModel):
    public_token: str


@router.post("/item/public_token/exchange")
def exchange_public_token(body: PublicTokenRequest):
    request = ItemPublicTokenExchangeRequest(public_token=body.public_token)
    response = plaid_client.item_public_token_exchange(request)
    return response.to_dict()


@router.get("/items")
def get_connected_items():
    """
    Returns a list of connected items (banks) with user-friendly names.
    """
    try:
        result = []

        for key, access_token in os.environ.items():
            if key.endswith("_ACCESS_TOKEN"):
                item_response = plaid_client.item_get({"access_token": access_token})
                institution_id = item_response.item.institution_id
                if institution_id:
                    # Get institution details
                    inst_response = plaid_client.institutions_get_by_id(
                        {"institution_id": institution_id, "country_codes": ["US"]}
                    )
                    inst_name = inst_response.institution.name
                else:
                    # Fallback to env variable name
                    inst_name = key.replace("_ACCESS_TOKEN", "").replace("_", " ").title()

                result.append({
                    "env_name": key.replace("_ACCESS_TOKEN", "").lower(),
                    "display_name": inst_name
                })

        return {"items": result}

    except ApiException as e:
        raise HTTPException(status_code=e.status, detail=format_error(e))