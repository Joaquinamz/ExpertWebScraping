"""
Aplicación principal FastAPI - VERSIÓN LIMPIA
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import searches, contacts, stats

# Crear instancia de FastAPI
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="API Backend para el sistema de búsqueda automática de expertos",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(searches.router, prefix=settings.API_PREFIX)
app.include_router(contacts.router, prefix=settings.API_PREFIX)
app.include_router(stats.router, prefix=settings.API_PREFIX)

# Endpoint raíz
@app.get("/", tags=["Root"])
async def root():
    """Endpoint raíz de la API."""
    return {
        "message": "Expert Finder API",
        "version": settings.API_VERSION,
        "status": "online",
        "docs": "/docs",
        "redoc": "/redoc"
    }

# Health check
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint para monitoreo."""
    return {
        "status": "healthy",
        "api_version": settings.API_VERSION
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        log_level=settings.LOG_LEVEL.lower()
    )
