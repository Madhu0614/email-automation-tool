from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.services.supabase_client import supabase
import smtplib, ssl, imaplib, poplib

router = APIRouter()

class SMTPConfigRequest(BaseModel):
    smtp_host: str
    smtp_port: int
    use_tls: bool = True
    use_ssl: bool = False       # NEW → Some providers require SSL
    username: str               # Usually same as from_email
    password: str               # Normal SMTP password (plain or app password)
    from_email: EmailStr
    incoming_server: str
    incoming_port: int
    protocol: str = "imap"      # "imap" or "pop3"
    save_to_db: bool = True     # NEW → Allow test-only mode

def test_smtp_connection(host: str, port: int, use_tls: bool, use_ssl: bool, username: str, password: str):
    """Try connecting to SMTP server with given credentials"""
    try:
        if use_ssl:
            context = ssl.create_default_context()
            server = smtplib.SMTP_SSL(host, port, context=context, timeout=10)
        else:
            server = smtplib.SMTP(host, port, timeout=10)
            if use_tls:
                context = ssl.create_default_context()
                server.starttls(context=context)

        server.login(username, password)
        server.quit()
        return True, None
    except Exception as e:
        return False, str(e)

def test_incoming_connection(protocol: str, server: str, port: int, username: str, password: str):
    """Validate IMAP/POP3 connection"""
    try:
        if protocol.lower() == "imap":
            imap = imaplib.IMAP4_SSL(server, port)
            imap.login(username, password)
            imap.logout()
        elif protocol.lower() == "pop3":
            pop_conn = poplib.POP3_SSL(server, port)
            pop_conn.user(username)
            pop_conn.pass_(password)
            pop_conn.quit()
        else:
            return False, f"Unsupported protocol: {protocol}"
        return True, None
    except Exception as e:
        return False, str(e)

@router.post("/smtp/save-config")
def save_smtp_config(req: SMTPConfigRequest):
    # ✅ Step 1: Test SMTP connection
    smtp_success, smtp_error = test_smtp_connection(
        req.smtp_host,
        req.smtp_port,
        req.use_tls,
        req.use_ssl,
        req.username,
        req.password
    )

    if not smtp_success:
        raise HTTPException(status_code=400, detail=f"SMTP validation failed: {smtp_error}")

    # ✅ Step 2: Test Incoming connection
    incoming_success, incoming_error = test_incoming_connection(
        req.protocol,
        req.incoming_server,
        req.incoming_port,
        req.username,
        req.password
    )

    if not incoming_success:
        raise HTTPException(status_code=400, detail=f"Incoming server validation failed: {incoming_error}")

    # ✅ Step 3: Save to Supabase if both are valid
    if req.save_to_db:
        try:
            result = supabase.table("email_configs").insert({
                "provider": "smtp",
                "user_email": req.from_email,
                "from_name": req.username,
                "is_active": True,
                "smtp_host": req.smtp_host,
                "smtp_port": req.smtp_port,
                "use_tls": req.use_tls,
                "use_ssl": req.use_ssl,
                "smtp_username": req.username,
                "smtp_password": req.password,
                "incoming_server": req.incoming_server,
                "incoming_port": req.incoming_port,
                "protocol": req.protocol
            }).execute()

            return {
                "message": "✅ SMTP & Incoming server validated & saved to Supabase",
                "supabase_response": result.data
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save config: {str(e)}")

    return {"message": "✅ SMTP & Incoming server validated (not saved to DB)"}
