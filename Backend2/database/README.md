# Database Scripts

Este directorio contiene **todos los scripts SQL** para la base de datos del proyecto Expert Finder.

## 📁 Estructura de archivos

```
database/
├── 00_setup_all.sql       # 🚀 Script maestro (ejecuta todo)
├── 2.1SQL.sql            # HU 2.1 - Creación de esquema y tablas
├── 2.2SQL.sql            # HU 2.2 - Restricciones de integridad
├── 2.3SQL.sql            # HU 2.3 - Duplicados + Índices + Triggers ⭐
├── 2.4SQL.sql            # HU 2.4 - Vistas para consultas
├── 2.5SQL.sql            # HU 2.5 - Pruebas de integridad
├── triggers.sql          # ⚠️ DEPRECADO (ahora en 2.3SQL.sql)
└── README.md             # Este archivo
```

## 🚀 Instalación rápida

### Opción 1: Script maestro (recomendado)

Ejecuta todo en un solo comando:

```bash
mysql -u root -p < database/00_setup_all.sql
```

### Opción 2: Ejecución manual por pasos

```bash
# 1. Crear base de datos y tablas
mysql -u root -p < database/2.1SQL.sql

# 2. Agregar restricciones
mysql -u root -p < database/2.2SQL.sql

# 3. Configurar prevención de duplicados + triggers
mysql -u root -p < database/2.3SQL.sql

# 4. Crear vistas
mysql -u root -p < database/2.4SQL.sql

# 5. Ejecutar pruebas
mysql -u root -p < database/2.5SQL.sql
```

### Opción 3: Desde MySQL Workbench

1. Abrir MySQL Workbench
2. Conectar a tu servidor MySQL
3. File → Open SQL Script → Seleccionar `00_setup_all.sql`
4. Ejecutar (⚡ icono)

## 📊 Descripción de cada script

### `2.1SQL.sql` - HU 2.1: Creación de esquema y tablas

**Qué hace:**
- Crea la base de datos `expert_finder_db`
- Crea 7 tablas: searches, contacts, search_results, search_logs, api_sources, system_config
- Establece tipos de datos y valores por defecto

**Tablas principales:**
- `searches`: Búsquedas realizadas por usuarios
- `contacts`: Contactos encontrados (expertos)
- `search_results`: Relación N:M entre búsquedas y contactos
- `search_logs`: Auditoría de búsquedas

### `2.2SQL.sql` - HU 2.2: Restricciones de integridad

**Qué hace:**
- Agrega Foreign Keys entre tablas
- Crea índices para optimización
- Agrega constraints CHECK para validación
- Establece restricción UNIQUE para email

**Cambios importantes:**
- Email único globalmente (no se permiten duplicados)
- Validación de formato de email y teléfono
- Scoring entre 0.0 y 1.0

### `2.3SQL.sql` - HU 2.3: Prevención de duplicados

**Qué hace:**
- Verifica que las restricciones UNIQUE funcionen c + Índices + Triggers ⭐

**Qué hace:**
- Verifica que las restricciones UNIQUE funcionen correctamente
- Ejecuta pruebas de inserción de duplicados
- **Crea 5 triggers de validación y auditoría**
- Crea índices optimizados para búsquedas
- Documenta la lógica de scoring del backend

**Triggers incluidos:**
1. `before_contact_insert_validate` - Validación de datos mínimos
2. `before_contact_update` - Actualización de timestamp y normalización
3. `after_search_complete` - Log automático al completar búsqueda
4. `before_search_result_insert` - Validación de relevance_score
5. `after_search_result_insert` - Actualización de contadores

**Índices creados:**
- `idx_contacts_email` - Búsqueda por email
- `idx_contacts_region` - Filtrado por región
- `idx_contacts_organization` - Filtrado por organización
- `idx_contacts_valid` - Filtrado por validez
- `idx_contacts_validation_score` - Ordenamiento por score Python, no en SQL:
```
1.0 = Único sin similitudes
0.9 = Solo 1 dato duplicado (excepto phone/email)
0.7 = 1 dato secundario + name
0.6 = Solo phone duplicado
0.4 = 2-3 datos secundarios + name
0.3 = Email + URL duplicados
```

Ver: `app/services/contact_service.py → calculate_validation_score()`

### `2.4SQL.sql` - HU 2.4: Vistas para consultas

**Qué hace:**
- Crea vistas optimizadas para el frontend
- Simplifica consultas complejas con JOINs
- Pre-formatea datos para reportes

**Vistas creadas:**
- `vw_search_history`: Historial de búsquedas con formato legible
- `vw_search_results`: Resultados detallados con información de contactos
- `vw_contacts_by_region_area`: Estadísticas por región y área
- `vw_high_quality_contacts`: Contactos con alta calidad (score >= 0.8)

### `2.5SQL.sql` - HU 2.5: Pruebas de integridad

**Qué hace:**
- Ejecuta suite completa de pruebas
- Verifica Foreign Keys
- Prueba restricciones CHECK
- Valida triggers
- Genera reporte de resultados

**Categorías de pruebas:**
1. Integridad referencial (FK)
2. Restricciones CHECK
3. Restricciones UNIQUE
4. Triggers
5. Vistas
6. Índices

### `triggers.sql` - Triggers de validación (opcional)

### `triggers.sql` - Triggers de validación (opcional)

**Qué hace:**
- Validaciones básicas antes de insertar/actualizar
- Normalización automática de emails
- Auditoría de cambios
- Actualización de contadores

**Triggers incluidos:**

1. **before_contact_insert_validate**: Valida datos mínimos antes de insertar
2. **before_contact_update**: Actualiza timestamp y normaliza email
3. **after_search_complete**: Registra log al completar búsqueda
4. **before_search_result_insert**: Valida relevance_score
5. **after_search_result_insert**: Actualiza contador de resultados

**¿Instalar o no?**
- ✅ **SÍ** si tu proyecto académico requiere triggers
- ✅ **SÍ** para validaciones adicionales en producción
- ⚠️ **NO NECESARIO** para desarrollo (la lógica está en el backend)

## 🔧 Gestión de triggers

### Instalar triggers

```bash
mysql -u root -p expert_finder_db < database/triggers.sql
```

### Deshabilitar todos los triggers (desarrollo)

```sql
USE expert_finder_db;

DROP TRIGGER IF EXISTS before_contact_insert_validate;
DROP TRIGGER IF EXISTS before_contact_update;
DROP TRIGGER IF EXISTS after_search_complete;
DROP TRIGGER IF EXISTS before_search_result_insert;
DROP TRIGGER IF EXISTS after_search_result_insert;
```

### Ver triggers instalados

```sql
SELECT 
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    EVENT_OBJECT_TABLE,
    ACTION_TIMING
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'expert_finder_db'
ORDER BY EVENT_OBJECT_TABLE, ACTION_TIMING;
```

### Deshabilitar triggers temporalmente (desarrollo)

Simplemente vuelve a ejecutar la HU 2.3:

```bash
mysql -u root -p < database/2.3SQL.sql
```

O ejecuta el setup completo:

```bash
mysql -u root -p < database/00_setup_all
```sql
USE expert_finder_db;

DROP TRIGGER IF EXISTS before_contact_insert_validate;
DROP TRIGGER IF EXISTS before_contact_update;
DROP TRIGGER IF EXISTS after_search_complete;
DROP TRIGGER IF EXISTS before_search_result_insert;
DROP TRIGGER IF EXISTS after_search_result_insert;
```

### Rehabilitar triggers (producción)

```bash
mysql -u root -p expert_finder_db < database/triggers.sql
```

## 📊 Arquitectura: Backend vs SQL

### ✅ Lógica en el Backend (Python)

**Responsabilidades:**
- **Scoring complejo de validación**: 6 niveles de similitud
- **Comparación multi-criterio**: name, org, position, region, phone, URL
- **Lógica de negocio**: Flexible y mantenible
- **Testing**: Fácil de probar unitariamente
- **Reglas dinámicas**: Pueden cambiar sin modificar la BD

**Ubicación:** `app/services/contact_service.py → calculate_validation_score()`

### ✅ Lógica en SQL (Triggers + Constraints)

**Responsabilidades:**
- **Validaciones básicas**: NOT NULL, formato básico
- **Integridad referencial**: Foreign Keys, UNIQUE constraints
- **Auditoría automática**: Logs de cambios
- **Normalización**: Email a minúsculas, trim de espacios
- **Actualización de contadores**: resu (tablas y estructura)
- ✅ **HU 2.2**: Implementación de restricciones de integridad (FK, CHECK, UNIQUE)
- ✅ **HU 2.3**: Prevención de duplicados + Índices + Triggers ⭐
- ✅ **HU 2.4**: Creación de vistas para reportes y consultas
- ✅ **HU 2.5**: Pruebas de integridad y consistencia

**La HU 2.3 incluye:**
- ✅ Restricciones UNIQUE para prevenir duplicados
- ✅ 5 índices optimizados para búsquedas
- ✅ 5 triggers para validación y auditoría
- ✅ Pruebas de funcionamiento de restricciones
Si tu proyecto requiere **Historias de Usuario (HU)**, estos scripts cubren:

- ✅ **HU 2.1**: Diseño de esquema de BD
- ✅ **HU 2.2**: Implementación de restricciones de integridad
- ✅ **HU 2.3**: Prevención de contactos duplicados
- ✅ **HU 2.4**: Creación de vistas para reportes
- ✅ **HU 2.5**: Pruebas de integridad y consistencia
- ✅ **Triggers SQL**: Validaciones automáticas (opcional)

## 🧪 Verificación post-instalación

### 1. Verificar conexión desde Python

```bash
cd Backend
python test_db.py
```

**Salida esperada:**
```
============================
VERIFICACIÓN DE CONEXIÓN
============================
✅ Conexión exitosa!
✅ Se encontraron 7 tablas
```

### 2. Verificar tablas creadas

```sql
USE expert_finder_db;
SHOW TABLES;
```

**Resultado esperado:**
```
+----------------------------+
| Tables_in_expert_finder_db |
+----------------------------+
| api_sources                |
| contacts                   |
| search_logs                |
| search_results             |
| searches                   |
| system_config              |
| vw_contacts_by_region_area |
| vw_high_quality_contacts   |
| vw_search_history          |
| vw_search_results          |
+----------------------------+
```

### 3. Verificar Foreign Keys

```sql
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'expert_finder_db'
  AND REFERENCED_TABLE_NAME IS NOT NULL;
```

### 4. Verificar índices

```sql
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'expert_finder_db'
  AND INDEX_NAME != 'PRIMARY'
ORDER BY TABLE_NAME, INDEX_NAME;
```

## 🔄 Reinstalación completa

Si necesitas **borrar y recrear** la base de datos:

```bash
# ⚠️ ADVERTENCIA: Esto borrará TODOS los datos

mysql -u root -p << EOF
DROP DATABASE IF EXISTS expert_finder_db;
EOF

mysql -u root -p < database/00_setup_all.sql
```
 (incluye triggers automáticamente)
2. ⚠️ Si necesitas **desactivar triggers** temporalmente: usar DROP TRIGGER
3. ✅ Trabajar con el backend en modo `RELOAD=True`

### Para entrega/producción:

1. ✅ Ejecutar `00_setup_all.sql` completo
2. ✅ Los triggers se instalan automáticamente en 2.3SQL.sql
3. ✅ Documentar arquitectura híbrida (SQL + Python)
### Para entrega/producción:

1. ✅ Ejecutar `00_setup_all.sql` completo
2. ✅ Instalar triggers (`triggers.sql`)
3. ✅ Documentar arquitectura híbrida
4. ✅ Generar backup de la BD

### Backup de la base de datos:

```bash
# Exportar estructura y datos
mysqldump -u root -p expert_finder_db > backup_expert_finder.sql

# Solo estructura (sin datos)
mysqldump -u root -p --no-data expert_finder_db > schema_only.sql
```

## 📚 Recursos adicionales

### Documentación del proyecto:
- [README.md](../README.md) - Información general
- [INSTALLATION.md](../INSTALLATION.md) - Guía de instalación
- [API_REFERENCE.md](../API_REFERENCE.md) - Referencia de la API
- [EXAMPLES.md](../EXAMPLES.md) - Ejemplos de uso

### Modelos SQLAlchemy (Python):
- `app/models/search.py`
- `app/models/contact.py`
- `app/models/search_result.py`
- `app/models/search_log.py`

### Servicios de negocio:
- `app/services/search_service.py`
- `app/services/contact_service.py` ← **Aquí está el scoring complejo**

## 🐛 Solución de problemas

### Error: "Access denied for user"
```bash
# Verificar credenciales en .env
cat ../.env | grep DB_
```

### Error: "Unknown database"
```bash
# Crear la base de datos primero
mysql -u root -p -e "CREATE DATABASE expert_finder_db"
```

### Error: "Duplicate entry for key 'uc_contact_email_unique'"
✅ **Esto es esperado**: El sistema está previniendo duplicados correctamente

### Error: "Table already exists"
```bash
# Eliminar base de datos existente primero
mysql -u root -p -e "DROP DATABASE IF EXISTS expert_finder_db"
```

## 📞 Soporte

Para problemas con:
- **Scripts SQL**: Revisa este README
- **Backend**: Consulta [INSTALLATION.md](../INSTALLATION.md)
- **API**: Revisa [API_REFERENCE.md](../API_REFERENCE.md)
- **Ejemplos**: Ver [EXAMPLES.md](../EXAMPLES.md)

---

**Última actualización:** Enero 2026  
**Versión de BD:** 1.0.0  
**Compatible con:** MySQL 8.0+, Python 3.8+, FastAPI 0.109+
