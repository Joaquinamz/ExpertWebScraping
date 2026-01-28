"""
Modelo SQLAlchemy para la tabla 'search_logs'.
Registra logs detallados de cada búsqueda.
"""

from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class SearchLog(Base):
    """Modelo de log de búsqueda."""
    
    __tablename__ = "search_logs"
    
    # Columnas
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    search_id = Column(Integer, ForeignKey("searches.id", ondelete="CASCADE"), nullable=False, index=True)
    source_url = Column(Text, nullable=False)
    source_type = Column(String(50), nullable=True)
    status = Column(String(50), nullable=True)
    contacts_found = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp(), index=True)
    
    # Relaciones
    search = relationship("Search", back_populates="search_logs")
    
    def __repr__(self):
        return f"<SearchLog(id={self.id}, search_id={self.search_id}, status='{self.status}')>"
