"""
Router para endpoints relacionados con contactos.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.contact import (
    ContactCreate,
    ContactUpdate,
    ContactResponse,
    ContactWithStats,
    DuplicateContactResponse,
)
from app.schemas.common import PaginatedResponse, StatusResponse
from app.services.contact_service import ContactService

router = APIRouter(prefix="/contacts", tags=["Contactos"])


@router.post(
    "/",
    response_model=ContactResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nuevo contacto",
    description="Crea un nuevo contacto. El sistema previene duplicados automáticamente."
)
def create_contact(
    contact: ContactCreate,
    db: Session = Depends(get_db)
):
    """Crear un nuevo contacto."""
    result = ContactService.create_contact(db, contact)
    
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se pudo crear el contacto (posiblemente ya existe)"
        )
    
    # Si el contact fue creado o ya existía, verificar si es nuevo
    if result.created_at and (result.updated_at - result.created_at).total_seconds() < 1:
        # Es nuevo (creado hace menos de 1 segundo)
        return result
    else:
        # Ya existía - retornar con mensaje
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email duplicado. El contacto ya existe con ID {result.id}: {result.name}"
        )


@router.get(
    "/",
    response_model=PaginatedResponse[ContactResponse],
    summary="Listar contactos",
    description="Obtiene una lista paginada de contactos con filtros opcionales. Por defecto solo muestra contactos con validation_score > 0.6 (no duplicados)."
)
def list_contacts(
    skip: int = Query(0, ge=0, description="Registros a saltar"),
    limit: int = Query(100, ge=1, le=1000, description="Límite de registros"),
    only_valid: bool = Query(True, description="Solo contactos válidos"),
    region: Optional[str] = Query(None, description="Filtrar por región"),
    organization: Optional[str] = Query(None, description="Filtrar por organización"),
    min_validation_score: Optional[float] = Query(0.6, ge=0.0, le=1.0, description="Puntuación mínima (> 0.6 = válido, <= 0.6 = duplicado)"),
    db: Session = Depends(get_db)
):
    """Listar contactos con paginación y filtros. Por defecto excluye duplicados (score <= 0.6)."""
    contacts, total = ContactService.get_contacts(
        db,
        skip=skip,
        limit=limit,
        only_valid=only_valid,
        region=region,
        organization=organization,
        min_validation_score=min_validation_score
    )
    
    return PaginatedResponse(
        items=contacts,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get(
    "/search",
    response_model=PaginatedResponse[ContactResponse],
    summary="Buscar contactos",
    description="Busca contactos por nombre, email u organización."
)
def search_contacts(
    q: str = Query(..., min_length=2, description="Término de búsqueda"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Buscar contactos por término."""
    contacts, total = ContactService.search_contacts(
        db,
        search_term=q,
        skip=skip,
        limit=limit
    )
    
    return PaginatedResponse(
        items=contacts,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get(
    "/duplicates",
    response_model=PaginatedResponse[ContactResponse],
    summary="Listar posibles duplicados",
    description="""Obtiene contactos con score de validación reducido (similares detectados por el sistema).
    
    Niveles de score:
    - 1.0: Único (sin similitudes)
    - 0.9: Organización repetida (aceptable)
    - 0.7: Nombre repetido (posible duplicado)
    - 0.5: Nombre idéntico + Org similar (sospechoso)
    - 0.4: Nombre + Org idénticos (muy sospechoso)
    - 0.3: URL duplicada (muy sospechoso)
    """
)
def list_duplicates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    max_score: float = Query(0.99, ge=0.0, le=1.0, description="Score máximo para considerar como posible duplicado"),
    db: Session = Depends(get_db)
):
    """Listar contactos con score reducido (posibles duplicados o similares)."""
    duplicates, total = ContactService.get_duplicate_contacts(
        db,
        skip=skip,
        limit=limit,
        max_score=max_score
    )
    
    return PaginatedResponse(
        items=duplicates,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get(
    "/{contact_id}",
    response_model=ContactWithStats,
    summary="Obtener contacto",
    description="Obtiene los detalles de un contacto específico con estadísticas."
)
def get_contact(
    contact_id: int,
    db: Session = Depends(get_db)
):
    """Obtener un contacto específico con estadísticas."""
    contact = ContactService.get_contact_with_stats(db, contact_id)
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contacto con ID {contact_id} no encontrado"
        )
    
    return ContactWithStats(**contact)


@router.put(
    "/{contact_id}",
    response_model=ContactResponse,
    summary="Actualizar contacto",
    description="Actualiza los datos de un contacto existente."
)
def update_contact(
    contact_id: int,
    contact_update: ContactUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar un contacto."""
    contact = ContactService.update_contact(db, contact_id, contact_update)
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contacto con ID {contact_id} no encontrado"
        )
    
    return contact


@router.post(
    "/{contact_id}/invalidate",
    response_model=ContactResponse,
    summary="Invalidar contacto",
    description="Marca un contacto como no válido (útil para gestión manual de duplicados)."
)
def invalidate_contact(
    contact_id: int,
    reason: str = Query("Duplicado", description="Razón de invalidación"),
    db: Session = Depends(get_db)
):
    """Marcar contacto como no válido."""
    contact = ContactService.mark_as_invalid(db, contact_id, reason)
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contacto con ID {contact_id} no encontrado"
        )
    
    return contact
