from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.services.supabase_client import supabase

router = APIRouter()

class SMTPConfigRequest(BaseModel):
    smtp_host: str
    smtp_port: int
    use_tls: bool
    username: str              # Usually same as from_email
    password: str              # Normal SMTP password (can be plain text for private SMTP)
    from_email: EmailStr
    incoming_server: str
    incoming_port: int

@router.post("/smtp/save-config")
def save_smtp_config(req: SMTPConfigRequest):
    try:
        result = supabase.table("email_configs").insert({
            "provider": "smtp",
            "user_email": req.from_email,
            "from_name": req.username,
            "is_active": True,
            "smtp_host": req.smtp_host,
            "smtp_port": req.smtp_port,
            "use_tls": req.use_tls,
            "smtp_username": req.username,
            "smtp_password": req.password,
            "incoming_server": req.incoming_server,
            "incoming_port": req.incoming_port
        }).execute()

        return {
            "message": "SMTP configuration saved to Supabase",
            "supabase_response": result.data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save SMTP config: {str(e)}")
