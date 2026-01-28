"""
Paquete de routers (endpoints de la API).
"""

from app.routers import searches, contacts, stats

__all__ = [
    "searches",
    "contacts",
    "stats",
]
