-- ============================================================================
-- SETUP COMPLETO DE BASE DE DATOS - EXPERT FINDER
-- ============================================================================
-- Este script ejecuta todas las Historias de Usuario en orden
-- Autor: Sistema Expert Finder
-- Fecha: Enero 2026
-- ============================================================================

SELECT '
╔════════════════════════════════════════════════════════════════════════════╗
║                    EXPERT FINDER - DATABASE SETUP                          ║
║                         Instalación Completa                               ║
╠════════════════════════════════════════════════════════════════════════════╣
║  Este script ejecutará en orden:                                          ║
║    1. HU 2.1 - Creación de esquema y tablas                               ║
║    2. HU 2.2 - Restricciones de integridad                                ║
║    3. HU 2.3 - Prevención de duplicados + Índices + Triggers              ║
║    4. HU 2.4 - Vistas para consultas                                      ║
║    5. HU 2.5 - Pruebas de integridad                                      ║
╚════════════════════════════════════════════════════════════════════════════╝
' as titulo;

SELECT '⏳ Iniciando instalación...' as estado;
SELECT NOW() as fecha_inicio;

-- ============================================================================
-- HU 2.1: CREACIÓN DE ESQUEMA Y TABLAS
-- ============================================================================
SELECT '
┌────────────────────────────────────────────────────────────────────────────┐
│ EJECUTANDO: HU 2.1 - Creación de esquema y tablas                         │
└────────────────────────────────────────────────────────────────────────────┘
' as paso_1;

source /docker-entrypoint-initdb.d/2.1SQL.sql;

-- ============================================================================
-- HU 2.2: RESTRICCIONES DE INTEGRIDAD
-- ============================================================================
SELECT '
┌────────────────────────────────────────────────────────────────────────────┐
│ EJECUTANDO: HU 2.2 - Restricciones de integridad                          │
└────────────────────────────────────────────────────────────────────────────┘
' as paso_2;

source /docker-entrypoint-initdb.d/2.2SQL.sql;

-- ============================================================================
-- HU 2.3: PREVENCIÓN DE DUPLICADOS (Incluye Triggers)
-- ============================================================================
SELECT '
┌────────────────────────────────────────────────────────────────────────────┐
│ EJECUTANDO: HU 2.3 - Prevención de duplicados + Índices + Triggers        │
└────────────────────────────────────────────────────────────────────────────┘
' as paso_3;

source /docker-entrypoint-initdb.d/2.3SQL.sql;

-- ============================================================================
-- HU 2.4: VISTAS PARA CONSULTAS
-- ============================================================================
SELECT '
┌────────────────────────────────────────────────────────────────────────────┐
│ EJECUTANDO: HU 2.4 - Vistas para consultas                                │
└────────────────────────────────────────────────────────────────────────────┘
' as paso_4;

source /docker-entrypoint-initdb.d/2.4SQL.sql;

-- ============================================================================
-- HU 2.5: PRUEBAS DE INTEGRIDAD
-- ============================================================================
SELECT '
┌────────────────────────────────────────────────────────────────────────────┐
│ EJECUTANDO: HU 2.5 - Pruebas de integridad                                │
└────────────────────────────────────────────────────────────────────────────┘
' as paso_5;

source /docker-entrypoint-initdb.d/2.5SQL.sql;

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================
SELECT '
╔════════════════════════════════════════════════════════════════════════════╗
║                      ✅ INSTALACIÓN COMPLETADA                             ║
╠════════════════════════════════════════════════════════════════════════════╣
║  Base de datos: expert_finder_db                                          ║
║  Estado: Lista para usar                                                  ║
║  Triggers: Incluidos en HU 2.3                                            ║
╠════════════════════════════════════════════════════════════════════════════╣
║  PRÓXIMOS PASOS:                                                          ║
║                                                                            ║
║  1. Verificar conexión desde Python:                                      ║
║     cd Backend && python test_db.py                                       ║
║                                                                            ║
║  2. Iniciar el servidor backend:                                          ║
║     python run.py                                                         ║
║                                                                            ║
║  3. Acceder a la documentación:                                           ║
║     http://localhost:8080/docs                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
' as resumen_final;

-- Mostrar tablas creadas
USE expert_finder_db;
SELECT 'Tablas disponibles:' as info;
SHOW TABLES;

-- Mostrar vistas creadas
SELECT 'Vistas disponibles:' as info;
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Estadísticas finales
SELECT 
    'Base de datos' as componente,
    'expert_finder_db' as nombre,
    'Activa' as estado
UNION ALL
SELECT 
    'Tablas',
    CAST(COUNT(*) AS CHAR),
    'Creadas'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'expert_finder_db' AND TABLE_TYPE = 'BASE TABLE'
UNION ALL
SELECT 
    'Vistas',
    CAST(COUNT(*) AS CHAR),
    'Creadas'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'expert_finder_db' AND TABLE_TYPE = 'VIEW'
UNION ALL
SELECT 
    'Foreign Keys',
    CAST(COUNT(*) AS CHAR),
    'Configuradas'
FROM information_schema.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'expert_finder_db' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
UNION ALL
SELECT 
    'Índices',
    CTriggers',
    CAST(COUNT(*) AS CHAR),
    'Creados (en HU 2.3)'
FROM information_schema.TRIGGERS 
WHERE TRIGGER
SELECT NOW() as fecha_finalizacion;
SELECT '🎉 ¡Sistema listo para usar!' as mensaje;
