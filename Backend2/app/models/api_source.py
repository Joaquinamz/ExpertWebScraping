"""
Modelo SQLAlchemy para la tabla 'api_sources'.
Representa las fuentes de APIs configuradas (opcional para fase 2).
"""

from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, Boolean
from sqlalchemy.sql import func
from app.database import Base


class APISource(Base):
    """Modelo de fuente de API."""
    
    __tablename__ = "api_sources"
    
    # Columnas
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    base_url = Column(Text, nullable=False)
    api_key_encrypted = Column(Text, nullable=True)
    auth_type = Column(String(50), nullable=True)
    rate_limit = Column(Integer, default=100)
    is_active = Column(Boolean, default=True, index=True)
    last_used = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    def __repr__(self):
        return f"<APISource(id={self.id}, name='{self.name}', active={self.is_active})>"
