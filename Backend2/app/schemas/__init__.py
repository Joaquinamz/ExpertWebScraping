"""
Paquete de schemas Pydantic para validación de datos.
"""

from app.schemas.search import (
    SearchCreate,
    SearchUpdate,
    SearchResponse,
    SearchWithResults,
)
from app.schemas.contact import (
    ContactCreate,
    ContactUpdate,
    ContactResponse,
    ContactWithStats,
)
from app.schemas.common import (
    PaginationParams,
    PaginatedResponse,
    StatusResponse,
)

__all__ = [
    "SearchCreate",
    "SearchUpdate",
    "SearchResponse",
    "SearchWithResults",
    "ContactCreate",
    "ContactUpdate",
    "ContactResponse",
    "ContactWithStats",
    "PaginationParams",
    "PaginatedResponse",
    "StatusResponse",
]
