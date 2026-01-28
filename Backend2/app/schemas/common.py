"""
Schemas comunes utilizados en toda la aplicación.
"""

from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel, Field

T = TypeVar('T')


class PaginationParams(BaseModel):
    """Parámetros de paginación."""
    skip: int = Field(0, ge=0, description="Número de registros a saltar")
    limit: int = Field(100, ge=1, le=1000, description="Número máximo de registros a retornar")


class PaginatedResponse(BaseModel, Generic[T]):
    """Respuesta paginada genérica."""
    items: List[T]
    total: int
    skip: int
    limit: int
    
    class Config:
        from_attributes = True


class StatusResponse(BaseModel):
    """Respuesta de estado genérica."""
    success: bool
    message: str
    data: Optional[dict] = None
    
    class Config:
        from_attributes = True
