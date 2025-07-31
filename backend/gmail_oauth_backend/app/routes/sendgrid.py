from fastapi import APIRouter
from pydantic import BaseModel
from app.services.sendgrid_service import send_email_via_sendgrid

router = APIRouter()

class SendGridEmailRequest(BaseModel):
    to_email: str
    subject: str
    body: str
    api_key: str

@router.post("/send")
def sendgrid_send(req: SendGridEmailRequest):
    return send_email_via_sendgrid(req.to_email, req.subject, req.body, req.api_key)
