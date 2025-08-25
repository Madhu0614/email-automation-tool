from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.supabase_client import supabase
import requests
import base64
import os
from email.mime.text import MIMEText
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class EmailRequest(BaseModel):
    from_email: str  # Sender email
    to_email: str    # Recipient
    subject: str
    body: str


# ------------------ Gmail Helpers ------------------ #
def get_gmail_access_token(refresh_token: str) -> str:
    """Get fresh Gmail access token using refresh token"""
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "refresh_token": refresh_token,
        "grant_type": "refresh_token"
    }

    response = requests.post(token_url, data=data)
    if response.status_code != 200:
        logger.error(f"❌ Gmail token refresh failed: {response.text}")
        raise HTTPException(status_code=500, detail=f"Gmail token refresh failed: {response.text}")

    return response.json().get("access_token")


def send_via_gmail_oauth(refresh_token: str, from_email: str, to_email: str, subject: str, body: str) -> dict:
    """Send email using Gmail OAuth"""
    access_token = get_gmail_access_token(refresh_token)

    # Build MIME message
    message = MIMEText(body)
    message["to"] = to_email
    message["from"] = from_email
    message["subject"] = subject

    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

    gmail_api_url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    payload = {"raw": raw_message}

    gmail_response = requests.post(gmail_api_url, headers=headers, json=payload)

    if gmail_response.status_code not in [200, 202]:
        error_msg = f"Gmail API error {gmail_response.status_code}: {gmail_response.text}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}

    logger.info(f"✅ Gmail: Sent email to {to_email}")
    return {"success": True, "message": f"Gmail: Email sent to {to_email}"}


# ------------------ Microsoft (Outlook) Helpers ------------------ #
def get_outlook_access_token(refresh_token: str) -> str:
    """Get fresh Outlook (Microsoft) access token using refresh token"""
    token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
    data = {
        "client_id": os.getenv("MICROSOFT_CLIENT_ID"),   # ✅ fixed
        "client_secret": os.getenv("MICROSOFT_CLIENT_SECRET"),  # ✅ fixed
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
        "scope": "https://graph.microsoft.com/.default offline_access"
    }

    response = requests.post(token_url, data=data)
    if response.status_code != 200:
        logger.error(f"❌ Outlook token refresh failed: {response.text}")
        raise HTTPException(status_code=500, detail=f"Outlook token refresh failed: {response.text}")

    return response.json().get("access_token")


def send_via_outlook_oauth(refresh_token: str, from_email: str, to_email: str, subject: str, body: str) -> dict:
    """Send email using Outlook OAuth (Microsoft Graph API)"""
    access_token = get_outlook_access_token(refresh_token)

    outlook_api_url = "https://graph.microsoft.com/v1.0/me/sendMail"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "message": {
            "subject": subject,
            "body": {"contentType": "HTML", "content": body},
            "toRecipients": [{"emailAddress": {"address": to_email}}],
        }
    }

    outlook_response = requests.post(outlook_api_url, headers=headers, json=payload)

    if outlook_response.status_code not in [200, 202]:
        error_msg = f"Outlook API error {outlook_response.status_code}: {outlook_response.text}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}

    logger.info(f"✅ Outlook: Sent email to {to_email}")
    return {"success": True, "message": f"Outlook: Email sent to {to_email}"}


# ------------------ Unified Function ------------------ #
def send_email_via_config(from_email: str, to_email: str, subject: str, body: str) -> dict:
    """
    Look up provider in Supabase and send email accordingly.
    Supports: gmail_oauth, microsoft_oauth
    """
    try:
        # Fetch email config
        response = supabase.table("email_configs").select(
            "provider, refresh_token"
        ).eq("user_email", from_email).single().execute()

        if not response.data:
            error_msg = f"❌ Email config not found in Supabase for: {from_email}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}

        provider = response.data.get("provider")
        refresh_token = response.data.get("refresh_token")

        logger.info(f"📧 Sending email using provider={provider} for {from_email}")

        if provider == "gmail_oauth":
            return send_via_gmail_oauth(refresh_token, from_email, to_email, subject, body)

        elif provider == "microsoft_oauth":
            return send_via_outlook_oauth(refresh_token, from_email, to_email, subject, body)

        else:
            error_msg = f"❌ Unsupported provider: {provider}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}

    except Exception as e:
        logger.exception("❌ Unexpected error in send_email_via_config")
        return {"success": False, "error": str(e)}


# ------------------ FastAPI Route ------------------ #
@router.post("/send-email")
def send_email(request: EmailRequest):
    """
    API endpoint to send email via Gmail or Outlook OAuth.
    Provider is selected from Supabase email_configs.
    """
    result = send_email_via_config(
        from_email=request.from_email,
        to_email=request.to_email,
        subject=request.subject,
        body=request.body
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error"))

    return {"message": result.get("message", "✅ Email sent successfully")}
