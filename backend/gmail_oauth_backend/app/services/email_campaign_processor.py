import asyncio
import re
import json
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

async def process_campaigns():
    """Process scheduled email campaigns"""
    now = datetime.now(timezone.utc).replace(microsecond=0)
    logging.info(f"🔍 Checking campaigns scheduled before {now.isoformat()}")

    # Import here to avoid circular imports
    from app.routes.gmail_send import send_email_via_config

    try:
        all_campaigns_resp = supabase.table("campaigns").select(
            "id, name, scheduled_at, status, email_list_id, sender_id, content, subject_line, email_content, sent_count, delivered_count, bounce_count"
        ).execute()
    except Exception as e:
        logging.error(f"❌ Failed to fetch campaigns: {e}")
        return

    if not all_campaigns_resp.data:
        logging.info("⚠️ No campaigns found in database.")
        return

    due_campaigns = []
    for c in all_campaigns_resp.data or []:
        # Ensure campaign is a dictionary
        if not isinstance(c, dict):
            logging.error(f"❌ Campaign data is not a dictionary: {type(c)} - {c}")
            continue
            
        campaign_id = c.get("id")
        scheduled_raw = c.get("scheduled_at")
        
        if not scheduled_raw:
            logging.warning(f"⚠️ Campaign {campaign_id} has no scheduled_at value")
            continue
            
        try:
            scheduled_dt = datetime.fromisoformat(scheduled_raw.replace("Z", "+00:00"))
        except Exception as e:
            logging.error(f"⚠️ Could not parse scheduled_at={scheduled_raw} for campaign {campaign_id}: {e}")
            continue

        if c.get("status") in ["scheduled", "running"] and scheduled_dt <= now:
            due_campaigns.append(c)

    if not due_campaigns:
        logging.info("⚠️ No campaigns to process at this time.")
        return

    for campaign in due_campaigns:
        # Ensure campaign is a dictionary
        if not isinstance(campaign, dict):
            logging.error(f"❌ Campaign is not a dictionary: {type(campaign)} - {campaign}")
            continue
            
        campaign_id = campaign.get("id")
        campaign_name = campaign.get("name", "Unknown")
        email_list_id = campaign.get("email_list_id")
        sender_id = campaign.get("sender_id")

        # Debug campaign data
        logging.info(f"🔍 Debug campaign {campaign_id}:")
        logging.info(f"  - Campaign data type: {type(campaign)}")
        logging.info(f"  - Campaign keys: {list(campaign.keys())}")
        logging.info(f"  - Email list ID: {email_list_id} (type: {type(email_list_id)})")
        logging.info(f"  - Sender ID: {sender_id} (type: {type(sender_id)})")

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
            
            # Debug sender data
            logging.info(f"🔍 Sender data type: {type(sender)}")
            
            # Handle case where sender might be a string
            if isinstance(sender, str):
                try:
                    sender = json.loads(sender)
                    logging.info(f"✅ Parsed sender data from JSON string for campaign {campaign_id}")
                except json.JSONDecodeError as e:
                    logging.error(f"❌ Failed to parse sender data as JSON for campaign {campaign_id}: {e}")
                    sender = None

            if not sender or not isinstance(sender, dict):
                logging.error(f"❌ Sender config not found or invalid for sender_id {sender_id}. Type: {type(sender)}. Skipping campaign {campaign_id}.")
                supabase.table("campaigns").update({"status": "failed"}).eq("id", campaign_id).execute()
                continue

            # ✅ Load campaign steps from `content`
            steps = []
            if campaign.get("content"):
                content = campaign.get("content")
                logging.info(f"🔍 Content type: {type(content)}")
                logging.info(f"🔍 Content preview: {content[:500]}...")  # Show first 500 chars
                
                steps = safe_parse_json(content, [])
                
                if not steps:
                    logging.warning(f"⚠️ Campaign {campaign_id} content could not be parsed as steps array")
            
            # fallback: single subject/body from subject_line + email_content
            if not steps:
                logging.info(f"📧 Using fallback step for campaign {campaign_id}")
                steps = [{
                    "subject": normalize_text(campaign.get("subject_line")),
                    "body": normalize_text(campaign.get("email_content")),
                    "order": 1
                }]

            logging.info(f"📧 Campaign {campaign_id} has {len(steps)} steps")
            if steps and len(steps) > 0:
                logging.info(f"🔍 First step type: {type(steps[0])}")
                if isinstance(steps[0], dict):
                    logging.info(f"🔍 First step keys: {list(steps[0].keys())}")

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
                logging.error(f"❌ Failed to fetch contacts for campaign {campaign_id}: {e}")
                supabase.table("campaigns").update({"status": "failed"}).eq("id", campaign_id).execute()
                continue
            
            if not contacts:
                logging.warning(f"⚠️ No active opted-in contacts for list {email_list_id}. Marking campaign completed.")
                supabase.table("campaigns").update({"status": "completed"}).eq("id", campaign_id).execute()
                continue

            logging.info(f"👥 Found {len(contacts)} contacts for campaign {campaign_id}")

            sent_count = 0
            failed_count = 0

            for step_idx, step in enumerate(steps):
                if not isinstance(step, dict):
                    logging.error(f"❌ Step {step_idx} is not a dictionary: {type(step)} - {step}")
                    failed_count += len(contacts)
                    continue
                    
                subject = normalize_text(step.get("subject", ""))
                body_template = normalize_text(step.get("body", ""))

                logging.info(f"📤 Processing step {step_idx + 1}/{len(steps)} for campaign {campaign_id}")

                for contact_idx, contact in enumerate(contacts):
                    if not isinstance(contact, dict):
                        logging.error(f"❌ Contact {contact_idx} is not a dictionary: {type(contact)} - {contact}")
                        failed_count += 1
                        continue
                        
                    recipient_email = contact.get("email")

                    if not validate_email(recipient_email):
                        logging.warning(f"⚠️ Invalid email address: {recipient_email}")
                        failed_count += 1
                        continue

                    try:
                        # Render templates
                        body = render_pitch(body_template, contact)
                        subj = render_pitch(subject, contact)

                        success = send_email_via_config(
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

                        await asyncio.sleep(1)

                    except Exception as e:
                        failed_count += 1
                        logging.error(f"❌ Error processing contact {recipient_email}: {e}")

            total_contacts = len(contacts) * len(steps)
            completion_rate = round((sent_count / total_contacts) * 100) if total_contacts else 0  # Round to integer

            # Update campaign status
            if sent_count == total_contacts:
                new_status = "completed"
            elif sent_count > 0:
                new_status = "partially_completed"
            else:
                new_status = "failed"

            try:
                supabase.table("campaigns").update({
                    "status": new_status,
                    "sent_count": sent_count,
                    "completion_rate": completion_rate,  # Now rounded to integer
                    "total_steps": len(steps),
                    "completed_at": datetime.utcnow().replace(microsecond=0).isoformat() if new_status in ["completed", "failed"] else None,
                    "updated_at": datetime.utcnow().replace(microsecond=0).isoformat(),
                    "sent_at": datetime.utcnow().replace(microsecond=0).isoformat() if sent_count else None
                }).eq("id", campaign_id).execute()
            except Exception as e:
                logging.error(f"❌ Failed to update campaign {campaign_id} status: {e}")

            logging.info(f"✅ Campaign {campaign_id}: Sent {sent_count}/{total_contacts} emails. Failed: {failed_count}. Status → {new_status}")

        except Exception as e:
            logging.error(f"❌ Unexpected error processing campaign {campaign_id}: {e}")
            try:
                supabase.table("campaigns").update({"status": "failed"}).eq("id", campaign_id).execute()
            except Exception as update_error:
                logging.error(f"❌ Failed to mark campaign {campaign_id} as failed: {update_error}")

def process_campaigns_sync():
    """Synchronous wrapper for the async process_campaigns function"""
    try:
        return asyncio.run(process_campaigns())
    except Exception as e:
        logging.error(f"❌ Error in campaign processor: {e}")
        raise
