from fastapi import APIRouter, HTTPException
from urllib.parse import urlencode
import requests
from datetime import datetime, timedelta
from app.config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
from app.services.supabase_client import supabase

router = APIRouter()

def get_user_email(access_token: str) -> str:
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get("https://www.googleapis.com/oauth2/v2/userinfo", headers=headers)
    data = response.json()

    if "email" not in data:
        raise HTTPException(status_code=400, detail="Failed to fetch user email")
    
    return data["email"]

@router.get("/init/google")
def google_auth_redirect():
    query = urlencode({
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email",
        "access_type": "offline",
        "prompt": "consent"
    })
    return {"auth_url": f"https://accounts.google.com/o/oauth2/v2/auth?{query}"}

@router.get("/callback/google")
def google_oauth_callback(code: str):
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code"
    }

    token_response = requests.post(token_url, data=data)
    token_data = token_response.json()

    if "access_token" not in token_data:
        raise HTTPException(status_code=400, detail="Google OAuth failed")

    # Extract user email
    email = get_user_email(token_data["access_token"])

    # Optional: calculate expiration timestamp
    expires_in = token_data.get("expires_in", 3600)
    token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

    # Insert into Supabase
    supabase.table("email_configs").insert({
        "user_email": email,
        "provider": "gmail_oauth",
        "access_token": token_data["access_token"],
        "refresh_token": token_data.get("refresh_token"),
        "token_expires_at": token_expires_at.isoformat(),
        "is_active": True
    }).execute()

    return {"message": "Gmail OAuth token saved to Supabase!", "email": email}
