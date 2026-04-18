"""
Simple HTTP Basic Authentication for the API.
"""
import os
import secrets
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials

security = HTTPBasic()


def verify_credentials(credentials: HTTPBasicCredentials = Depends(security)) -> str:
    """
    Verify HTTP Basic Auth credentials.
    Compares against AUTH_USERNAME and AUTH_PASSWORD environment variables.
    """
    username = os.getenv("AUTH_USERNAME", "admin")
    password = os.getenv("AUTH_PASSWORD", "changeme")

    correct_username = secrets.compare_digest(credentials.username.encode("utf8"), username.encode("utf8"))
    correct_password = secrets.compare_digest(credentials.password.encode("utf8"), password.encode("utf8"))

    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )

    return credentials.username
