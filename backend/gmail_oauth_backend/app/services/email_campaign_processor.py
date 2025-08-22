import time
import re
from datetime import datetime, timezone
import logging
from app.services.supabase_client import supabase

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s"
)

def normalize_text(value):
    """Normalize text values"""
    if not value:
        return ""
    if isinstance(value, list):
        value = " ".join([str(v) for v in value if v])
    else:
        value = str(value)
    return value.strip()

def render_pitch(template: str, contact: dict) -> str:
    """Render template with contact data - fixed to prevent double rendering"""
    if not template:
        return ""
    
    rendered = template
    # Track replaced placeholders to avoid infinite loops
    replaced_placeholders = set()
    
    for key, val in contact.items():
        placeholder = f"{{{{{key}}}}}"
        if placeholder in rendered and placeholder not in replaced_placeholders:
            if val is None:
                val = ""
            rendered = rendered.replace(placeholder, str(val))
            replaced_placeholders.add(placeholder)
    
    return rendered

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

async def process_campaigns():
    """Process scheduled email campaigns - async version"""
    now = datetime.now(timezone.utc).replace(microsecond=0)
    logging.info(f"🔍 Checking campaigns scheduled before {now.isoformat()}")

    # Import here to avoid circular imports
    from app.routes.gmail_send import send_email_via_config

    all_campaigns_resp = supabase.table("campaigns").select(
        "id, name, scheduled_at, status, email_list_id, sender_id, subject_line, email_content"
    ).execute()

    due_campaigns = []
    for c in all_campaigns_resp.data or []:
        scheduled_raw = c.get("scheduled_at")
        try:
            scheduled_dt = datetime.fromisoformat(scheduled_raw.replace("Z", "+00:00"))
        except Exception as e:
            logging.error(f"⚠️ Could not parse scheduled_at={scheduled_raw} for campaign {c['id']}: {e}")
            continue

        if c.get("status") in ["scheduled", "running"] and scheduled_dt <= now:
            due_campaigns.append(c)

    if not due_campaigns:
        logging.info("⚠️ No campaigns to process at this time.")
        return

    for campaign in due_campaigns:
        campaign_id = campaign["id"]
        email_list_id = campaign.get("email_list_id")
        sender_id = campaign.get("sender_id")

        if not email_list_id or not sender_id:
            logging.error(f"❌ Campaign {campaign_id} missing email_list_id or sender_id")
            continue

        logging.info(f"🚀 Processing campaign {campaign_id} - {campaign.get('name')}")

        # Mark campaign as running
        supabase.table("campaigns").update({"status": "running"}).eq("id", campaign_id).execute()

        # Get sender configuration
        sender_resp = supabase.table("email_configs").select("*").eq("id", sender_id).single().execute()
        sender = sender_resp.data
        if not sender:
            logging.error(f"❌ Sender config not found for sender_id {sender_id}. Skipping campaign {campaign_id}.")
            supabase.table("campaigns").update({"status": "failed"}).eq("id", campaign_id).execute()
            continue

        subject = normalize_text(campaign.get("subject_line"))
        body_template = normalize_text(campaign.get("email_content"))

        if not subject or not body_template:
            logging.warning(f"⚠️ Campaign {campaign_id} missing subject or body. Skipping.")
            supabase.table("campaigns").update({"status": "failed"}).eq("id", campaign_id).execute()
            continue

        # Get contacts
        contacts_resp = supabase.table("email_contacts")\
            .select("email, first_name, last_name")\
            .eq("email_list_id", email_list_id)\
            .eq("status", "active")\
            .eq("opt_in", True)\
            .execute()
        contacts = contacts_resp.data or []
        
        if not contacts:
            logging.warning(f"⚠️ No active opted-in contacts for list {email_list_id}. Marking campaign completed.")
            supabase.table("campaigns").update({"status": "completed"}).eq("id", campaign_id).execute()
            continue

        sent_count = 0
        failed_count = 0
        
        for contact in contacts:
            recipient_email = contact.get("email")
            
            if not validate_email(recipient_email):
                logging.warning(f"⚠️ Invalid email address: {recipient_email}")
                failed_count += 1
                continue

            try:
                # Render templates
                body = render_pitch(body_template, contact)
                subj = render_pitch(subject, contact)
                
                # Use the existing send function
                success = await send_email_via_config(
                    from_email=sender.get("user_email"),
                    to_email=recipient_email,
                    subject=subj,
                    body=body
                )
                
                if success:
                    sent_count += 1
                    logging.info(f"✅ Sent email to {recipient_email}")
                else:
                    failed_count += 1
                    logging.error(f"❌ Failed to send email to {recipient_email}")
                
                # Add throttling to avoid rate limiting
                time.sleep(1)
                
            except Exception as e:
                failed_count += 1
                logging.error(f"❌ Error processing contact {recipient_email}: {e}")

        # Update campaign status
        total_contacts = len(contacts)
        if sent_count == total_contacts:
            new_status = "completed"
        elif sent_count > 0:
            new_status = "partially_completed"
        else:
            new_status = "failed"

        supabase.table("campaigns").update({
            "status": new_status,
            "sent_count": sent_count,
            "failed_count": failed_count,
            "total_contacts": total_contacts,
            "completed_at": datetime.utcnow().replace(microsecond=0).isoformat() if new_status in ["completed", "failed"] else None,
            "updated_at": datetime.utcnow().replace(microsecond=0).isoformat()
        }).eq("id", campaign_id).execute()

        logging.info(f"✅ Campaign {campaign_id}: Sent {sent_count}/{total_contacts} emails. Failed: {failed_count}. Status → {new_status}")

# Sync wrapper for backwards compatibility
def process_campaigns_sync():
    """Synchronous wrapper for the async process_campaigns function"""
    import asyncio
    return asyncio.run(process_campaigns())
