from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.supabase_client import supabase
import requests
import base64
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
import ssl
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class EmailRequest(BaseModel):
    from_email: str  # Sender email
    to_email: str    # Recipient
    subject: str
    body: str


def get_gmail_access_token(refresh_token: str):
    """Get fresh Gmail API access token using refresh token"""
    try:
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        
        response = requests.post(token_url, data=data)
        if response.status_code != 200:
            logger.error(f"Token refresh failed: {response.text}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get access token: {response.text}"
            )
        return response.json().get("access_token")
    except Exception as e:
        logger.error(f"Error refreshing token: {e}")
        raise HTTPException(status_code=500, detail=f"Token refresh error: {str(e)}")


def send_via_gmail_api(request: EmailRequest, refresh_token: str):
    """Send email using Gmail API"""
    access_token = get_gmail_access_token(refresh_token)

    message = MIMEText(request.body)
    message["to"] = request.to_email
    message["from"] = request.from_email
    message["subject"] = request.subject

    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

    gmail_api_url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    payload = {"raw": raw_message}

    gmail_response = requests.post(gmail_api_url, headers=headers, json=payload)

    if gmail_response.status_code not in [200, 202]:
        logger.error(f"Gmail API error: {gmail_response.text}")
        raise HTTPException(
            status_code=500,
            detail=f"Gmail API error: {gmail_response.text}"
        )

    logger.info("Email sent successfully via Gmail API")
    return {"message": "✅ Email sent successfully via Gmail API"}


def send_via_smtp(request: EmailRequest, config: dict):
    """Send email using SMTP"""
    smtp_host = config["smtp_host"]
    smtp_port = config["smtp_port"]
    smtp_username = config["smtp_username"]
    smtp_password = config["smtp_password"]
    use_ssl = config.get("use_ssl", False)
    use_tls = config.get("use_tls", False)

    message = MIMEMultipart()
    message["From"] = request.from_email
    message["To"] = request.to_email
    message["Subject"] = request.subject
    message.attach(MIMEText(request.body, "plain"))

    if use_ssl and int(smtp_port) == 465:
        logger.info("Using SMTP over SSL")
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context) as server:
            server.login(smtp_username, smtp_password)
            server.sendmail(request.from_email, request.to_email, message.as_string())
    else:
        logger.info("Using SMTP with STARTTLS")
        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            if use_tls:
                server.starttls(context=context)
            server.login(smtp_username, smtp_password)
            server.sendmail(request.from_email, request.to_email, message.as_string())

    logger.info("Email sent successfully via SMTP")
    return {"message": "✅ Email sent successfully via SMTP"}


@router.post("/send-email")
def send_email(request: EmailRequest):
    try:
        logger.info(f"Sending email from {request.from_email} to {request.to_email}")

        response = supabase.table("email_configs").select(
            "provider, smtp_host, smtp_port, smtp_username, smtp_password, use_tls, use_ssl, refresh_token"
        ).eq("user_email", request.from_email).single().execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Email config not found")

        config = response.data

        # Gmail OAuth
        if config["provider"] == "gmail_oauth" and config.get("refresh_token"):
            return send_via_gmail_api(request, config["refresh_token"])

        # SMTP
        elif config["provider"] == "smtp":
            return send_via_smtp(request, config)

        else:
            raise HTTPException(
                status_code=400,
                detail="No valid email configuration found"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in send_email: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
