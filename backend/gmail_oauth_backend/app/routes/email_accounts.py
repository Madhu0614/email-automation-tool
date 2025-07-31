from fastapi import APIRouter, HTTPException
from supabase import create_client, Client
import os
import logging

router = APIRouter()

# Set up Supabase connection
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Set up logging
logging.basicConfig(level=logging.INFO)

@router.get("/email/accounts")
def get_email_accounts():
    try:
        response = supabase.table("email_configs").select("*").execute()

        # Log the raw response for debugging
        logging.info("Supabase email_configs response: %s", response)

        # Check for error safely
        if getattr(response, "error", None):
            raise HTTPException(status_code=500, detail=str(response.error))

        return response.data
    except Exception as e:
        logging.error("Error fetching email accounts: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))
