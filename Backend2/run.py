#!/usr/bin/env python3
"""
Script para iniciar el servidor de desarrollo.
"""

import uvicorn
from app.config import settings

if __name__ == "__main__":
    print(f"""
    ╔══════════════════════════════════════════════════════════╗
    ║            EXPERT FINDER API - BACKEND v2                ║
    ╠══════════════════════════════════════════════════════════╣
    ║  Version: {settings.API_VERSION:<47} ║
    ║  Host:    {settings.HOST}:{settings.PORT:<42} ║
    ║  Reload:  {str(settings.RELOAD):<47} ║
    ╠══════════════════════════════════════════════════════════╣
    ║  Docs:    http://{settings.HOST}:{settings.PORT}/docs{' '*22} ║
    ║  ReDoc:   http://{settings.HOST}:{settings.PORT}/redoc{' '*21} ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        log_level=settings.LOG_LEVEL.lower()
    )
