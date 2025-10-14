# routes.py

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from plaid.exceptions import ApiException
from plaid.model.transactions_sync_request import TransactionsSyncRequest
import os
import time

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
        cursor = response["next_cursor"]

        if cursor == "":
            time.sleep(2)
            continue

        added.extend(response["added"])
        modified.extend(response["modified"])
        removed.extend(response["removed"])
        has_more = response["has_more"]

    latest_transactions = sorted(added, key=lambda t: t["date"])[-8:]
    return latest_transactions

@router.get("/transactions")
def get_transactions(
    item: Optional[str] = Query(None, description="Optional item name (bank) to fetch transactions for")
):
    """
    Fetch the 8 most recent transactions for a specific item (bank),
    or for all items if none is specified.
    """
    try:
        if item:
            access_token = os.getenv(f"{item.upper()}_access_token")
            if not access_token:
                raise HTTPException(status_code=404, detail=f"Access token for '{item}' not found.")
            transactions = fetch_transactions_for_token(access_token)
            return {item.lower(): transactions}
        else:
            result = {}
            for key, value in os.environ.items():
                if key.endswith("_ACCESS_TOKEN"):
                    item_name = key.replace("_access_token", "").lower()
                    try:
                        result[item_name] = fetch_transactions_for_token(value)
                    except ApiException as e:
                        result[item_name] = {"error": format_error(e)}
            return result

    except ApiException as e:
        raise HTTPException(status_code=e.status, detail=format_error(e))
