"""
Router para endpoints relacionados con búsquedas.
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.search import (
    SearchCreate,
    SearchUpdate,
    SearchResponse,
    SearchWithResults,
    SearchResultItem,
)
from app.schemas.common import PaginatedResponse, StatusResponse
from app.services.search_service import SearchService

router = APIRouter(prefix="/searches", tags=["Búsquedas"])


@router.post(
    "/",
    response_model=SearchResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva búsqueda",
    description="Crea una nueva búsqueda con los parámetros especificados."
)
def create_search(
    search: SearchCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Crear una nueva búsqueda."""
    # Crear búsqueda
    new_search = SearchService.create_search(db, search)
    
    # Si está en modo DEMO, procesar automáticamente en background
    # Esto se puede remover fácilmente cambiando DEMO_MODE a False en config.py
    background_tasks.add_task(SearchService.process_demo_search, new_search.id)
    
    return new_search


@router.get(
    "/",
    response_model=PaginatedResponse[SearchResponse],
    summary="Listar búsquedas",
    description="Obtiene una lista paginada de búsquedas con filtros opcionales."
)
def list_searches(
    skip: int = Query(0, ge=0, description="Registros a saltar"),
    limit: int = Query(100, ge=1, le=1000, description="Límite de registros"),
    session_id: Optional[str] = Query(None, description="Filtrar por ID de sesión"),
    status: Optional[str] = Query(None, description="Filtrar por estado"),
    db: Session = Depends(get_db)
):
    """Listar búsquedas con paginación y filtros."""
    searches, total = SearchService.get_searches(
        db,
        skip=skip,
        limit=limit,
        session_id=session_id,
        status=status
    )
    
    return PaginatedResponse(
        items=searches,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get(
    "/{search_id}",
    response_model=SearchResponse,
    summary="Obtener búsqueda",
    description="Obtiene los detalles de una búsqueda específica por su ID."
)
def get_search(
    search_id: int,
    db: Session = Depends(get_db)
):
    """Obtener una búsqueda específica."""
    search = SearchService.get_search(db, search_id)
    
    if not search:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Búsqueda con ID {search_id} no encontrada"
        )
    
    return search


@router.put(
    "/{search_id}",
    response_model=SearchResponse,
    summary="Actualizar búsqueda",
    description="Actualiza los datos de una búsqueda existente."
)
def update_search(
    search_id: int,
    search_update: SearchUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar una búsqueda."""
    search = SearchService.update_search(db, search_id, search_update)
    
    if not search:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Búsqueda con ID {search_id} no encontrada"
        )
    
    return search


@router.get(
    "/{search_id}/results",
    response_model=SearchWithResults,
    summary="Obtener resultados de búsqueda",
    description="Obtiene los contactos encontrados en una búsqueda específica."
)
def get_search_results(
    search_id: int,
    only_valid: bool = Query(True, description="Solo contactos válidos"),
    db: Session = Depends(get_db)
):
    """Obtener resultados de una búsqueda con información de contactos."""
    search = SearchService.get_search(db, search_id)
    
    if not search:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Búsqueda con ID {search_id} no encontrada"
        )
    
    results = SearchService.get_search_results(db, search_id, only_valid)
    
    # Convertir a SearchWithResults
    return SearchWithResults(
        **search.__dict__,
        results=[SearchResultItem(**r) for r in results]
    )


@router.post(
    "/{search_id}/start",
    response_model=SearchResponse,
    summary="Iniciar búsqueda",
    description="Marca una búsqueda como 'en ejecución'."
)
def start_search(
    search_id: int,
    db: Session = Depends(get_db)
):
    """Marcar búsqueda como en ejecución."""
    search = SearchService.mark_as_running(db, search_id)
    
    if not search:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Búsqueda con ID {search_id} no encontrada"
        )
    
    return search


@router.post(
    "/{search_id}/complete",
    response_model=SearchResponse,
    summary="Completar búsqueda",
    description="Marca una búsqueda como 'completada' con el conteo de resultados."
)
def complete_search(
    search_id: int,
    results_count: int = Query(..., ge=0, description="Número de resultados encontrados"),
    db: Session = Depends(get_db)
):
    """Marcar búsqueda como completada."""
    search = SearchService.mark_as_completed(db, search_id, results_count)
    
    if not search:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Búsqueda con ID {search_id} no encontrada"
        )
    
    return search


@router.post(
    "/{search_id}/error",
    response_model=SearchResponse,
    summary="Marcar búsqueda como fallida",
    description="Marca una búsqueda como 'error' con el mensaje correspondiente."
)
def mark_search_error(
    search_id: int,
    error_message: str = Query(..., description="Mensaje de error"),
    db: Session = Depends(get_db)
):
    """Marcar búsqueda como fallida."""
    search = SearchService.mark_as_error(db, search_id, error_message)
    
    if not search:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Búsqueda con ID {search_id} no encontrada"
        )
    
    return search
