import os
from plaid import ApiClient, Configuration, Environment
from plaid.api import plaid_api
from dotenv import load_dotenv

load_dotenv()

PLAID_ENV = os.getenv("PLAID_ENV", "sandbox")
PLAID_CLIENT_ID = os.getenv("PLAID_CLIENT_ID")
PLAID_SECRET = os.getenv("PLAID_SECRET_PRODUCTION") if PLAID_ENV == "production" else os.getenv("PLAID_SECRET_SANDBOX")

# Validate required environment variables
if not PLAID_CLIENT_ID:
    raise ValueError("PLAID_CLIENT_ID environment variable is required but not set")
if not PLAID_SECRET:
    raise ValueError(f"PLAID_SECRET environment variable is required but not set (looking for PLAID_SECRET_{'PRODUCTION' if PLAID_ENV == 'production' else 'SANDBOX'})")

# Set Plaid host
host = {
    "sandbox": Environment.Sandbox,
    "production": Environment.Production,
}.get(PLAID_ENV, Environment.Sandbox)

# Configure Plaid client
configuration = Configuration(
    host=host,
    api_key={
        "clientId": PLAID_CLIENT_ID,
        "secret": PLAID_SECRET,
        "plaidVersion": "2020-09-14",
    },
)

api_client = ApiClient(configuration)
plaid_client = plaid_api.PlaidApi(api_client)