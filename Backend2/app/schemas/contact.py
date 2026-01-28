"""
Schemas Pydantic para contactos (contacts).
"""

from typing import Optional, List, Any
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, EmailStr, validator
import re


class ContactBase(BaseModel):
    """Schema base para contacto."""
    name: str = Field(..., min_length=1, max_length=200, description="Nombre completo del contacto")
    organization: Optional[str] = Field(None, max_length=200, description="Organización o institución")
    position: Optional[str] = Field(None, max_length=200, description="Cargo o posición")
    email: Optional[EmailStr] = Field(None, description="Email del contacto")
    phone: Optional[str] = Field(None, max_length=50, description="Teléfono del contacto")
    region: Optional[str] = Field(None, max_length=100, description="Región geográfica")
    source_url: str = Field(..., max_length=500, description="URL de origen del contacto")
    source_type: Optional[str] = Field(None, max_length=50, description="Tipo de fuente")
    research_lines: Optional[List[str]] = Field(None, description="Líneas de investigación")


class ContactCreate(ContactBase):
    """Schema para crear un contacto."""
    validation_score: Optional[Decimal] = Field(1.00, ge=0.0, le=1.0, description="Puntuación de validación")
    
    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('El nombre no puede estar vacío')
        return v.strip()
    
    @validator('phone')
    def validate_phone_format(cls, v):
        if v is not None:
            # Validar formato de teléfono: debe empezar con + o número, y contener solo números, espacios y guiones
            if not re.match(r'^[0-9+][0-9 -]*$', v):
                raise ValueError('Formato de teléfono inválido. Debe contener solo números, espacios y guiones')
        return v
    
    @validator('source_url')
    def validate_url_format(cls, v):
        if not v.startswith('http://') and not v.startswith('https://'):
            raise ValueError('La URL debe comenzar con http:// o https://')
        return v


class ContactUpdate(BaseModel):
    """Schema para actualizar un contacto."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    organization: Optional[str] = Field(None, max_length=200)
    position: Optional[str] = Field(None, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    region: Optional[str] = Field(None, max_length=100)
    source_type: Optional[str] = Field(None, max_length=50)
    research_lines: Optional[List[str]] = None
    is_valid: Optional[bool] = None
    validation_score: Optional[Decimal] = Field(None, ge=0.0, le=1.0)
    
    @validator('phone')
    def validate_phone_format(cls, v):
        if v is not None:
            if not re.match(r'^[0-9+][0-9 -]*$', v):
                raise ValueError('Formato de teléfono inválido')
        return v


class ContactResponse(ContactBase):
    """Schema de respuesta de contacto."""
    id: int
    is_valid: bool
    validation_score: Decimal
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ContactWithStats(ContactResponse):
    """Schema de contacto con estadísticas adicionales."""
    times_found: int = Field(0, description="Veces que este contacto fue encontrado")
    searches_involved: int = Field(0, description="Número de búsquedas que incluyeron este contacto")
    avg_relevance: Optional[float] = Field(None, description="Relevancia promedio")
    last_found_at: Optional[datetime] = Field(None, description="Última vez encontrado")
    
    class Config:
        from_attributes = True


class ContactByRegionStats(BaseModel):
    """Schema para estadísticas de contactos por región."""
    region: Optional[str]
    area: Optional[str]
    total_contacts: int
    avg_validation_score: float
    last_updated: datetime
    
    class Config:
        from_attributes = True


class DuplicateContactResponse(BaseModel):
    """Schema para contactos duplicados detectados."""
    id: int
    name: str
    email: Optional[str]
    organization: Optional[str]
    validation_score: Decimal
    is_valid: bool
    reason: str = Field(..., description="Razón por la que fue marcado como duplicado")
    created_at: datetime
    
    class Config:
        from_attributes = True
