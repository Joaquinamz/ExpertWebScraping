"""
Schemas Pydantic para búsquedas (searches).
"""

from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator


class SearchBase(BaseModel):
    """Schema base para búsqueda."""
    session_id: str = Field(..., min_length=1, max_length=100, description="ID de sesión del usuario")
    keywords: str = Field(..., min_length=1, description="Palabras clave de búsqueda")
    area: Optional[str] = Field(None, max_length=100, description="Área de búsqueda")
    region: Optional[str] = Field(None, max_length=100, description="Región geográfica")
    search_config: Optional[dict] = Field(None, description="Configuración adicional de búsqueda")


class SearchCreate(SearchBase):
    """Schema para crear una búsqueda."""
    ip_hash: Optional[str] = Field(None, max_length=64, description="Hash de IP del usuario")
    user_agent: Optional[str] = Field(None, description="User agent del navegador")
    
    @validator('keywords')
    def keywords_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Las palabras clave no pueden estar vacías')
        return v.strip()


class SearchUpdate(BaseModel):
    """Schema para actualizar una búsqueda."""
    status: Optional[str] = Field(None, description="Estado de la búsqueda")
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    results_count: Optional[int] = Field(None, ge=0)
    error_message: Optional[str] = None
    
    @validator('status')
    def validate_status(cls, v):
        if v is not None:
            allowed_statuses = ['pending', 'running', 'completed', 'error', 'cancelled']
            if v not in allowed_statuses:
                raise ValueError(f'Estado debe ser uno de: {", ".join(allowed_statuses)}')
        return v


class SearchResponse(SearchBase):
    """Schema de respuesta de búsqueda."""
    id: int
    status: str
    created_at: datetime
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    results_count: int
    valid_results_count: int = 0
    error_message: Optional[str] = None
    
    class Config:
        from_attributes = True


class SearchResultItem(BaseModel):
    """Schema para un resultado individual."""
    contact_id: int
    contact_name: str
    contact_email: Optional[str] = None
    contact_organization: Optional[str] = None
    organization: Optional[str] = None  # Alias
    contact_position: Optional[str] = None
    position: Optional[str] = None  # Alias
    contact_region: Optional[str] = None
    region: Optional[str] = None  # Alias
    contact_phone: Optional[str] = None
    phone: Optional[str] = None  # Alias
    source_url: Optional[str] = None
    source_type: Optional[str] = None
    relevance_score: float
    validation_score: float
    found_at: datetime
    
    class Config:
        from_attributes = True


class SearchWithResults(SearchResponse):
    """Schema de búsqueda con sus resultados."""
    results: List[SearchResultItem] = []
    
    class Config:
        from_attributes = True


class SearchStatsResponse(BaseModel):
    """Schema para estadísticas de búsqueda."""
    session_id: str
    total_searches: int
    total_contacts: int
    avg_contacts_per_search: float
    completed_searches: int
    failed_searches: int
    high_quality_contacts: int
    avg_execution_time_seconds: Optional[float] = None
    
    class Config:
        from_attributes = True
