from dotenv import load_dotenv
from fastapi import Security, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import os

load_dotenv()

API_TOKEN = os.getenv("API_TOKEN")

security_scheme = HTTPBearer(description="Enter your API token")

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security_scheme)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    token = credentials.credentials
    if token != API_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return token