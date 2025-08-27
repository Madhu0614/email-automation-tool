from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.routes import gmail_oauth, microsoft_oauth, smtp_email, email_generator  # Add email_generator
from fastapi.middleware.cors import CORSMiddleware
from app.routes import email_accounts
from app.routes import gmail_send
import logging
import asyncio
from contextlib import asynccontextmanager
from app.services.email_campaign_processor import process_campaigns

# Enable debug logging
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Background task for campaign processing
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
    # Start the background task
    task = asyncio.create_task(campaign_processor_task())
    logger.info("Campaign processor background task started")
    
    yield  # Application runs here
    
    # Cleanup: cancel the background task
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        logger.info("Campaign processor background task cancelled")

app = FastAPI(lifespan=lifespan)

@app.get("/")
def root():
    return {"status": "FastAPI backend running with Email Generator and Campaign Processor"}

# Custom exception handler - log errors but don't expose them
@app.exception_handler(Exception)
async def custom_exception_handler(request: Request, exc: Exception):
    # Log the full error details for debugging (server-side only)
    logger.error(f"Unhandled error: {exc}")
    
    # Return generic error message to client (no sensitive details)
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error"}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "https://email-automation-tool-7woxip5gg-madhu0614s-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(gmail_oauth.router, prefix="/oauth2", tags=["Gmail OAuth"])
app.include_router(microsoft_oauth.router, prefix="/oauth2", tags=["Microsoft OAuth"])
app.include_router(smtp_email.router, prefix="/email", tags=["SMTP Email"])
app.include_router(email_accounts.router)
app.include_router(gmail_send.router, prefix="/email", tags=["Gmail Send"])
app.include_router(email_generator.router, prefix="/ai", tags=["AI Email Generator"])  # Add this line

# Optional: Add endpoint to manually trigger campaign processing
@app.post("/admin/process-campaigns")
async def manual_process_campaigns():
    """Manual endpoint to trigger campaign processing"""
    try:
        await process_campaigns()  # Direct await
        return {"status": "success", "message": "Campaign processing completed"}
    except Exception as e:
        # Log error but don't expose details to client
        logger.error(f"Manual campaign processing failed: {e}")
        return {"status": "error", "message": "Processing failed"}
