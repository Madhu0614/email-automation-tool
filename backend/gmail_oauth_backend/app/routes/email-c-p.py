from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging

# Add this at the top of your existing email_campaign_processor.py file
router = APIRouter()
logger = logging.getLogger(__name__)

# Your existing functions (smtp_oauth2_login, send_email_smtp_oauth2, etc.) go here...
# [Keep all your existing email processing code]

# Add these FastAPI endpoints:

class CampaignProcessResponse(BaseModel):
    processed: int
    message: Optional[str] = None
    results: Optional[list] = None
    error: Optional[str] = None

@router.post("/process", response_model=CampaignProcessResponse)
async def trigger_campaign_processing():
    """Manually trigger campaign processing."""
    try:
        result = process_campaigns()
        return CampaignProcessResponse(**result)
    except Exception as e:
        logger.error(f"Error in manual campaign processing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_processor_status():
    """Get the status of the campaign processor."""
    return {
        "status": "running",
        "timestamp": datetime.utcnow().isoformat(),
        "config": {
            "throttle_seconds": config.throttle_seconds,
            "max_retries": config.max_retries,
            "batch_size": config.batch_size,
            "smtp_timeout": config.smtp_timeout
        }
    }

@router.post("/start-background")
async def start_background_processor(background_tasks: BackgroundTasks):
    """Start the campaign processor in the background."""
    try:
        start_campaign_processor()
        return {"message": "Campaign processor started in background"}
    except Exception as e:
        logger.error(f"Error starting background processor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaigns/{campaign_id}/status")
async def get_campaign_status(campaign_id: str):
    """Get the status of a specific campaign."""
    try:
        campaign_resp = supabase.table("campaigns")\
            .select("*")\
            .eq("id", campaign_id)\
            .single()\
            .execute()
        
        if not campaign_resp.data:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        return campaign_resp.data
    except Exception as e:
        logger.error(f"Error fetching campaign {campaign_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/campaigns/{campaign_id}/process")
async def process_specific_campaign(campaign_id: str):
    """Process a specific campaign manually."""
    try:
        # Fetch the campaign
        campaign_resp = supabase.table("campaigns")\
            .select("*")\
            .eq("id", campaign_id)\
            .single()\
            .execute()
        
        if not campaign_resp.data:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        result = process_single_campaign(campaign_resp.data)
        return result
    except Exception as e:
        logger.error(f"Error processing campaign {campaign_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Your existing functions remain the same...


def send_email_smtp_basic(smtp_host, smtp_port, smtp_user, smtp_pass, sender_email, sender_name, recipient, subject, body, use_tls=True):
    """Send email via basic SMTP with timeout and retry logic."""
    msg = MIMEText(body, "html")
    msg["Subject"] = subject
    msg["From"] = f"{sender_name} <{sender_email}>"
    msg["To"] = recipient

    for attempt in range(config.max_retries):
        try:
            if smtp_port == 465:  # SSL port
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=config.smtp_timeout) as server:
                    if smtp_user and smtp_pass:
                        server.login(smtp_user, smtp_pass)
                    server.sendmail(sender_email, [recipient], msg.as_string())
            else:
                with smtplib.SMTP(smtp_host, smtp_port, timeout=config.smtp_timeout) as server:
                    if use_tls:
                        server.starttls()
                    if smtp_user and smtp_pass:
                        server.login(smtp_user, smtp_pass)
                    server.sendmail(sender_email, [recipient], msg.as_string())
            logger.info(f"✅ Sent email to {recipient} via basic SMTP")
            return True
        except (socket.timeout, smtplib.SMTPServerDisconnected, ConnectionResetError) as e:
            if attempt < config.max_retries - 1:
                wait_time = 2 ** attempt
                logger.warning(f"Transient error (attempt {attempt + 1}), retrying in {wait_time}s: {e}")
                time.sleep(wait_time)
            else:
                logger.error(f"❌ Basic SMTP error sending to {recipient} after {config.max_retries} attempts: {e}")
                return False
        except Exception as e:
            logger.error(f"❌ Basic SMTP error sending to {recipient}: {e}")
            return False
    
    return False

def refresh_oauth_token_if_needed(sender: Dict[str, Any]) -> Dict[str, Any]:
    """Check if OAuth token needs refresh and handle it."""
    if sender.get("provider") in ("gmail_oauth", "microsoft_oauth"):
        token_expires_at = sender.get("token_expires_at")
        if token_expires_at:
            try:
                expires_dt = datetime.fromisoformat(token_expires_at.replace('Z', '+00:00'))
                if datetime.utcnow() >= expires_dt - timedelta(minutes=5):  # Refresh 5 min early
                    logger.info(f"OAuth token needs refresh for {sender.get('user_email')}")
                    # TODO: Implement token refresh logic here
                    # This would involve calling the OAuth provider's refresh endpoint
            except Exception as e:
                logger.warning(f"Could not parse token expiry: {e}")
    return sender

def send_email(sender, recipient, subject, body):
    """Send email using proper method depending on sender provider and config."""
    sender = refresh_oauth_token_if_needed(sender)
    
    provider = sender.get("provider")
    smtp_host = sender.get("smtp_host")
    smtp_port = sender.get("smtp_port")
    smtp_user = sender.get("smtp_username") or sender.get("smtp_user") or sender.get("user_email")
    smtp_pass = sender.get("smtp_password")
    access_token = sender.get("access_token")
    sender_email = sender.get("user_email")
    sender_name = sender.get("from_name") or sender_email
    use_tls = sender.get("use_tls")
    use_tls = True if use_tls is None else use_tls

    # Apply rate limiting
    rate_limiter.wait_if_needed()

    if provider in ("gmail_oauth", "microsoft_oauth"):
        # Use OAuth2 SMTP
        if not smtp_host or not smtp_port:
            if provider == "gmail_oauth":
                smtp_host = "smtp.gmail.com"
                smtp_port = 587
            elif provider == "microsoft_oauth":
                smtp_host = "smtp.office365.com"
                smtp_port = 587
        
        if not access_token:
            logger.error(f"No access token for OAuth provider {provider} for user {sender_email}")
            return False
        
        return send_email_smtp_oauth2(
            smtp_host, smtp_port, smtp_user, access_token,
            sender_email, sender_name,
            recipient, subject, body
        )
    elif provider == "smtp":
        if not smtp_host or not smtp_port:
            logger.error(f"SMTP host/port missing for sender {sender_email}")
            return False
        
        return send_email_smtp_basic(
            smtp_host, smtp_port, smtp_user, smtp_pass,
            sender_email, sender_name,
            recipient, subject, body,
            use_tls=use_tls
        )
    else:
        logger.error(f"Unsupported provider {provider} for sender {sender_email}")
        return False

def track_campaign_progress(campaign_id: str, contact_email: str, status: str, error_msg: Optional[str] = None):
    """Track individual email delivery status."""
    try:
        supabase.table("campaign_progress").insert({
            "campaign_id": campaign_id,
            "contact_email": contact_email,
            "status": status,  # 'sent', 'failed'
            "error_message": error_msg,
            "sent_at": datetime.utcnow().isoformat()
        }).execute()
    except Exception as e:
        logger.warning(f"Could not track progress for {contact_email}: {e}")

def personalize_email(body: str, contact: Dict[str, Any]) -> str:
    """Personalize email body with contact information."""
    personalized = body
    
    # Replace common placeholders
    placeholders = {
        "{first_name}": contact.get("first_name", "there"),
        "{last_name}": contact.get("last_name", ""),
        "{email}": contact.get("email", ""),
        "{company}": contact.get("company", ""),
    }
    
    for placeholder, value in placeholders.items():
        personalized = personalized.replace(placeholder, str(value))
    
    return personalized

def process_campaigns():
    """Process all scheduled and running campaigns."""
    now = datetime.utcnow().isoformat()

    try:
        campaigns_resp = supabase.table("campaigns")\
            .select("*")\
            .in_("status", ["scheduled", "running"])\
            .lte("scheduled_at", now)\
            .execute()

        campaigns = campaigns_resp.data or []
        if not campaigns:
            logger.info("No campaigns to process at this time.")
            return {"processed": 0, "message": "No campaigns to process"}

        results = []
        for campaign in campaigns:
            result = process_single_campaign(campaign)
            results.append(result)

        return {"processed": len(campaigns), "results": results}

    except Exception as e:
        logger.error(f"Error fetching campaigns: {e}")
        return {"error": str(e)}

def process_single_campaign(campaign: Dict[str, Any]) -> Dict[str, Any]:
    """Process a single campaign."""
    campaign_id = campaign["id"]
    email_list_id = campaign["email_list_id"]
    sender_id = campaign["sender_id"]

    logger.info(f"Processing campaign {campaign_id} - {campaign.get('name')}")

    try:
        # Get sender configuration
        sender_resp = supabase.table("email_configs").select("*").eq("id", sender_id).single().execute()
        sender = sender_resp.data
        if not sender:
            error_msg = f"Sender config not found for sender_id {sender_id}"
            logger.error(error_msg)
            return {"campaign_id": campaign_id, "error": error_msg}

        # Get email steps
        steps_resp = supabase.table("email_steps")\
            .select("*")\
            .eq("campaign_id", campaign_id)\
            .order("delayDays", ascending=True)\
            .execute()
        steps = steps_resp.data or []
        if not steps:
            error_msg = f"No email steps found for campaign {campaign_id}"
            logger.warning(error_msg)
            return {"campaign_id": campaign_id, "error": error_msg}

        # Get contacts
        contacts_resp = supabase.table("email_contacts")\
            .select("email, first_name, last_name, company")\
            .eq("email_list_id", email_list_id)\
            .eq("status", "active")\
            .eq("opt_in", True)\
            .execute()
        contacts = contacts_resp.data or []
        if not contacts:
            logger.warning(f"No active opted-in contacts for campaign {campaign_id}. Marking completed.")
            supabase.table("campaigns").update({"status": "completed"}).eq("id", campaign_id).execute()
            return {"campaign_id": campaign_id, "message": "No contacts to send to"}

        # Process first step (immediate send)
        first_step = next((step for step in steps if step["delayDays"] == 0), steps[0])
        subject = first_step.get("subject", "No Subject")
        body = first_step.get("body") or first_step.get("email_pitch") or ""

        sent_count = 0
        failed_count = 0

        for contact in contacts:
            recipient_email = contact.get("email")
            personalized_body = personalize_email(body, contact)

            try:
                success = send_email(sender, recipient_email, subject, personalized_body)
                if success:
                    sent_count += 1
                    track_campaign_progress(campaign_id, recipient_email, "sent")
                else:
                    failed_count += 1
                    track_campaign_progress(campaign_id, recipient_email, "failed")
                
                time.sleep(config.throttle_seconds)
            except Exception as e:
                logger.error(f"Error sending to {recipient_email}: {e}")
                failed_count += 1
                track_campaign_progress(campaign_id, recipient_email, "failed", str(e))

        # Update campaign status
        new_status = "completed" if sent_count + failed_count >= len(contacts) else "running"
        supabase.table("campaigns")\
            .update({
                "status": new_status,
                "sent_count": sent_count,
                "failed_count": failed_count,
                "updated_at": datetime.utcnow().isoformat()
            })\
            .eq("id", campaign_id)\
            .execute()

        result = {
            "campaign_id": campaign_id,
            "sent": sent_count,
            "failed": failed_count,
            "total": len(contacts),
            "status": new_status
        }
        
        logger.info(f"Campaign {campaign_id}: Sent {sent_count}/{len(contacts)} emails. Status: {new_status}")
        return result

    except Exception as e:
        error_msg = f"Error processing campaign {campaign_id}: {e}"
        logger.error(error_msg)
        return {"campaign_id": campaign_id, "error": error_msg}

def start_campaign_processor():
    """Start the campaign processor in a background thread."""
    def processor_loop():
        logger.info("Starting email campaign processor...")
        while True:
            try:
                process_campaigns()
            except Exception as e:
                logger.error(f"Unhandled error in processing: {e}")
            time.sleep(60)  # Process every minute
    
    thread = threading.Thread(target=processor_loop, daemon=True)
    thread.start()
    logger.info("Campaign processor started in background thread")

# For manual testing
if __name__ == "__main__":
    logger.info("Starting email campaign processor...")
    while True:
        try:
            result = process_campaigns()
            logger.info(f"Processing result: {result}")
        except Exception as e:
            logger.error(f"Unhandled error in processing: {e}")
        time.sleep(60)
