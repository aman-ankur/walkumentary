from datetime import datetime, timedelta
from typing import Optional, Union
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from supabase import create_client, Client
import httpx
import sqlalchemy
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User
from app.database import get_db

# Security setup
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

class AuthenticationError(HTTPException):
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def verify_supabase_token(token: str) -> dict:
    """Verify Supabase JWT token"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"🔐 Verifying Supabase token (length: {len(token)})")
        
        # Get user directly with token - no need to set session
        response = supabase.auth.get_user(token)
        
        if response and response.user:
            logger.info(f"✅ Token verified successfully for user: {response.user.email}")
            return {
                "sub": response.user.id,
                "email": response.user.email,
                "user_metadata": response.user.user_metadata or {},
            }
        else:
            logger.warning("❌ Token verification failed - no user found in response")
            raise AuthenticationError("Invalid token - no user found")
    except Exception as e:
        logger.error(f"❌ Token verification failed: {str(e)}")
        raise AuthenticationError(f"Token verification failed: {str(e)}")

async def get_current_user_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current user from JWT token"""
    try:
        # First try to verify as Supabase token
        payload = await verify_supabase_token(credentials.credentials)
        user_id = payload.get("sub")
        
        if user_id is None:
            raise AuthenticationError()
            
    except JWTError:
        raise AuthenticationError()
    
    # Get or create user in our database
    user = await get_user_by_id(db, user_id)
    if user is None:
        # Create user from token data
        user_data = {
            "id": user_id,
            "email": payload.get("email"),
            "full_name": payload.get("user_metadata", {}).get("full_name", ""),
        }
        user = await create_user(db, user_data)
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user_from_token)
) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# User CRUD operations
async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    """Get user by ID"""
    result = await db.execute(
        sqlalchemy.select(User).where(User.id == user_id)
    )
    return result.scalar_one_or_none()

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Get user by email"""
    result = await db.execute(
        sqlalchemy.select(User).where(User.email == email)
    )
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, user_data: dict) -> User:
    """Create a new user"""
    user = User(**user_data)
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user