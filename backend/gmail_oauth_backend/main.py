from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
import asyncio
from contextlib import asynccontextmanager

# Routes
from app.routes import gmail_oauth, microsoft_oauth, smtp_email, email_generator
from app.routes import email_accounts
from app.routes import gmail_send

# Services
from app.services.email_campaign_processor import process_campaigns

# ---------- Logging ----------
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ---------- Background Task ----------
async def campaign_processor_task():
    """Background task that runs the campaign processor every 60 seconds"""
    while True:
        try:
            logger.info("Running campaign processor...")
            await process_campaigns()  # Direct await since it's async
        except Exception as e:
            logger.error(f"Error in campaign processor: {e}")
        await asyncio.sleep(60)  # Wait 60 seconds before next check

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - start background tasks"""
    task = asyncio.create_task(campaign_processor_task())
    logger.info("Campaign processor background task started")
    
    yield  # Application runs here
    
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        logger.info("Campaign processor background task cancelled")

# ---------- App ----------
app = FastAPI(lifespan=lifespan)

@app.get("/")
def root():
    return {"status": "FastAPI backend running with Email Generator and Campaign Processor"}

# ---------- Exception Handler ----------
@app.exception_handler(Exception)
async def custom_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error"}
    )

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "https://email-automation-tool-omega.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Handle CORS Preflight (OPTIONS) requests globally
@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    """Respond OK to all OPTIONS preflight requests"""
    return JSONResponse(content={"message": "OK"})

# ---------- Routers ----------
app.include_router(gmail_oauth.router, prefix="/oauth2", tags=["Gmail OAuth"])
app.include_router(microsoft_oauth.router, prefix="/oauth2", tags=["Microsoft OAuth"])
app.include_router(smtp_email.router, prefix="/email", tags=["SMTP Email"])
app.include_router(email_accounts.router)
app.include_router(gmail_send.router, prefix="/email", tags=["Gmail Send"])
app.include_router(email_generator.router, prefix="/ai", tags=["AI Email Generator"])

# ---------- Manual Trigger for Campaigns ----------
@app.post("/admin/process-campaigns")
async def manual_process_campaigns():
    try:
        await process_campaigns()
        return {"status": "success", "message": "Campaign processing completed"}
    except Exception as e:
        logger.error(f"Manual campaign processing failed: {e}")
        return {"status": "error", "message": "Processing failed"}
