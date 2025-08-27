from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from app.services.email_generator import generate_pitch
import logging
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models matching your function signature
class PitchRequest(BaseModel):
    my_company: str = Field(..., description="Your company name", min_length=1)
    my_desc: str = Field(..., description="Your company description", min_length=1) 
    my_services: str = Field(..., description="Your company services/offerings", min_length=1)
    target_url: str = Field(..., description="Target company website URL", min_length=1)
    sample_pitch: Optional[str] = Field(None, description="Optional sample pitch to follow structure")
    first_name: Optional[str] = Field(None, description="Target contact's first name")

class PitchResponse(BaseModel):
    pitch: str
    target_company_name: str
    my_company: str
    success: bool

class BatchPitchRequest(BaseModel):
    requests: list[PitchRequest]

class BatchPitchResponse(BaseModel):
    results: list[PitchResponse]
    success_count: int
    total_count: int

# Helper function to extract company name from URL
def extract_company_name_from_url(url: str) -> str:
    """Extract target company name from website URL"""
    try:
        from urllib.parse import urlparse
        domain = urlparse(url).netloc.replace("www.", "")
        company_name = domain.split('.')[0].replace('-', ' ').replace('_', ' ')
        return company_name.title()
    except Exception as e:
        logger.warning(f"Could not extract company name from URL {url}: {e}")
        return "Target Company"

# Single pitch generation endpoint
@router.post("/generate-pitch", response_model=PitchResponse)
async def create_pitch(request: PitchRequest):
    try:
        logger.info(f"Generating pitch from {request.my_company} to target: {request.target_url}")
        
        # Extract target company name from URL
        target_company_name = extract_company_name_from_url(request.target_url)
        
        # ✅ CORRECT: Call function with matching parameter names
        pitch = generate_pitch(
            my_company_name=request.my_company,        # ✅ matches your function signature
            my_company_desc=request.my_desc,           # ✅ matches your function signature
            my_services=request.my_services,           # ✅ matches your function signature
            target_company_name=target_company_name,   # ✅ matches your function signature
            target_website_url=request.target_url,     # ✅ matches your function signature
            sample_pitch=request.sample_pitch,         # ✅ matches your function signature
            first_name=request.first_name              # ✅ matches your function signature
        )
        
        return PitchResponse(
            pitch=pitch,
            target_company_name=target_company_name,
            my_company=request.my_company,
            success=True
        )
    
    except Exception as e:
        logger.error(f"Error generating pitch: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error generating pitch: {str(e)}"
        )

# Batch pitch generation
@router.post("/generate-pitches-batch", response_model=BatchPitchResponse)
async def create_pitches_batch(request: BatchPitchRequest, background_tasks: BackgroundTasks):
    try:
        results = []
        success_count = 0
        
        for pitch_request in request.requests:
            try:
                logger.info(f"Processing batch request for {pitch_request.my_company} -> {pitch_request.target_url}")
                
                # Extract target company name from URL
                target_company_name = extract_company_name_from_url(pitch_request.target_url)
                
                # ✅ CORRECT: Call function with matching parameter names
                pitch = generate_pitch(
                    my_company_name=pitch_request.my_company,        # ✅ matches your function signature
                    my_company_desc=pitch_request.my_desc,           # ✅ matches your function signature
                    my_services=pitch_request.my_services,           # ✅ matches your function signature
                    target_company_name=target_company_name,         # ✅ matches your function signature
                    target_website_url=pitch_request.target_url,     # ✅ matches your function signature
                    sample_pitch=pitch_request.sample_pitch,         # ✅ matches your function signature
                    first_name=pitch_request.first_name              # ✅ matches your function signature
                )
                
                results.append(PitchResponse(
                    pitch=pitch,
                    target_company_name=target_company_name,
                    my_company=pitch_request.my_company,
                    success=True
                ))
                success_count += 1
                
            except Exception as e:
                logger.error(f"Error generating pitch for {pitch_request.target_url}: {str(e)}")
                results.append(PitchResponse(
                    pitch=f"Error: {str(e)}",
                    target_company_name="Error",
                    my_company=pitch_request.my_company,
                    success=False
                ))
        
        return BatchPitchResponse(
            results=results,
            success_count=success_count,
            total_count=len(request.requests)
        )
    
    except Exception as e:
        logger.error(f"Error in batch pitch generation: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error generating pitches: {str(e)}"
        )

# Test endpoint for website scraping
@router.post("/test-scrape")
async def test_website_scrape(target_url: str):
    try:
        from app.services.email_generator import scrape_services
        services_text = scrape_services(target_url)
        
        target_company_name = extract_company_name_from_url(target_url)
        
        return {
            "target_url": target_url,
            "target_company_name": target_company_name,
            "scraped_content": services_text
        }
    except Exception as e:
        logger.error(f"Scraping error for {target_url}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Scraping error: {str(e)}")

# Health check endpoint
@router.get("/health")
async def health_check():
    try:
        from openai import OpenAI
        import os
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=5
        )
        
        return {
            "status": "healthy",
            "service": "AI Email Generator",
            "openai_connected": True
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "service": "AI Email Generator",
            "openai_connected": False,
            "error": str(e)
        }
