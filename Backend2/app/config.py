"""
Archivo de configuración principal del proyecto.
Carga variables de entorno y configuraciones globales.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Configuración de la aplicación usando Pydantic Settings."""
    
    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = "20020715Jc!"
    DB_NAME: str = "expert_finder_db"
    
    # API
    API_TITLE: str = "Expert Finder API"
    API_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8081
    RELOAD: bool = True
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    
    # n8n (opcional)
    N8N_WEBHOOK_URL: str = "http://localhost:5678/webhook/"
    
    # Demo Mode
    DEMO_MODE: bool = True
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    @property
    def database_url(self) -> str:
        """Construye la URL de conexión a la base de datos."""
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convierte CORS_ORIGINS en lista."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Instancia global de configuración
settings = Settings()
