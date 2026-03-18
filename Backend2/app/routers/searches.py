"""
Router para endpoints relacionados con búsquedas.
"""

from typing import Optional, List
import httpx
import asyncio
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.search import (
    SearchCreate,
    SearchUpdate,
    SearchResponse,
    SearchWithResults,
    SearchResultItem,
    N8NCallback,
)
from app.schemas.common import PaginatedResponse, StatusResponse
from app.services.search_service import SearchService
from app.config import Settings
from app.models.search_log import SearchLog

# Cargar configuración
settings = Settings()

router = APIRouter(prefix="/searches", tags=["Búsquedas"])


@router.post(
    "/",
    response_model=SearchResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva búsqueda",
    description="Crea una nueva búsqueda y dispara el workflow de n8n."
)
async def create_search(
    search: SearchCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Crear una nueva búsqueda y disparar workflow de n8n."""
    try:
        # 1. Crear registro en base de datos
        new_search = SearchService.create_search(db, search)
        
        # 2. Log inicial
        log = SearchLog(
            search_id=new_search.id,
            source_url="backend_api",
            source_type="api_request",
            status="info",
            contacts_found=0,
            error_message="Búsqueda creada, preparando para disparar workflow n8n",
            response_time_ms=0
        )
        db.add(log)
        db.commit()
        
        print(f"🔥 Agregando tarea de n8n a background_tasks para search_id={new_search.id}")
        
        # 3. Disparar workflow n8n usando BackgroundTasks
        background_tasks.add_task(
            trigger_n8n_workflow,
            search_id=new_search.id,
            keywords=search.keywords,
            area=search.area,
            region=search.region
        )
        
        # 4. Retornar inmediatamente al frontend
        return SearchResponse(
            id=new_search.id,
            session_id=new_search.session_id,
            keywords=new_search.keywords,
            area=new_search.area,
            region=new_search.region,
            status="pending",
            created_at=new_search.created_at,
            started_at=new_search.started_at,
            finished_at=new_search.finished_at,
            results_count=0,
            valid_results_count=0,
            error_message=None,
            search_config=new_search.search_config
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear búsqueda: {str(e)}"
        )


async def trigger_n8n_workflow(
    search_id: int,
    keywords: str,
    area: Optional[str],
    region: Optional[str]
):
    """Dispara el workflow de n8n mediante webhook."""
    try:
        print(f"🚀 Disparando n8n workflow para search_id={search_id}")
        print(f"   URL: {settings.N8N_WEBHOOK_URL}")
        print(f"   Payload: search_id={search_id}, keywords={keywords}, area={area}, region={region}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                settings.N8N_WEBHOOK_URL,
                json={
                    "search_id": search_id,
                    "keywords": keywords,
                    "area": area or "",
                    "region": region or ""
                },
                headers={
                    "Content-Type": "application/json"
                },
                timeout=30.0  # Timeout más largo para esperar respuesta
            )
            
            print(f"✅ n8n respondió: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            
            if response.status_code != 200:
                # Log del error pero no fallar
                print(f"❌ Error al disparar n8n: {response.status_code} - {response.text}")
            else:
                print(f"✅ Workflow disparado exitosamente")
                
    except httpx.TimeoutException:
        print("⏱️ Timeout - el workflow tardó más de 30 segundos")
    except Exception as e:
        print(f"❌ Error inesperado al disparar n8n: {str(e)}")


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


@router.post(
    "/{search_id}/callback",
    status_code=status.HTTP_200_OK,
    summary="Callback de n8n",
    description="Endpoint para que n8n notifique cuando termine el scraping."
)
async def n8n_callback(
    search_id: int,
    callback: N8NCallback,
    db: Session = Depends(get_db),
    api_key: str = Header(None, alias="X-N8N-API-KEY")
):
    """Endpoint para que n8n notifique cuando termine el scraping."""
    # Validar API key
    if api_key != settings.N8N_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    # Buscar registro
    search = SearchService.get_search(db, search_id)
    if not search:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Búsqueda no encontrada"
        )
    
    # Actualizar estado
    search_update = SearchUpdate(
        status=callback.status,
        results_count=callback.results_count,
        finished_at=datetime.utcnow()
    )
    SearchService.update_search(db, search_id, search_update)
    
    # Log del callback
    log = SearchLog(
        search_id=search_id,
        source_url="n8n_workflow",
        source_type="n8n_callback",
        status="info",
        contacts_found=callback.results_count,
        error_message=f"Callback de n8n recibido: {callback.results_count} contactos encontrados",
        response_time_ms=callback.execution_time_ms or 0
    )
    db.add(log)
    db.commit()
    
    return {
        "status": "acknowledged",
        "search_id": search_id,
        "message": "Callback procesado exitosamente"
    }
