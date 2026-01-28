"""
Servicio para gestión de contactos.
Contiene la lógica de negocio relacionada con contacts.
"""

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from app.models import Contact, SearchResult, Search
from app.schemas.contact import ContactCreate, ContactUpdate, ContactByRegionStats
from sqlalchemy.exc import IntegrityError


class ContactService:
    """Servicio para operaciones de contactos."""
    
    @staticmethod
    def calculate_validation_score(db: Session, contact_data: ContactCreate) -> float:
        """
        Calcular score de validación basado en similitudes con contactos existentes.
        
        Reglas de scoring:
        - 1.0: Único sin similitudes
        - 0.9: Solo 1 dato duplicado (excepto phone/email/url) O 2-3 datos de org/position/region
        - 0.7: Solo URL duplicado O Name + 1 dato de org/position/region
        - 0.6: Solo phone duplicado
        - 0.5: Solo email duplicado (no aplica, rechazado por DB)
        - 0.4: 2-3 datos de org/position/region + name
        - 0.3: URL + otros datos duplicados (combinación sospechosa)
        - Menor si se repiten más cosas
        
        Args:
            db: Sesión de base de datos
            contact_data: Datos del nuevo contacto
            
        Returns:
            Score de validación (0.0 - 1.0)
        """
        from sqlalchemy import func
        
        # Normalizar datos para comparación
        name_lower = contact_data.name.lower().strip() if contact_data.name else ""
        org_lower = contact_data.organization.lower().strip() if contact_data.organization else ""
        position_lower = contact_data.position.lower().strip() if contact_data.position else ""
        region_lower = contact_data.region.lower().strip() if contact_data.region else ""
        phone_clean = contact_data.phone.replace(" ", "").replace("-", "") if contact_data.phone else ""
        url = contact_data.source_url
        
        # Obtener todos los contactos existentes para comparar
        existing_contacts = db.query(Contact).all()
        
        if not existing_contacts:
            return 1.0  # Primer contacto, único
        
        min_score = 1.0
        
        # Comparar con cada contacto existente
        for contact in existing_contacts:
            matches = []
            match_count = 0
            
            # Normalizar datos del contacto existente
            ex_name = contact.name.lower().strip() if contact.name else ""
            ex_org = contact.organization.lower().strip() if contact.organization else ""
            ex_position = contact.position.lower().strip() if contact.position else ""
            ex_region = contact.region.lower().strip() if contact.region else ""
            ex_phone = contact.phone.replace(" ", "").replace("-", "") if contact.phone else ""
            ex_url = contact.source_url
            
            # Verificar coincidencias
            name_match = (name_lower == ex_name) if name_lower and ex_name else False
            org_match = (org_lower == ex_org) if org_lower and ex_org else False
            position_match = (position_lower == ex_position) if position_lower and ex_position else False
            region_match = (region_lower == ex_region) if region_lower and ex_region else False
            phone_match = (phone_clean == ex_phone) if phone_clean and ex_phone else False
            url_match = (url == ex_url) if url and ex_url else False
            
            # Contar coincidencias de org/position/region
            secondary_matches = sum([org_match, position_match, region_match])
            
            # Aplicar reglas de scoring
            current_score = 1.0
            
            # CASO 1: Solo URL duplicado (0.7) - mismo origen pero diferente contacto
            if url_match and not name_match and not phone_match and secondary_matches == 0:
                current_score = min(current_score, 0.7)
            
            # CASO 2: URL + otros datos duplicados (0.3) - muy sospechoso
            # Nota: email duplicado ya es rechazado por UNIQUE constraint de DB
            elif url_match and (name_match or phone_match or secondary_matches > 0):
                current_score = min(current_score, 0.3)
            
            # CASO 3: Name + 2-3 datos secundarios (0.4)
            if name_match and secondary_matches >= 2:
                current_score = min(current_score, 0.4)
            
            # CASO 4: Solo phone duplicado (0.6)
            elif phone_match and not name_match and secondary_matches == 0 and not url_match:
                current_score = min(current_score, 0.6)
            
            # CASO 6: Solo 1 dato duplicado (0.9) O 2-3 datos secundarios sin name
            elif not name_match and not url_match:
                if secondary_matches >= 2:
                    # 2-3 datos de org/position/region sin name
                    current_score = min(current_score, 0.9)
                elif secondary_matches == 1:
                    # Solo 1 dato secundario
                    current_score = min(current_score, 0.9)
            
            # CASO 7: Solo name duplicado (0.9)
            elif name_match and secondary_matches == 0 and not phone_match and not url_match:
                current_score = min(current_score, 0.9)
            
            # Casos con múltiples coincidencias (muy sospechosos)
            total_matches = sum([name_match, org_match, position_match, region_match, phone_match, url_match])
            if total_matches >= 4:
                current_score = min(current_score, 0.2)
            elif total_matches >= 3 and name_match:
                current_score = min(current_score, 0.3)
            
            # Tomar el score más bajo encontrado
            min_score = min(min_score, current_score)
        
        return min_score
    
    @staticmethod
    def create_contact(db: Session, contact_data: ContactCreate) -> Optional[Contact]:
        """
        Crear un nuevo contacto con scoring inteligente.
        Maneja duplicados automáticamente.
        
        Args:
            db: Sesión de base de datos
            contact_data: Datos del contacto
            
        Returns:
            Contacto creado o None si es duplicado
        """
        try:
            # Calcular score de validación antes de insertar
            validation_score = ContactService.calculate_validation_score(db, contact_data)
            
            # Convertir research_lines de lista a JSON si existe
            research_lines_json = contact_data.research_lines if contact_data.research_lines else None
            
            contact = Contact(
                name=contact_data.name,
                organization=contact_data.organization,
                position=contact_data.position,
                email=contact_data.email,
                phone=contact_data.phone,
                region=contact_data.region,
                source_url=contact_data.source_url,
                source_type=contact_data.source_type,
                research_lines=research_lines_json,
                validation_score=validation_score,  # Usar score calculado
                is_valid=True  # Mantener como válido, pero con score bajo si es sospechoso
            )
            
            db.add(contact)
            db.commit()
            db.refresh(contact)
            
            return contact
            
        except IntegrityError as e:
            db.rollback()
            # Duplicado detectado por restricciones UNIQUE (email)
            if contact_data.email:
                existing = db.query(Contact).filter(Contact.email == contact_data.email).first()
                return existing
            return None
    
    @staticmethod
    def get_contact(db: Session, contact_id: int) -> Optional[Contact]:
        """
        Obtener un contacto por ID.
        
        Args:
            db: Sesión de base de datos
            contact_id: ID del contacto
            
        Returns:
            Contacto encontrado o None
        """
        return db.query(Contact).filter(Contact.id == contact_id).first()
    
    @staticmethod
    def get_contacts(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        only_valid: bool = True,
        region: Optional[str] = None,
        organization: Optional[str] = None,
        min_validation_score: Optional[float] = None
    ) -> Tuple[List[Contact], int]:
        """
        Obtener lista de contactos con filtros opcionales.
        
        Args:
            db: Sesión de base de datos
            skip: Registros a saltar
            limit: Límite de registros
            only_valid: Si True, solo contactos válidos
            region: Filtrar por región
            organization: Filtrar por organización
            min_validation_score: Puntuación mínima de validación
            
        Returns:
            Tupla (lista de contactos, total)
        """
        query = db.query(Contact)
        
        if only_valid:
            query = query.filter(Contact.is_valid == 1)
        
        if region:
            query = query.filter(Contact.region == region)
        
        if organization:
            query = query.filter(Contact.organization.ilike(f"%{organization}%"))
        
        if min_validation_score is not None:
            query = query.filter(Contact.validation_score >= min_validation_score)
        
        total = query.count()
        contacts = query.order_by(
            desc(Contact.validation_score),
            desc(Contact.created_at)
        ).offset(skip).limit(limit).all()
        
        return contacts, total
    
    @staticmethod
    def update_contact(db: Session, contact_id: int, contact_update: ContactUpdate) -> Optional[Contact]:
        """
        Actualizar un contacto.
        
        Args:
            db: Sesión de base de datos
            contact_id: ID del contacto
            contact_update: Datos a actualizar
            
        Returns:
            Contacto actualizado o None
        """
        contact = db.query(Contact).filter(Contact.id == contact_id).first()
        
        if not contact:
            return None
        
        update_data = contact_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(contact, field, value)
        
        db.commit()
        db.refresh(contact)
        
        return contact
    
    @staticmethod
    def get_contact_with_stats(db: Session, contact_id: int) -> Optional[dict]:
        """
        Obtener contacto con estadísticas adicionales.
        
        Args:
            db: Sesión de base de datos
            contact_id: ID del contacto
            
        Returns:
            Diccionario con contacto y estadísticas
        """
        contact = db.query(Contact).filter(Contact.id == contact_id).first()
        
        if not contact:
            return None
        
        # Estadísticas de búsquedas
        stats = db.query(
            func.count(SearchResult.search_id).label('times_found'),
            func.count(func.distinct(SearchResult.search_id)).label('searches_involved'),
            func.avg(SearchResult.relevance_score).label('avg_relevance'),
            func.max(SearchResult.found_at).label('last_found_at')
        ).filter(
            SearchResult.contact_id == contact_id
        ).first()
        
        return {
            **contact.__dict__,
            "times_found": stats.times_found or 0,
            "searches_involved": stats.searches_involved or 0,
            "avg_relevance": float(stats.avg_relevance) if stats.avg_relevance else None,
            "last_found_at": stats.last_found_at
        }
    
    @staticmethod
    def get_contacts_by_region(db: Session) -> List[ContactByRegionStats]:
        """
        Obtener estadísticas de contactos por región.
        Usa la vista vw_contacts_by_region_area si está disponible.
        
        Args:
            db: Sesión de base de datos
            
        Returns:
            Lista de estadísticas por región
        """
        # Consulta directa (sin usar vista por compatibilidad)
        results = db.query(
            Contact.region,
            Search.area,
            func.count(Contact.id).label('total_contacts'),
            func.avg(Contact.validation_score).label('avg_validation_score'),
            func.max(Contact.updated_at).label('last_updated')
        ).join(
            SearchResult, Contact.id == SearchResult.contact_id
        ).join(
            Search, SearchResult.search_id == Search.id
        ).filter(
            Contact.is_valid == 1
        ).group_by(
            Contact.region, Search.area
        ).order_by(
            desc('total_contacts')
        ).all()
        
        return [
            ContactByRegionStats(
                region=r.region,
                area=r.area,
                total_contacts=r.total_contacts,
                avg_validation_score=float(r.avg_validation_score) if r.avg_validation_score else 0.0,
                last_updated=r.last_updated
            )
            for r in results
        ]
    
    @staticmethod
    def get_duplicate_contacts(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        max_score: float = 0.99
    ) -> Tuple[List[Contact], int]:
        """
        Obtener contactos con score reducido (posibles duplicados o similares).
        
        Args:
            db: Sesión de base de datos
            skip: Registros a saltar
            limit: Límite de registros
            max_score: Score máximo para considerar como posible duplicado
            
        Returns:
            Tupla (lista de posibles duplicados, total)
        """
        query = db.query(Contact).filter(
            and_(
                Contact.is_valid == 1,  # Solo contactos válidos pero sospechosos
                Contact.validation_score < max_score
            )
        )
        
        total = query.count()
        duplicates = query.order_by(
            Contact.validation_score,  # Los de menor score primero
            desc(Contact.created_at)
        ).offset(skip).limit(limit).all()
        
        return duplicates, total
    
    @staticmethod
    def search_contacts(
        db: Session,
        search_term: str,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Contact], int]:
        """
        Buscar contactos por término de búsqueda (nombre, email, organización).
        
        Args:
            db: Sesión de base de datos
            search_term: Término de búsqueda
            skip: Registros a saltar
            limit: Límite de registros
            
        Returns:
            Tupla (lista de contactos, total)
        """
        search_pattern = f"%{search_term}%"
        
        query = db.query(Contact).filter(
            and_(
                Contact.is_valid == 1,
                or_(
                    Contact.name.ilike(search_pattern),
                    Contact.email.ilike(search_pattern),
                    Contact.organization.ilike(search_pattern)
                )
            )
        )
        
        total = query.count()
        contacts = query.order_by(
            desc(Contact.validation_score)
        ).offset(skip).limit(limit).all()
        
        return contacts, total
    
    @staticmethod
    def mark_as_invalid(db: Session, contact_id: int, reason: str = "Duplicado") -> Optional[Contact]:
        """
        Marcar un contacto como no válido.
        
        Args:
            db: Sesión de base de datos
            contact_id: ID del contacto
            reason: Razón de invalidación
            
        Returns:
            Contacto actualizado
        """
        contact = db.query(Contact).filter(Contact.id == contact_id).first()
        
        if not contact:
            return None
        
        contact.is_valid = 0
        contact.validation_score = 0.0
        
        db.commit()
        db.refresh(contact)
        
        return contact
