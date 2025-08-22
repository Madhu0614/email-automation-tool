from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.routes import gmail_oauth, microsoft_oauth, smtp_email
from fastapi.middleware.cors import CORSMiddleware
from app.routes import email_accounts
from app.routes import gmail_send
import logging

# Enable debug logging
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI()

@app.get("/")
def root():
    return {"status": "FastAPI backend running on Render"}

# Custom exception handler for debugging
@app.exception_handler(Exception)
async def custom_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"message": f"Internal server error: {str(exc)}"}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "https://email-automation-tool-omega.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Fix: Remove duplicate /email prefix
app.include_router(gmail_oauth.router, prefix="/oauth2", tags=["Gmail OAuth"])
app.include_router(microsoft_oauth.router, prefix="/oauth2", tags=["Microsoft OAuth"])
app.include_router(smtp_email.router, prefix="/email", tags=["SMTP Email"])
app.include_router(email_accounts.router)
app.include_router(gmail_send.router, prefix="/email", tags=["Gmail Send"])

