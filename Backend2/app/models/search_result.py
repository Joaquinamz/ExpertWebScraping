"""
Modelo SQLAlchemy para la tabla 'search_results'.
Relación N:M entre búsquedas y contactos.
"""

from sqlalchemy import Column, Integer, ForeignKey, TIMESTAMP, DECIMAL
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class SearchResult(Base):
    """Modelo de resultado de búsqueda (relación N:M)."""
    
    __tablename__ = "search_results"
    
    # Columnas (clave compuesta)
    search_id = Column(Integer, ForeignKey("searches.id", ondelete="CASCADE"), primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), primary_key=True, index=True)
    found_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    relevance_score = Column(DECIMAL(3, 2), default=1.00, index=True)
    
    # Relaciones
    search = relationship("Search", back_populates="search_results")
    contact = relationship("Contact", back_populates="search_results")
    
    def __repr__(self):
        return f"<SearchResult(search_id={self.search_id}, contact_id={self.contact_id}, relevance={self.relevance_score})>"
