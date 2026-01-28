"""
Modelo SQLAlchemy para la tabla 'system_config'.
Almacena configuraciones del sistema.
"""

from sqlalchemy import Column, Integer, String, Text, TIMESTAMP
from sqlalchemy.sql import func
from app.database import Base


class SystemConfig(Base):
    """Modelo de configuración del sistema."""
    
    __tablename__ = "system_config"
    
    # Columnas
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    config_key = Column(String(100), unique=True, nullable=False)
    config_value = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )
    
    def __repr__(self):
        return f"<SystemConfig(key='{self.config_key}', value='{self.config_value}')>"
