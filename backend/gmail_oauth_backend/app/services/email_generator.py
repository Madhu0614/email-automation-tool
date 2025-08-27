import os
import requests
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from openai import OpenAI
import logging

logger = logging.getLogger(__name__)

# Load API key from .env
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def scrape_services(website_url):
    try:
        if not website_url or website_url.strip() == '':
            return "No website URL provided."
            
        logger.info(f"Scraping website: {website_url}")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(website_url, timeout=10, headers=headers)
        if response.status_code != 200:
            return f"Could not fetch services from website. Status code: {response.status_code}"
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Extract visible text
        paragraphs = [p.get_text().strip() for p in soup.find_all("p") if p.get_text().strip()]
        headings = [h.get_text().strip() for h in soup.find_all(["h1", "h2", "h3"]) if h.get_text().strip()]
        
        text = "\n".join(headings + paragraphs)
        return text[:2000]  # limit tokens
        
    except Exception as e:
        logger.error(f"Error scraping website {website_url}: {str(e)}")
        return f"Error scraping website: {e}"

def generate_pitch(
    my_company_name, 
    my_company_desc, 
    my_services, 
    target_company_name, 
    target_website_url, 
    sample_pitch=None, 
    first_name=None
):
    try:
        logger.info(f"Generating pitch from {my_company_name} to {target_company_name}")
        
        # Scrape target company's services
        target_services_text = scrape_services(target_website_url)

        if sample_pitch and sample_pitch.strip():
            prompt = f"""
You are an expert cold email copywriter with 10+ years of experience in B2B sales. You MUST follow the provided sample pitch structure EXACTLY while personalizing it for the target company.

## STRICT ADHERENCE RULES:
- NEVER change the overall structure, tone, or flow of the sample pitch
- NEVER add extra paragraphs or sections not in the sample
- NEVER remove sections that exist in the sample
- Keep the EXACT same paragraph breaks and formatting
- Maintain the SAME sentence count per paragraph
- Use the SAME call-to-action structure

## MY COMPANY INFORMATION (SENDER):
Company Name: {my_company_name}
Company Description: {my_company_desc}
My Services/Offerings: {my_services}

## TARGET COMPANY INFORMATION (RECIPIENT):
Company Name: {target_company_name}
Target Website: {target_website_url}
Target Services/Offerings: {target_services_text}
Contact First Name: {first_name or '[First Name]'}

## SAMPLE PITCH TO FOLLOW EXACTLY:
{sample_pitch}

## PERSONALIZATION REQUIREMENTS:
1. **OPENING PERSONALIZATION**: Replace generic opening with specific observation about {target_company_name}:
   - Reference their specific services, recent achievements, or business focus
   - Example: "Hi {first_name or '[First Name]'}, I noticed {target_company_name} specializes in [specific service from their website]..."

2. **VALUE CONNECTION**: Connect {my_company_name}'s services to {target_company_name}'s specific needs:
   - Show clear relevance between what you offer and what they do
   - Use their industry language and terminology

3. **MAINTAIN STRUCTURE**: Follow the sample's:
   - Exact number of paragraphs
   - Same sentence structure per paragraph
   - Identical call-to-action format
   - Same sign-off style

CRITICAL REMINDERS:
- You are {my_company_name} writing TO {target_company_name}
- Only personalize content, never structure
- Keep the same email length as the sample
- Use professional, conversational tone matching the sample

Generate the personalized pitch following the sample structure EXACTLY.
"""
        else:
            prompt = f"""
You are an expert cold email copywriter with 10+ years of B2B sales experience. Create a high-converting cold email that follows proven cold email best practices.

## MY COMPANY INFORMATION (SENDER):
Company Name: {my_company_name}
Company Description: {my_company_desc}
My Services/Offerings: {my_services}

## TARGET COMPANY INFORMATION (RECIPIENT):
Company Name: {target_company_name}
Target Website: {target_website_url}
Target Services/Offerings: {target_services_text}
Contact First Name: {first_name or '[First Name]'}

## COLD EMAIL BEST PRACTICES TO FOLLOW:

**STRUCTURE REQUIREMENTS:**
1. **Personalized Opening**: Reference something specific about {target_company_name}
2. **Credibility**: Brief mention of {my_company_name}'s relevant experience
3. **Value Proposition**: Clear benefit for {target_company_name}
4. **Social Proof**: Quick credibility indicator if relevant
5. **Soft CTA**: Non-pushy call-to-action
6. **Professional Sign-off**

**WRITING RULES:**
- Keep email under 150 words
- Use conversational, professional tone
- Avoid salesy language ("amazing", "incredible", "revolutionary")
- Focus on THEIR problems and needs, not YOUR services
- One clear value proposition
- Easy yes/no response option
- No attachments or links unless essential

**PERSONALIZATION MUSTS:**
- Reference specific service/focus of {target_company_name}
- Show you researched their business
- Connect your solution to their likely challenges
- Use their industry terminology

**SUBJECT LINE SUGGESTION:**
Include a subtle subject line suggestion that's personalized and curiosity-driven.

Generate a compelling cold email FROM {my_company_name} TO {target_company_name} that follows these best practices.
"""

        # Updated response handling for new OpenAI SDK
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": f"You are writing a personalized B2B cold email FROM {my_company_name} TO {target_company_name}. Focus on their specific needs and how {my_company_name} solves their problems. Be helpful, not salesy."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,  # Slightly lower for more consistent structure adherence
            max_tokens=500    # Increased for better cold emails
        )

        pitch = response.choices[0].message.content.strip()
        logger.info(f"Successfully generated pitch from {my_company_name} to {target_company_name}")
        return pitch
        
    except Exception as e:
        logger.error(f"OpenAI API error: {str(e)}")
        raise Exception(f"OpenAI API error: {str(e)}")
