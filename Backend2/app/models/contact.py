"""
Modelo SQLAlchemy para la tabla 'contacts'.
Representa los contactos encontrados en las búsquedas.
"""

from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, JSON, DECIMAL, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Contact(Base):
    """Modelo de contacto."""
    
    __tablename__ = "contacts"
    
    # Columnas
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    organization = Column(String(200), nullable=True, index=True)
    position = Column(String(200), nullable=True)
    email = Column(String(150), nullable=True, unique=True, index=True)
    phone = Column(String(50), nullable=True)
    region = Column(String(100), nullable=True, index=True)
    source_url = Column(String(500), nullable=False)
    source_type = Column(String(50), nullable=True)
    research_lines = Column(JSON, nullable=True)
    is_valid = Column(Boolean, default=True, index=True)
    validation_score = Column(DECIMAL(3, 2), default=1.00)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )
    
    # Relaciones
    search_results = relationship("SearchResult", back_populates="contact", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Contact(id={self.id}, name='{self.name}', email='{self.email}')>"
