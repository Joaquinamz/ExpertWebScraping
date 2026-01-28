"""
Router para endpoints de estadísticas y reportes.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.search import SearchStatsResponse
from app.schemas.contact import ContactByRegionStats
from app.services.search_service import SearchService
from app.services.contact_service import ContactService

router = APIRouter(prefix="/stats", tags=["Estadísticas"])


@router.get(
    "/summary",
    summary="Resumen general",
    description="Obtiene un resumen general del sistema con estadísticas clave."
)
def get_summary(db: Session = Depends(get_db)):
    """Obtener resumen general del sistema."""
    from app.models import Search, Contact, SearchResult
    from sqlalchemy import func
    
    # Estadísticas generales
    total_searches = db.query(func.count(Search.id)).scalar()
    total_contacts = db.query(func.count(Contact.id)).filter(Contact.is_valid == 1).scalar()
    total_results = db.query(func.count(SearchResult.search_id)).scalar()
    
    # Búsquedas por estado
    searches_by_status = db.query(
        Search.status,
        func.count(Search.id).label('count')
    ).group_by(Search.status).all()
    
    # Contactos de alta calidad
    high_quality_contacts = db.query(
        func.count(Contact.id)
    ).filter(
        Contact.is_valid == 1,
        Contact.validation_score >= 0.8
    ).scalar()
    
    # Duplicados detectados
    duplicates_detected = db.query(
        func.count(Contact.id)
    ).filter(
        Contact.is_valid == 0
    ).scalar()
    
    # Regiones más activas
    top_regions = db.query(
        Contact.region,
        func.count(Contact.id).label('count')
    ).filter(
        Contact.is_valid == 1,
        Contact.region.isnot(None)
    ).group_by(
        Contact.region
    ).order_by(
        func.count(Contact.id).desc()
    ).limit(5).all()
    
    return {
        "total_searches": total_searches or 0,
        "total_contacts": total_contacts or 0,
        "total_results": total_results or 0,
        "high_quality_contacts": high_quality_contacts or 0,
        "duplicates_detected": duplicates_detected or 0,
        "searches_by_status": {
            status: count for status, count in searches_by_status
        },
        "top_regions": [
            {"region": region, "count": count}
            for region, count in top_regions
        ]
    }


@router.get(
    "/by-session/{session_id}",
    response_model=SearchStatsResponse,
    summary="Estadísticas por sesión",
    description="Obtiene estadísticas detalladas de una sesión específica."
)
def get_session_stats(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Obtener estadísticas de una sesión."""
    stats = SearchService.get_session_stats(db, session_id)
    
    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontraron estadísticas para la sesión {session_id}"
        )
    
    return stats


@router.get(
    "/by-region",
    response_model=List[ContactByRegionStats],
    summary="Estadísticas por región",
    description="Obtiene estadísticas de contactos agrupadas por región y área."
)
def get_stats_by_region(db: Session = Depends(get_db)):
    """Obtener estadísticas por región."""
    return ContactService.get_contacts_by_region(db)


@router.get(
    "/quality-distribution",
    summary="Distribución de calidad",
    description="Obtiene la distribución de contactos según su puntuación de validación."
)
def get_quality_distribution(db: Session = Depends(get_db)):
    """Obtener distribución de calidad de contactos."""
    from app.models import Contact
    from sqlalchemy import func, case
    
    # Agrupar por rangos de validation_score
    distribution = db.query(
        case(
            (Contact.validation_score >= 0.9, "Excelente (0.9-1.0)"),
            (Contact.validation_score >= 0.7, "Bueno (0.7-0.89)"),
            (Contact.validation_score >= 0.5, "Regular (0.5-0.69)"),
            else_="Bajo (<0.5)"
        ).label('quality_range'),
        func.count(Contact.id).label('count')
    ).filter(
        Contact.is_valid == 1
    ).group_by(
        'quality_range'
    ).all()
    
    return {
        "distribution": [
            {"quality_range": qr, "count": count}
            for qr, count in distribution
        ]
    }


@router.get(
    "/recent-activity",
    summary="Actividad reciente",
    description="Obtiene información sobre la actividad reciente del sistema."
)
def get_recent_activity(db: Session = Depends(get_db)):
    """Obtener actividad reciente."""
    from app.models import Search, Contact
    from sqlalchemy import func, desc
    from datetime import datetime, timedelta
    
    # Últimas 24 horas
    last_24h = datetime.now() - timedelta(hours=24)
    
    # Búsquedas recientes
    recent_searches = db.query(func.count(Search.id)).filter(
        Search.created_at >= last_24h
    ).scalar()
    
    # Contactos agregados recientemente
    recent_contacts = db.query(func.count(Contact.id)).filter(
        Contact.created_at >= last_24h,
        Contact.is_valid == 1
    ).scalar()
    
    # Última búsqueda
    last_search = db.query(Search).order_by(desc(Search.created_at)).first()
    
    # Último contacto
    last_contact = db.query(Contact).filter(
        Contact.is_valid == 1
    ).order_by(desc(Contact.created_at)).first()
    
    return {
        "last_24_hours": {
            "searches": recent_searches or 0,
            "contacts": recent_contacts or 0
        },
        "last_search": {
            "id": last_search.id,
            "keywords": last_search.keywords,
            "created_at": last_search.created_at,
            "status": last_search.status
        } if last_search else None,
        "last_contact": {
            "id": last_contact.id,
            "name": last_contact.name,
            "organization": last_contact.organization,
            "created_at": last_contact.created_at
        } if last_contact else None
    }
