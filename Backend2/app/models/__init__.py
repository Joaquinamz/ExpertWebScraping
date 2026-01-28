"""
Paquete de modelos SQLAlchemy.
"""

from app.models.search import Search
from app.models.contact import Contact
from app.models.search_result import SearchResult
from app.models.search_log import SearchLog
from app.models.api_source import APISource
from app.models.system_config import SystemConfig

__all__ = [
    "Search",
    "Contact",
    "SearchResult",
    "SearchLog",
    "APISource",
    "SystemConfig",
]
