import asyncio
import re
import json
import random
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
    """Render template with contact data"""
    if not template:
        return ""
    if not isinstance(contact, dict):
        logging.error(f"Contact is not a dictionary: {type(contact)} - {contact}")
        return template
    
    rendered = template
    replaced_placeholders = set()
    for key, val in contact.items():
        placeholder = f"{{{{{key}}}}}"
        if placeholder in rendered and placeholder not in replaced_placeholders:
            rendered = rendered.replace(placeholder, str(val or ""))
            replaced_placeholders.add(placeholder)
    return rendered

def validate_email(email):
    """Validate email format"""
    if not email or not isinstance(email, str):
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def safe_parse_json(json_str, fallback=None):
    """Safely parse JSON string and extract steps array"""
    if not json_str:
        return fallback or []
    
    # If it's already a list, return it
    if isinstance(json_str, list):
        return json_str
    
    # If it's a dict, check for steps
    if isinstance(json_str, dict):
        if 'steps' in json_str:
            return json_str.get('steps', [])
        return fallback or []
    
    # If it's a string, try to parse it
    if isinstance(json_str, str):
        try:
            parsed_data = json.loads(json_str)
            logging.info(f"🔍 Parsed JSON structure: {type(parsed_data)}")
            
            # If it's a dict with a 'steps' key, return the steps array
            if isinstance(parsed_data, dict):
                logging.info(f"🔍 JSON keys: {list(parsed_data.keys())}")
                if 'steps' in parsed_data:
                    steps_array = parsed_data.get('steps', [])
                    logging.info(f"🔍 Found steps array with {len(steps_array)} items")
                    if steps_array and len(steps_array) > 0:
                        logging.info(f"🔍 First step sample: {steps_array[0]}")
                    return steps_array
                else:
                    logging.warning(f"⚠️ No 'steps' key found in JSON. Available keys: {list(parsed_data.keys())}")
                    return fallback or []
            
            # If it's already a list, return it
            elif isinstance(parsed_data, list):
                logging.info(f"🔍 JSON is already a list with {len(parsed_data)} items")
                return parsed_data
            
            else:
                logging.warning(f"⚠️ Parsed JSON is neither dict nor list: {type(parsed_data)}")
                return fallback or []
                
        except json.JSONDecodeError as e:
            logging.error(f"❌ Failed to parse JSON: {e}. Raw data preview: {json_str[:200]}...")
            return fallback or []
    
    return fallback or []

def send_email_with_proper_handling(send_email_via_config, from_email: str, to_email: str, subject: str, body: str) -> tuple[bool, str]:
    """
    Wrapper function to handle both dict and bool responses from email sending
    Returns: (success: bool, error_message: str)
    """
    try:
        result = send_email_via_config(from_email, to_email, subject, body)
        
        # Handle dictionary response (new format)
        if isinstance(result, dict):
            success = result.get("success", False)
            error_msg = result.get("error", "Unknown error") if not success else ""
            return success, error_msg
        
        # Handle boolean response (legacy format)
        elif isinstance(result, bool):
            return result, "" if result else "Email sending failed"
        
        # Handle other types (treat as falsy)
        else:
            return False, f"Unexpected response type: {type(result)}"
            
    except Exception as e:
        logging.error(f"❌ Exception in email sending: {e}")
        return False, str(e)

async def process_campaigns():
    """Process scheduled email campaigns"""
    now = datetime.now(timezone.utc).replace(microsecond=0)
    logging.info(f"🔍 Checking campaigns scheduled before {now.isoformat()}")

    # Import here to avoid circular imports
    from app.routes.gmail_send import send_email_via_config

    try:
        all_campaigns_resp = supabase.table("campaigns").select(
            "id, name, scheduled_at, status, email_list_id, sender_id, content, subject_line, email_content, sent_count, delivered_count, bounce_count, pause_between_emails"
        ).execute()
    except Exception as e:
        logging.error(f"❌ Failed to fetch campaigns: {e}")
        return

    if not all_campaigns_resp.data:
        logging.info("⚠️ No campaigns found in database.")
        return

    due_campaigns = []
    for c in all_campaigns_resp.data or []:
        if not isinstance(c, dict):
            continue
            
        campaign_id = c.get("id")
        scheduled_raw = c.get("scheduled_at")
        
        if not scheduled_raw:
            continue
            
        try:
            scheduled_dt = datetime.fromisoformat(scheduled_raw.replace("Z", "+00:00"))
        except Exception as e:
            continue

        if c.get("status") in ["scheduled", "running"] and scheduled_dt <= now:
            due_campaigns.append(c)

    if not due_campaigns:
        logging.info("⚠️ No campaigns to process at this time.")
        return

    for campaign in due_campaigns:
        if not isinstance(campaign, dict):
            continue
            
        campaign_id = campaign.get("id")
        campaign_name = campaign.get("name", "Unknown")
        email_list_id = campaign.get("email_list_id")
        sender_id = campaign.get("sender_id")

        # Get pause_between_emails from the campaign record (300 seconds from your data)
        pause_between_emails = campaign.get("pause_between_emails", 300)  # Default 5 minutes

        logging.info(f"📧 Campaign {campaign_id} settings:")
        logging.info(f"  - Name: {campaign_name}")
        logging.info(f"  - Pause between emails: {pause_between_emails} seconds")

        if not email_list_id or not sender_id:
            logging.error(f"❌ Campaign {campaign_id} missing email_list_id or sender_id")
            continue

        logging.info(f"🚀 Processing campaign {campaign_id} - {campaign_name}")

        try:
            # Mark campaign as running
            supabase.table("campaigns").update({"status": "running"}).eq("id", campaign_id).execute()

            # Get sender configuration
            sender_resp = supabase.table("email_configs").select("*").eq("id", sender_id).single().execute()
            sender = sender_resp.data

            if not sender or not isinstance(sender, dict):
                logging.error(f"❌ Sender config not found for sender_id {sender_id}")
                supabase.table("campaigns").update({"status": "failed"}).eq("id", campaign_id).execute()
                continue

            # Parse campaign content
            steps = []
            if campaign.get("content"):
                content = campaign.get("content")
                steps = safe_parse_json(content, [])
                
            if not steps:
                steps = [{
                    "subject": normalize_text(campaign.get("subject_line")),
                    "body": normalize_text(campaign.get("email_content")),
                    "order": 1
                }]

            logging.info(f"📧 Campaign {campaign_id} has {len(steps)} steps")

            # Get contacts
            try:
                contacts_resp = supabase.table("email_contacts")\
                    .select("email, first_name, last_name")\
                    .eq("email_list_id", email_list_id)\
                    .eq("status", "active")\
                    .eq("opt_in", True)\
                    .execute()
                contacts = contacts_resp.data or []
            except Exception as e:
                logging.error(f"❌ Failed to fetch contacts: {e}")
                continue
            
            if not contacts:
                supabase.table("campaigns").update({"status": "completed"}).eq("id", campaign_id).execute()
                continue

            logging.info(f"👥 Found {len(contacts)} contacts for campaign {campaign_id}")

            # ✅ Get current sent_count from database to continue from where we left off
            current_sent_count = campaign.get("sent_count", 0)
            sent_count = current_sent_count
            failed_count = 0

            for step_idx, step in enumerate(steps):
                if not isinstance(step, dict):
                    continue
                    
                subject = normalize_text(step.get("subject", ""))
                body_template = normalize_text(step.get("body", ""))

                logging.info(f"📤 Processing step {step_idx + 1}/{len(steps)} for campaign {campaign_id}")

                for contact_idx, contact in enumerate(contacts):
                    if not isinstance(contact, dict):
                        failed_count += 1
                        continue
                        
                    recipient_email = contact.get("email")

                    if not validate_email(recipient_email):
                        failed_count += 1
                        continue

                    try:
                        # Render templates
                        body = render_pitch(body_template, contact)
                        subj = render_pitch(subject, contact)

                        success, error_msg = send_email_with_proper_handling(
                            send_email_via_config,
                            from_email=sender.get("user_email"),
                            to_email=recipient_email,
                            subject=subj,
                            body=body
                        )

                        if success:
                            sent_count += 1
                            logging.info(f"✅ Sent email to {recipient_email}")
                            
                            # ✅ Update sent_count in database after EVERY successful email send
                            try:
                                supabase.table("campaigns").update({
                                    "sent_count": sent_count,
                                    "updated_at": datetime.utcnow().replace(microsecond=0).isoformat()
                                }).eq("id", campaign_id).execute()
                                logging.info(f"📊 Updated sent_count to {sent_count} for campaign {campaign_id}")
                            except Exception as update_error:
                                logging.error(f"❌ Failed to update sent_count: {update_error}")
                        else:
                            failed_count += 1
                            logging.error(f"❌ Failed to send to {recipient_email}: {error_msg}")

                        # Use the campaign-specific pause_between_emails with randomization
                        random_factor = random.uniform(0.8, 1.2)  # ±20% randomness
                        actual_delay = pause_between_emails * random_factor
                        
                        logging.info(f"⏱️ Pausing {actual_delay:.1f}s before next email (configured: {pause_between_emails}s)")
                        await asyncio.sleep(actual_delay)

                    except Exception as e:
                        failed_count += 1
                        logging.error(f"❌ Error sending to {recipient_email}: {e}")

            # ✅ Final campaign completion update
            total_contacts = len(contacts) * len(steps)
            completion_rate = round((sent_count / total_contacts) * 100) if total_contacts else 0

            if sent_count == total_contacts:
                new_status = "completed"
            elif sent_count > 0:
                new_status = "partially_completed"
            else:
                new_status = "failed"

            try:
                supabase.table("campaigns").update({
                    "status": new_status,
                    "sent_count": sent_count,  # Final sent count
                    "completion_rate": completion_rate,
                    "total_steps": len(steps),
                    "completed_at": datetime.utcnow().replace(microsecond=0).isoformat() if new_status in ["completed", "failed"] else None,
                    "updated_at": datetime.utcnow().replace(microsecond=0).isoformat(),
                    "sent_at": datetime.utcnow().replace(microsecond=0).isoformat() if sent_count > current_sent_count else None
                }).eq("id", campaign_id).execute()
                logging.info(f"🎯 Final campaign update: {new_status}")
            except Exception as e:
                logging.error(f"❌ Failed to update final campaign status: {e}")

            logging.info(f"✅ Campaign {campaign_id}: Sent {sent_count}/{total_contacts} emails with {pause_between_emails}s delays. Failed: {failed_count}. Status → {new_status}")

        except Exception as e:
            logging.error(f"❌ Error processing campaign {campaign_id}: {e}")
            try:
                supabase.table("campaigns").update({"status": "failed"}).eq("id", campaign_id).execute()
            except:
                pass

def process_campaigns_sync():
    """Synchronous wrapper for the async process_campaigns function"""
    try:
        return asyncio.run(process_campaigns())
    except Exception as e:
        logging.error(f"❌ Error in campaign processor: {e}")
        raise
