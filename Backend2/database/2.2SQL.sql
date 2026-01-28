-- ============================================
-- HU 2.2: Implementación de restricciones de integridad
-- ============================================

USE expert_finder_db;

-- -----------------------------------------------------
-- 1. RESTRICCIONES EN searches
-- -----------------------------------------------------
ALTER TABLE searches
MODIFY session_id VARCHAR(100) NOT NULL,
MODIFY keywords TEXT NOT NULL,
ADD CONSTRAINT chk_status CHECK (status IN ('pending', 'running', 'completed', 'error', 'cancelled')),
ADD CONSTRAINT chk_results_count CHECK (results_count >= 0),
ADD INDEX idx_searches_session (session_id),
ADD INDEX idx_searches_status (status),
ADD INDEX idx_searches_created (created_at DESC);

-- -----------------------------------------------------
-- 2. RESTRICCIONES EN contacts
-- IMPORTANTE: validation_score ahora sigue la nueva lógica del backend:
--   1.0 = Único sin similitudes
--   0.9 = Solo 1 dato duplicado (excepto phone/email) O 2-3 de org/position/region
--   0.7 = 1 dato de org/position/region + name
--   0.6 = Solo phone duplicado
--   0.4 = 2-3 datos de org/position/region + name
--   0.3 = Email + URL duplicados
-- -----------------------------------------------------
ALTER TABLE contacts
MODIFY name VARCHAR(200) NOT NULL,
MODIFY source_url VARCHAR(500) NOT NULL,
MODIFY email VARCHAR(150) NULL,
ADD CONSTRAINT chk_email_format CHECK (email IS NULL OR email LIKE '%_@__%.__%'),
ADD CONSTRAINT chk_phone_format CHECK (phone IS NULL OR phone REGEXP '^[0-9+][0-9 -]*$'),
ADD CONSTRAINT chk_validation_score CHECK (validation_score BETWEEN 0.00 AND 1.00),
ADD CONSTRAINT uc_contact_email_unique UNIQUE (email),
ADD INDEX idx_contacts_email (email),
ADD INDEX idx_contacts_region (region),
ADD INDEX idx_contacts_organization (organization),
ADD INDEX idx_contacts_valid (is_valid),
ADD INDEX idx_contacts_validation_score (validation_score);

-- NOTA: La lógica de scoring compleja se maneja en el backend (Python)
-- Esta restricción solo valida el rango del score

-- -----------------------------------------------------
-- 3. RESTRICCIONES EN search_results
-- -----------------------------------------------------
ALTER TABLE search_results
ADD CONSTRAINT chk_relevance_score CHECK (relevance_score BETWEEN 0.00 AND 1.00),
ADD INDEX idx_results_search (search_id),
ADD INDEX idx_results_contact (contact_id),
ADD INDEX idx_results_relevance (relevance_score DESC);

-- -----------------------------------------------------
-- 4. RESTRICCIONES EN search_logs
-- -----------------------------------------------------
ALTER TABLE search_logs
MODIFY source_url TEXT NOT NULL,
ADD CONSTRAINT chk_contacts_found CHECK (contacts_found >= 0),
ADD CONSTRAINT chk_response_time CHECK (response_time_ms >= 0),
ADD INDEX idx_logs_search (search_id),
ADD INDEX idx_logs_created (created_at);

-- -----------------------------------------------------
-- 5. RESTRICCIONES EN api_sources
-- -----------------------------------------------------
ALTER TABLE api_sources
MODIFY name VARCHAR(100) NOT NULL,
MODIFY base_url TEXT NOT NULL,
ADD CONSTRAINT chk_rate_limit CHECK (rate_limit > 0),
ADD CONSTRAINT chk_base_url CHECK (base_url LIKE 'http%'),
ADD INDEX idx_api_active (is_active);

-- -----------------------------------------------------
-- 6. RESTRICCIONES EN system_config
-- -----------------------------------------------------
ALTER TABLE system_config
MODIFY config_key VARCHAR(100) NOT NULL,
MODIFY config_value TEXT NOT NULL;

-- -----------------------------------------------------
-- VERIFICACIÓN: Mostrar restricciones aplicadas
-- -----------------------------------------------------
SELECT '=== HU 2.2 COMPLETADA ===' as mensaje;
SELECT 
    TABLE_NAME as 'Tabla',
    CONSTRAINT_NAME as 'Restricción',
    CONSTRAINT_TYPE as 'Tipo'
FROM information_schema.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'expert_finder_db'
ORDER BY TABLE_NAME, CONSTRAINT_TYPE;