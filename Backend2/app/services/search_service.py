"""
Servicio para gestión de búsquedas.
Contiene la lógica de negocio relacionada con searches.
"""

from typing import List, Optional, Tuple
from datetime import datetime
import random
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from app.models import Search, SearchResult, Contact
from app.schemas.search import SearchCreate, SearchUpdate, SearchStatsResponse
from app.config import settings


class SearchService:
    """Servicio para operaciones de búsqueda."""
    
    @staticmethod
    def process_demo_search(search_id: int) -> None:
        """
        Procesa una búsqueda en modo DEMO creando contactos de prueba.
        NOTA: Esta función se debe desactivar cuando se implemente n8n real.
        
        Args:
            search_id: ID de la búsqueda a procesar
        """
        if not settings.DEMO_MODE:
            return
        
        # Crear nueva sesión de DB para la tarea en background
        from app.database import SessionLocal
        db = SessionLocal()
        
        try:
            # Obtener la búsqueda
            search = db.query(Search).filter(Search.id == search_id).first()
            if not search:
                return
        
            # Datos de prueba basados en keywords
            nombres = ["María", "Juan", "Ana", "Pedro", "Carmen", "Luis", "Isabel", "Carlos", "Laura", "Miguel"]
            apellidos = ["González", "Rodríguez", "López", "Martínez", "García", "Fernández", "Sánchez", "Pérez", "Torres", "Ramírez"]
            organizaciones = ["Universidad de Chile", "Pontificia Universidad Católica", "Hospital Regional", "Ministerio de Salud", 
                             "Tech Innovators SpA", "Constructora del Sur", "Instituto Nacional", "Clínica Alemana"]
            dominios = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "uchile.cl", "uc.cl"]
            
            # Determinar área para posiciones
            area = search.area or "General"
            # Parsear áreas si hay múltiples (separadas por coma)
            areas_list = [a.strip() for a in area.split(',')] if area else ["General"]
            
            posiciones_por_area = {
                "Salud": ["Médico Especialista", "Enfermero/a", "Director/a Médico", "Jefe de Servicio"],
                "Educación": ["Profesor/a", "Director/a Académico", "Coordinador/a Pedagógico", "Investigador/a"],
                "Tecnología": ["Desarrollador Senior", "Arquitecto de Software", "CTO", "Data Scientist"],
                "Construcción": ["Ingeniero Civil", "Jefe de Obras", "Arquitecto", "Gerente de Proyectos"],
                "General": ["Gerente", "Especialista", "Coordinador/a", "Director/a"]
            }
            # Elegir una área aleatoria si hay múltiples
            area_seleccionada = random.choice(areas_list)
            posiciones = posiciones_por_area.get(area_seleccionada, posiciones_por_area["General"])
            
            # Parsear regiones si hay múltiples (separadas por coma)
            regiones_seleccionadas = [r.strip() for r in search.region.split(',')] if search.region else ["Metropolitana"]
            if not regiones_seleccionadas or regiones_seleccionadas == ['']:
                regiones_seleccionadas = ["Metropolitana"]
            
            # Generar entre 8 y 15 contactos de prueba
            num_contactos = random.randint(8, 15)
            contactos_creados = []
            contactos_ids_usados = set()  # Para evitar duplicados
            intentos = 0
            max_intentos = num_contactos * 3  # Permitir intentos adicionales
        
            while len(contactos_creados) < num_contactos and intentos < max_intentos:
                intentos += 1
                nombre = random.choice(nombres)
                apellido = random.choice(apellidos)
                nombre_completo = f"{nombre} {apellido}"
                # Aumentar rango a 1-9999 para reducir colisiones
                email = f"{nombre.lower()}.{apellido.lower()}{random.randint(1, 9999)}@{random.choice(dominios)}"
                
                # Verificar si el email ya existe
                existing = db.query(Contact).filter(Contact.email == email).first()
                if existing:
                    # Solo agregar si no lo hemos usado ya en esta búsqueda
                    if existing.id not in contactos_ids_usados:
                        contactos_creados.append(existing)
                        contactos_ids_usados.add(existing.id)
                    continue
                
                # Generar score de validación (0.1 a 1.0)
                validation_score = round(random.uniform(0.1, 1.0), 2)
                # Considerar válido solo si score >= 0.7
                is_valid = validation_score >= 0.7
                
                # Crear contacto
                contact = Contact(
                    name=nombre_completo,
                    organization=random.choice(organizaciones),
                    position=random.choice(posiciones),
                    email=email,
                    phone=f"+569{random.randint(10000000, 99999999)}",
                    region=random.choice(regiones_seleccionadas),  # Elegir UNA región aleatoria
                    source_url=f"https://demo-source.com/profile/{len(contactos_creados)}",
                    source_type="demo",
                    is_valid=is_valid,
                    validation_score=validation_score
                )
                
                db.add(contact)
                db.flush()  # Para obtener el ID
                contactos_creados.append(contact)
                contactos_ids_usados.add(contact.id)
            
            # Vincular contactos con la búsqueda
            for contact in contactos_creados:
                search_result = SearchResult(
                    search_id=search.id,
                    contact_id=contact.id,
                    relevance_score=round(random.uniform(0.7, 1.0), 2)
                )
                db.add(search_result)
        
            # Actualizar búsqueda como completada
            search.status = "completed"
            search.results_count = len(contactos_creados)
            search.valid_results_count = len([c for c in contactos_creados if c.is_valid])
            
            print(f"📊 DEBUG: contactos_creados = {len(contactos_creados)}, válidos = {search.valid_results_count}")
            print(f"📊 DEBUG: Asignando results_count = {search.results_count}, valid_results_count = {search.valid_results_count}")
            
            db.commit()
            db.refresh(search)  # Refrescar para asegurar que tiene los valores actualizados
            
            print(f"✅ Búsqueda {search_id} completada: {search.results_count} total, {search.valid_results_count} válidos")
            print(f"📊 DEBUG después de commit: results_count = {search.results_count}, valid_results_count = {search.valid_results_count}")
        except Exception as e:
            db.rollback()
            print(f"Error procesando búsqueda demo {search_id}: {e}")
        finally:
            db.close()
    
    @staticmethod
    def create_search(db: Session, search_data: SearchCreate) -> Search:
        """
        Crear una nueva búsqueda.
        
        Args:
            db: Sesión de base de datos
            search_data: Datos de la búsqueda
            
        Returns:
            Búsqueda creada
        """
        search = Search(
            session_id=search_data.session_id,
            keywords=search_data.keywords,
            area=search_data.area,
            region=search_data.region,
            search_config=search_data.search_config,
            ip_hash=search_data.ip_hash,
            user_agent=search_data.user_agent,
            status="pending"
        )
        
        db.add(search)
        db.commit()
        db.refresh(search)
        
        return search
    
    @staticmethod
    def get_search(db: Session, search_id: int) -> Optional[Search]:
        """
        Obtener una búsqueda por ID.
        
        Args:
            db: Sesión de base de datos
            search_id: ID de la búsqueda
            
        Returns:
            Búsqueda encontrada o None
        """
        return db.query(Search).filter(Search.id == search_id).first()
    
    @staticmethod
    def get_searches(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        session_id: Optional[str] = None,
        status: Optional[str] = None
    ) -> Tuple[List[Search], int]:
        """
        Obtener lista de búsquedas con filtros opcionales.
        
        Args:
            db: Sesión de base de datos
            skip: Registros a saltar
            limit: Límite de registros
            session_id: Filtrar por sesión
            status: Filtrar por estado
            
        Returns:
            Tupla (lista de búsquedas, total)
        """
        query = db.query(Search)
        
        if session_id:
            query = query.filter(Search.session_id == session_id)
        
        if status:
            query = query.filter(Search.status == status)
        
        total = query.count()
        searches = query.order_by(desc(Search.created_at)).offset(skip).limit(limit).all()
        
        return searches, total
    
    @staticmethod
    def update_search(db: Session, search_id: int, search_update: SearchUpdate) -> Optional[Search]:
        """
        Actualizar una búsqueda.
        
        Args:
            db: Sesión de base de datos
            search_id: ID de la búsqueda
            search_update: Datos a actualizar
            
        Returns:
            Búsqueda actualizada o None
        """
        search = db.query(Search).filter(Search.id == search_id).first()
        
        if not search:
            return None
        
        update_data = search_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(search, field, value)
        
        db.commit()
        db.refresh(search)
        
        return search
    
    @staticmethod
    def get_search_results(
        db: Session,
        search_id: int,
        only_valid: bool = True
    ) -> List[dict]:
        """
        Obtener resultados de una búsqueda con información de contactos.
        
        Args:
            db: Sesión de base de datos
            search_id: ID de la búsqueda
            only_valid: Si True, solo retorna contactos válidos
            
        Returns:
            Lista de resultados con información de contactos
        """
        query = db.query(
            SearchResult,
            Contact
        ).join(
            Contact, SearchResult.contact_id == Contact.id
        ).filter(
            SearchResult.search_id == search_id
        )
        
        if only_valid:
            query = query.filter(Contact.is_valid == 1)
        
        query = query.order_by(desc(SearchResult.relevance_score))
        
        results = []
        for search_result, contact in query.all():
            results.append({
                "contact_id": contact.id,
                "contact_name": contact.name,
                "contact_email": contact.email,
                "contact_organization": contact.organization,
                "organization": contact.organization,  # Alias para compatibilidad
                "contact_position": contact.position,
                "position": contact.position,  # Alias para compatibilidad
                "contact_region": contact.region,
                "region": contact.region,  # Alias para compatibilidad
                "contact_phone": contact.phone,
                "phone": contact.phone,  # Alias para compatibilidad
                "source_url": contact.source_url,
                "source_type": contact.source_type,
                "relevance_score": float(search_result.relevance_score),
                "validation_score": float(contact.validation_score),
                "found_at": search_result.found_at
            })
        
        return results
    
    @staticmethod
    def get_session_stats(db: Session, session_id: str) -> Optional[SearchStatsResponse]:
        """
        Obtener estadísticas de una sesión.
        
        Args:
            db: Sesión de base de datos
            session_id: ID de sesión
            
        Returns:
            Estadísticas de la sesión
        """
        # Búsquedas de la sesión
        searches = db.query(Search).filter(Search.session_id == session_id).all()
        
        if not searches:
            return None
        
        total_searches = len(searches)
        completed_searches = sum(1 for s in searches if s.status == 'completed')
        failed_searches = sum(1 for s in searches if s.status == 'error')
        total_contacts = sum(s.results_count for s in searches)
        
        # Contactos de alta calidad
        search_ids = [s.id for s in searches]
        high_quality = db.query(func.count(Contact.id)).join(
            SearchResult, Contact.id == SearchResult.contact_id
        ).filter(
            and_(
                SearchResult.search_id.in_(search_ids),
                Contact.is_valid == 1,
                Contact.validation_score >= 0.8
            )
        ).scalar()
        
        # Tiempo de ejecución promedio
        completed = [s for s in searches if s.finished_at and s.started_at]
        avg_time = None
        if completed:
            total_seconds = sum(
                (s.finished_at - s.started_at).total_seconds() 
                for s in completed
            )
            avg_time = total_seconds / len(completed)
        
        return SearchStatsResponse(
            session_id=session_id,
            total_searches=total_searches,
            total_contacts=total_contacts,
            avg_contacts_per_search=total_contacts / total_searches if total_searches > 0 else 0,
            completed_searches=completed_searches,
            failed_searches=failed_searches,
            high_quality_contacts=high_quality or 0,
            avg_execution_time_seconds=avg_time
        )
    
    @staticmethod
    def mark_as_running(db: Session, search_id: int) -> Optional[Search]:
        """
        Marcar búsqueda como en ejecución.
        
        Args:
            db: Sesión de base de datos
            search_id: ID de la búsqueda
            
        Returns:
            Búsqueda actualizada
        """
        search = db.query(Search).filter(Search.id == search_id).first()
        
        if not search:
            return None
        
        search.status = "running"
        search.started_at = datetime.now()
        
        db.commit()
        db.refresh(search)
        
        return search
    
    @staticmethod
    def mark_as_completed(db: Session, search_id: int, results_count: int) -> Optional[Search]:
        """
        Marcar búsqueda como completada.
        
        Args:
            db: Sesión de base de datos
            search_id: ID de la búsqueda
            results_count: Número de resultados encontrados
            
        Returns:
            Búsqueda actualizada
        """
        search = db.query(Search).filter(Search.id == search_id).first()
        
        if not search:
            return None
        
        search.status = "completed"
        search.finished_at = datetime.now()
        search.results_count = results_count
        
        db.commit()
        db.refresh(search)
        
        return search
    
    @staticmethod
    def mark_as_error(db: Session, search_id: int, error_message: str) -> Optional[Search]:
        """
        Marcar búsqueda como fallida.
        
        Args:
            db: Sesión de base de datos
            search_id: ID de la búsqueda
            error_message: Mensaje de error
            
        Returns:
            Búsqueda actualizada
        """
        search = db.query(Search).filter(Search.id == search_id).first()
        
        if not search:
            return None
        
        search.status = "error"
        search.finished_at = datetime.now()
        search.error_message = error_message
        
        db.commit()
        db.refresh(search)
        
        return search
