from fastapi import FastAPI
from app.routes import gmail_oauth, microsoft_oauth, smtp_email
from fastapi.middleware.cors import CORSMiddleware
from app.routes import email_accounts

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # or "*" for all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Prefix only once
app.include_router(gmail_oauth.router, prefix="/oauth2", tags=["Gmail OAuth"])
app.include_router(microsoft_oauth.router, prefix="/oauth2", tags=["Microsoft OAuth"])
app.include_router(smtp_email.router, prefix="/email", tags=["SMTP Email"])
app.include_router(email_accounts.router)
