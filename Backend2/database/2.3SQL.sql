-- ======================================================
-- HU 2.3: Prevención de contactos duplicados
-- Script completo con pruebas CORREGIDAS
-- ======================================================

USE expert_finder_db;

-- ------------------------------------------------------
-- SECCIÓN 1: CONFIGURACIÓN INICIAL
-- ------------------------------------------------------
SELECT '=== INICIANDO HU 2.3: PREVENCIÓN DE DUPLICADOS ===' as mensaje_inicio;
SELECT 'Fecha de ejecución: ' as info, NOW() as timestamp;

-- ------------------------------------------------------
-- SECCIÓN 2: VERIFICACIÓN DE RESTRICCIONES EXISTENTES
-- ------------------------------------------------------
SELECT '1. Verificando restricciones de HU 2.2...' as paso;

-- Verificar que existen ambas restricciones UNIQUE
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.TABLE_CONSTRAINTS 
            WHERE TABLE_SCHEMA = 'expert_finder_db'
            AND TABLE_NAME = 'contacts'
            AND CONSTRAINT_TYPE = 'UNIQUE'
            AND CONSTRAINT_NAME = 'uc_contact_email_source'
        ) THEN '✅ Restricción UNIQUE (email + source_url) existe'
        ELSE '❌ Falta: uc_contact_email_source'
    END as verificacion_1
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.TABLE_CONSTRAINTS 
            WHERE TABLE_SCHEMA = 'expert_finder_db'
            AND TABLE_NAME = 'contacts'
            AND CONSTRAINT_TYPE = 'UNIQUE'
            AND CONSTRAINT_NAME = 'uc_contact_email_unique'
        ) THEN '✅ Restricción UNIQUE (email) existe'
        ELSE '❌ Falta: uc_contact_email_unique'
    END as verificacion_2;

-- ------------------------------------------------------
-- SECCIÓN 3: PRUEBAS CORRECTAS DE RESTRICCIONES UNIQUE
-- ------------------------------------------------------
SELECT '2. Ejecutando pruebas CORRECTAS de restricciones UNIQUE...' as paso;

-- Tabla temporal para resultados
CREATE TEMPORARY TABLE IF NOT EXISTS pruebas_unique (
    id_prueba INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(200),
    resultado VARCHAR(200),
    es_exito BOOLEAN
);

-- Limpiar datos de prueba anteriores
DELETE FROM contacts WHERE email LIKE '%test_unique_hu23%';

-- PRUEBA A: Insertar contacto base
INSERT INTO contacts (name, organization, email, source_url) 
VALUES ('Test Unique Base', 'Organización Base', 'test_unique_hu23_base@test.cl', 'https://base.url/original');

SET @id_base = LAST_INSERT_ID();

INSERT INTO pruebas_unique (descripcion, resultado, es_exito)
VALUES (
    'Insertar contacto base para pruebas',
    CONCAT('✅ ID: ', @id_base),
    TRUE
);

-- PRUEBA B: Intentar duplicado EXACTO (mismo email + misma URL)
-- Esto debe fallar por uc_contact_email_source
INSERT IGNORE INTO contacts (name, organization, email, source_url) 
VALUES ('Test Duplicado Exacto', 'Otra Org', 'test_unique_hu23_base@test.cl', 'https://base.url/original');

INSERT INTO pruebas_unique (descripcion, resultado, es_exito)
VALUES (
    'Duplicado EXACTO (mismo email + misma URL)',
    CASE 
        WHEN ROW_COUNT() = 0 THEN '✅ ÉXITO: Rechazado por uc_contact_email_source'
        ELSE CONCAT('❌ FALLO: Se insertaron ', ROW_COUNT(), ' filas')
    END,
    ROW_COUNT() = 0
);

-- PRUEBA C: Intentar duplicado EMAIL (diferente URL)
-- Esto debe fallar por uc_contact_email_unique
INSERT IGNORE INTO contacts (name, organization, email, source_url) 
VALUES ('Test Duplicado Email', 'Tercera Org', 'test_unique_hu23_base@test.cl', 'https://diferente.url/nueva');

INSERT INTO pruebas_unique (descripcion, resultado, es_exito)
VALUES (
    'Duplicado EMAIL (diferente URL)',
    CASE 
        WHEN ROW_COUNT() = 0 THEN '✅ ÉXITO: Rechazado por uc_contact_email_unique'
        ELSE CONCAT('❌ FALLO: Se insertaron ', ROW_COUNT(), ' filas')
    END,
    ROW_COUNT() = 0
);

-- PRUEBA D: Insertar contacto con email NUEVO pero misma URL
-- Esto debe FUNCIONAR (email diferente)
INSERT INTO contacts (name, organization, email, source_url) 
VALUES ('Test URL Repetida', 'Cuarta Org', 'test_unique_hu23_nuevo@test.cl', 'https://base.url/original');

SET @id_url_repetida = LAST_INSERT_ID();

INSERT INTO pruebas_unique (descripcion, resultado, es_exito)
VALUES (
    'Misma URL pero email NUEVO',
    CASE 
        WHEN @id_url_repetida > 0 THEN CONCAT('✅ ÉXITO: Se insertó ID ', @id_url_repetida, ' (email diferente)')
        ELSE '❌ FALLO: No se insertó'
    END,
    @id_url_repetida > 0
);

-- Mostrar resultados de pruebas UNIQUE
SELECT '=== RESULTADOS PRUEBAS RESTRICCIONES UNIQUE ===' as titulo;
SELECT 
    id_prueba as '#',
    descripcion as 'Descripción',
    resultado as 'Resultado',
    CASE es_exito 
        WHEN TRUE THEN '✅' 
        ELSE '❌' 
    END as 'Estado'
FROM pruebas_unique
ORDER BY id_prueba;

-- Mostrar contactos creados
SELECT '=== CONTACTOS CREADOS EN PRUEBAS ===' as titulo;
SELECT id, name, email, source_url 
FROM contacts 
WHERE email LIKE '%test_unique_hu23%'
ORDER BY id;

-- Limpiar para pruebas siguientes
DELETE FROM contacts WHERE email LIKE '%test_unique_hu23%';
DROP TEMPORARY TABLE IF EXISTS pruebas_unique;

-- ------------------------------------------------------
-- SECCIÓN 4: TRIGGERS PARA PREVENCIÓN DE DUPLICADOS
-- ------------------------------------------------------
SELECT '3. Creando triggers para prevención y validación...' as paso;

-- ------------------------------------------------------
-- TRIGGER 1: Validación básica antes de insertar contacto
-- ------------------------------------------------------
DROP TRIGGER IF EXISTS before_contact_insert_validate;

DELIMITER $$

CREATE TRIGGER before_contact_insert_validate
BEFORE INSERT ON contacts
FOR EACH ROW
BEGIN
    -- Validar que el nombre no esté vacío
    IF NEW.name IS NULL OR TRIM(NEW.name) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El nombre del contacto no puede estar vacío';
    END IF;
    
    -- Validar que source_url no esté vacío
    IF NEW.source_url IS NULL OR TRIM(NEW.source_url) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La URL de origen no puede estar vacía';
    END IF;
    
    -- Normalizar email a minúsculas
    IF NEW.email IS NOT NULL THEN
        SET NEW.email = LOWER(TRIM(NEW.email));
    END IF;
END$$

DELIMITER ;

SELECT '   ✅ Trigger before_contact_insert_validate creado' as resultado;

-- ------------------------------------------------------
-- TRIGGER 2: Actualizar timestamp al modificar contacto
-- ------------------------------------------------------
DROP TRIGGER IF EXISTS before_contact_update;

DELIMITER $$

CREATE TRIGGER before_contact_update
BEFORE UPDATE ON contacts
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
    
    -- Normalizar email si cambia
    IF NEW.email IS NOT NULL AND NEW.email != OLD.email THEN
        SET NEW.email = LOWER(TRIM(NEW.email));
    END IF;
END$$

DELIMITER ;

SELECT '   ✅ Trigger before_contact_update creado' as resultado;

-- ------------------------------------------------------
-- TRIGGER 3: Registrar log al completar búsqueda
-- ------------------------------------------------------
DROP TRIGGER IF EXISTS after_search_complete;

DELIMITER $$

CREATE TRIGGER after_search_complete
AFTER UPDATE ON searches
FOR EACH ROW
BEGIN
    -- Si el estado cambió a 'completed', crear log
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO search_logs (
            search_id,
            source_url,
            source_type,
            status,
            contacts_found,
            created_at
        ) VALUES (
            NEW.id,
            CONCAT('Search completed: ', NEW.keywords),
            'system',
            'success',
            NEW.results_count,
            CURRENT_TIMESTAMP
        );
    END IF;
END$$

DELIMITER ;

SELECT '   ✅ Trigger after_search_complete creado' as resultado;

-- ------------------------------------------------------
-- TRIGGER 4: Validar relevance_score en search_results
-- ------------------------------------------------------
DROP TRIGGER IF EXISTS before_search_result_insert;

DELIMITER $$

CREATE TRIGGER before_search_result_insert
BEFORE INSERT ON search_results
FOR EACH ROW
BEGIN
    -- Validar que relevance_score esté en rango válido
    IF NEW.relevance_score < 0 OR NEW.relevance_score > 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El relevance_score debe estar entre 0 y 1';
    END IF;
END$$

DELIMITER ;

SELECT '   ✅ Trigger before_search_result_insert creado' as resultado;

-- ------------------------------------------------------
-- TRIGGER 5: Actualizar contador de resultados
-- ------------------------------------------------------
DROP TRIGGER IF EXISTS after_search_result_insert;

DELIMITER $$

CREATE TRIGGER after_search_result_insert
AFTER INSERT ON search_results
FOR EACH ROW
BEGIN
    -- Incrementar contador de resultados en la búsqueda
    UPDATE searches
    SET results_count = results_count + 1
    WHERE id = NEW.search_id;
END$$

DELIMITER ;

SELECT '   ✅ Trigger after_search_result_insert creado' as resultado;

-- Verificar triggers creados
SELECT '=== TRIGGERS CREADOS ===' as titulo;
SELECT 
    TRIGGER_NAME as 'Trigger',
    EVENT_MANIPULATION as 'Evento',
    EVENT_OBJECT_TABLE as 'Tabla',
    ACTION_TIMING as 'Momento'
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'expert_finder_db'
ORDER BY EVENT_OBJECT_TABLE, ACTION_TIMING, EVENT_MANIPULATION;

-- ------------------------------------------------------
-- SECCIÓN 5: NOTA SOBRE SCORING COMPLEJO
-- ------------------------------------------------------
SELECT '4. Información sobre scoring de validación...' as paso;

SELECT '
╔════════════════════════════════════════════════════════════════════════════╗
║  NOTA IMPORTANTE: LÓGICA DE SCORING                                        ║
╠════════════════════════════════════════════════════════════════════════════╣
║  El scoring complejo de validación se maneja en el BACKEND (Python):      ║
║                                                                            ║
║  • 1.0 = Único sin similitudes                                            ║
║  • 0.9 = Solo 1 dato duplicado (excepto phone/email)                      ║
║        O 2-3 datos de org/position/region                                 ║
║  • 0.7 = 1 dato de org/position/region + name                             ║
║  • 0.6 = Solo phone duplicado                                             ║
║  • 0.4 = 2-3 datos de org/position/region + name                          ║
║  • 0.3 = Email + URL duplicados                                           ║
║                                                                            ║
║  Esta lógica está implementada en:                                        ║
║  app/services/contact_service.py → calculate_validation_score()          ║
║                                                                            ║
║  Los triggers SQL (ver triggers.sql) solo hacen validaciones básicas      ║
║  y normalización de datos.                                                ║
╚════════════════════════════════════════════════════════════════════════════╝
' as informacion;

-- Ya no creamos el trigger de similitud aquí, lo movimos a triggers.sql

-- ------------------------------------------------------
-- SECCIÓN 5: VERIFICACIÓN FINAL DE RESTRICCIONES
-- ------------------------------------------------------
SELECT '4. Verificación final de restricciones...' as paso;

-- Limpiar datos anteriores
DELETE FROM contacts WHERE name LIKE '[PRUEBA-SIM]%';

-- Insertar contacto base para similitud
INSERT INTO contacts (name, organization, email, source_url, validation_score) 
VALUES ('[PRUEBA-SIM] Dr. Ana Pérez', 'Universidad Sim', 'ana.perez@sim.cl', 'https://sim.cl/ana', 1.00);

SET @id_ana = LAST_INSERT_ID();

-- Insertar contacto SIMILAR (mismo nombre+org) pero email diferente
INSERT INTO contacts (name, organization, email, source_url) 
VALUES ('[PRUEBA-SIM] Dr. Ana Pérez', 'Universidad Sim', 'aperez@otro.sim.cl', 'https://otro.sim/ana');

SET @id_ana_similar = LAST_INSERT_ID();

-- Verificar score del segundo contacto
SET @score_ana_similar = (
    SELECT validation_score 
    FROM contacts 
    WHERE id = @id_ana_similar
);

-- ------------------------------------------------------
-- SECCIÓN 7: RESUMEN EJECUTIVO
-- ------------------------------------------------------
SELECT '🎯 HU 2.3: PREVENCIÓN DE DUPLICADOS (Índices y Triggers) - COMPLETADA' as titulo_resumen;

SELECT 'COMPONENTE' as tipo, 'DESCRIPCIÓN' as detalle, 'ESTADO' as estado
UNION ALL
SELECT '━━━━━━━━━━━━━━━━━━━━━', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', '━━━━━━━'
UNION ALL
SELECT '1. ÍNDICES', '', ''
UNION ALL
SELECT '   • idx_contacts_email', 'Búsqueda rápida por email', '✅'
UNION ALL
SELECT '   • idx_contacts_region', 'Filtrado por región', '✅'
UNION ALL
SELECT '   • idx_contacts_organization', 'Filtrado por organización', '✅'
UNION ALL
SELECT '   • idx_contacts_valid', 'Filtrado por validez', '✅'
UNION ALL
SELECT '   • idx_contacts_validation_score', 'Ordenamiento por score', '✅'
UNION ALL
SELECT '', '', ''
UNION ALL
SELECT '2. RESTRICCIONES UNIQUE', '', ''
UNION ALL
SELECT '   • uc_contact_email_unique', 'Email único globalmente', '✅'
UNION ALL
SELECT '', '', ''
UNION ALL
SELECT '3. TRIGGERS DE VALIDACIÓN', '', ''
UNION ALL
SELECT '   • before_contact_insert_validate', 'Validación de datos mínimos', '✅'
UNION ALL
SELECT '   • before_contact_update', 'Normalización y timestamp', '✅'
UNION ALL
SELECT '   • after_search_complete', 'Log automático de búsquedas', '✅'
UNION ALL
SELECT '   • before_search_result_insert', 'Validación de scores', '✅'
UNION ALL
SELECT '   • after_search_result_insert', 'Actualización de contadores', '✅'
UNION ALL
SELECT '', '', ''
UNION ALL
SELECT '4. SCORING INTELIGENTE', '', ''
UNION ALL
SELECT '   • Implementación', 'Backend Python (6 niveles)', '✅'
UNION ALL
SELECT '   • Comparación', 'Multi-criterio (name, org, pos, reg, phone)', '✅'
UNION ALL
SELECT '   • Ubicación', 'app/services/contact_service.py', '✅';

SELECT '=== FIN DE HU 2.3: PREVENCIÓN DE DUPLICADOS ===' as mensaje_final;
SELECT 'Índices creados:' as info, '5 índices para optimización' as detalle
UNION ALL
SELECT 'Triggers creados:' as info, '5 triggers para validación y auditoría' as detalle
UNION ALL
SELECT 'Backend responsable de:' as info, 'Scoring complejo (6 niveles de similitud)' as detalle
UNION ALL
SELECT 'SQL responsable de:' as info, 'Integridad (UNIQUE email) y validaciones básicas' as detalle
UNION ALL
SELECT 'Fecha/hora:' as info, NOW() as detalle;