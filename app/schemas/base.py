from pydantic import BaseModel
from typing import Generic, TypeVar, List, Optional
from datetime import datetime
import uuid

T = TypeVar('T')

class BaseResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None
    errors: Optional[List[str]] = None

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int

class TimestampMixin(BaseModel):
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class IDMixin(BaseModel):
    id: uuid.UUID
    
    class Config:
        from_attributes = True