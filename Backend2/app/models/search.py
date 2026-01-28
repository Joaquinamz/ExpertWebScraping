"""
Modelo SQLAlchemy para la tabla 'searches'.
Representa las búsquedas realizadas por los usuarios.
"""

from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Search(Base):
    """Modelo de búsqueda."""
    
    __tablename__ = "searches"
    
    # Columnas
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String(100), nullable=False, index=True)
    keywords = Column(Text, nullable=False)
    area = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)
    status = Column(String(50), default="pending", index=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp(), index=True)
    started_at = Column(TIMESTAMP, nullable=True)
    finished_at = Column(TIMESTAMP, nullable=True)
    results_count = Column(Integer, default=0)
    valid_results_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    ip_hash = Column(String(64), nullable=True)
    user_agent = Column(Text, nullable=True)
    search_config = Column(JSON, nullable=True)
    
    # Relaciones
    search_results = relationship("SearchResult", back_populates="search", cascade="all, delete-orphan")
    search_logs = relationship("SearchLog", back_populates="search", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Search(id={self.id}, keywords='{self.keywords}', status='{self.status}')>"
