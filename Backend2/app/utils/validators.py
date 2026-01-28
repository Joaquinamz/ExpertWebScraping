"""
Validadores de datos.
"""

import re
from typing import Optional


def validate_email(email: str) -> bool:
    """
    Validar formato de email.
    
    Args:
        email: Email a validar
        
    Returns:
        True si el formato es válido
    """
    if not email:
        return False
    
    # Patrón básico de email
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """
    Validar formato de teléfono.
    Debe empezar con + o número, y contener solo números, espacios y guiones.
    
    Args:
        phone: Teléfono a validar
        
    Returns:
        True si el formato es válido
    """
    if not phone:
        return False
    
    # Patrón: debe empezar con + o número, y contener solo números, espacios y guiones
    pattern = r'^[0-9+][0-9 -]*$'
    return bool(re.match(pattern, phone))


def validate_url(url: str) -> bool:
    """
    Validar formato de URL.
    Debe comenzar con http:// o https://.
    
    Args:
        url: URL a validar
        
    Returns:
        True si el formato es válido
    """
    if not url:
        return False
    
    return url.startswith('http://') or url.startswith('https://')


def clean_string(text: Optional[str]) -> Optional[str]:
    """
    Limpiar string eliminando espacios extras.
    
    Args:
        text: Texto a limpiar
        
    Returns:
        Texto limpio o None
    """
    if not text:
        return None
    
    return ' '.join(text.split()).strip()


def normalize_email(email: Optional[str]) -> Optional[str]:
    """
    Normalizar email a minúsculas.
    
    Args:
        email: Email a normalizar
        
    Returns:
        Email normalizado o None
    """
    if not email:
        return None
    
    return email.lower().strip()
