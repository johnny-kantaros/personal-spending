# routes.py

from typing import Optional
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
    latest_transactions = sorted(added, key=lambda t: t["date"], reverse=True)[:8]
    return latest_transactions


@router.get("/transactions")
def get_transactions(
    item: Optional[str] = Query(None, description="Optional item name (bank) to fetch transactions for")
):
    try:
        if item:
            access_token = os.getenv(f"{item.upper()}_ACCESS_TOKEN")
            if not access_token:
                raise HTTPException(status_code=404, detail=f"Access token for '{item}' not found.")
            transactions = fetch_transactions_for_token(access_token)
            return {item.lower(): transactions}

        else:
            result = {}
            for key, value in os.environ.items():
                if key.endswith("_ACCESS_TOKEN"):
                    item_name = key.replace("_ACCESS_TOKEN", "").lower()
                    try:
                        result[item_name] = fetch_transactions_for_token(value)
                    except ApiException as e:
                        result[item_name] = {"error": format_error(e)}
            return result

    except ApiException as e:
        raise HTTPException(status_code=e.status, detail=format_error(e))


class LinkTokenRequest(BaseModel):
    user_id: str


@router.post("/link_token/create")
def create_link_token(body: LinkTokenRequest):
    print("Received body:", body)
    request = LinkTokenCreateRequest(
        user={"client_user_id": body.user_id},
        client_name="Johnny's Spending Tracker",
        products=[Products("transactions")],
        country_codes=[CountryCode("US")],
        language="en",
        redirect_uri="https://spending-tracker.vercel.app/plaid/oauth-return",
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
