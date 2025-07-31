from fastapi import APIRouter, HTTPException
import requests
from app.config import MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_REDIRECT_URI
from app.services.supabase_client import supabase

router = APIRouter()

@router.get("/login/microsoft")
async def login_microsoft():
    scope = "openid offline_access Mail.Send email User.Read"
    auth_url = (
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
        f"?client_id={MICROSOFT_CLIENT_ID}"
        f"&redirect_uri={MICROSOFT_REDIRECT_URI}"
        "&response_type=code"
        "&response_mode=query"
        f"&scope={scope}"
        "&state=12345"
    )
    return {"auth_url": auth_url}

@router.get("/emails/ids")
async def list_email_config_ids():
    response = supabase.table("email_configs").select("id").execute()
    if response.error:
        raise HTTPException(status_code=500, detail=f"Error fetching IDs: {response.error.message}")
    ids = [record["id"] for record in response.data]
    return {"ids": ids}


@router.get("/callback/microsoft")
async def microsoft_callback(code: str):
    token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
    data = {
        "client_id": MICROSOFT_CLIENT_ID,
        "client_secret": MICROSOFT_CLIENT_SECRET,
        "code": code,
        "redirect_uri": MICROSOFT_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    token_response = requests.post(token_url, data=data, headers=headers)
    token_data = token_response.json()

    if "access_token" not in token_data:
        raise HTTPException(status_code=400, detail=f"Microsoft OAuth failed: {token_data}")

    access_token = token_data["access_token"]

    # Fetch user info from Microsoft Graph API
    user_info_response = requests.get(
        "https://graph.microsoft.com/v1.0/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    user_info = user_info_response.json()

    if "mail" not in user_info and "userPrincipalName" not in user_info:
        raise HTTPException(status_code=400, detail="Failed to retrieve email from Microsoft")

    email = user_info.get("mail") or user_info.get("userPrincipalName")

    # Save to Supabase
    supabase.table("email_configs").insert({
        "provider": "microsoft_oauth",
        "user_email": email,
        "access_token": token_data["access_token"],
        "refresh_token": token_data.get("refresh_token"),
        "token_expires_at": None  # Microsoft does not return expires_at timestamp
    }).execute()

    return {
        "message": "Microsoft OAuth tokens saved successfully",
        "email": email,
        "provider": "microsoft_oauth"
    }
