-- ============================================
-- HU 2.1: Creación de esquema y tablas
-- ============================================

-- -----------------------------------------------------
-- 1. CREAR BASE DE DATOS
-- -----------------------------------------------------
DROP DATABASE IF EXISTS expert_finder_db;
CREATE DATABASE expert_finder_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE expert_finder_db;

-- -----------------------------------------------------
-- 2. TABLA: searches
-- -----------------------------------------------------
CREATE TABLE searches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    keywords TEXT NOT NULL,
    area VARCHAR(100),
    region VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    finished_at TIMESTAMP NULL,
    results_count INT DEFAULT 0,
    error_message TEXT,
    ip_hash VARCHAR(64),
    user_agent TEXT,
    search_config JSON
);

-- -----------------------------------------------------
-- 3. TABLA: contacts
-- NOTA: Se usa TINYINT(1) para compatibilidad con SQLAlchemy Boolean
-- -----------------------------------------------------
CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    organization VARCHAR(200),
    position VARCHAR(200),
    email VARCHAR(150),
    phone VARCHAR(50),
    region VARCHAR(100),
    source_url VARCHAR(500) NOT NULL,
    source_type VARCHAR(50),
    research_lines JSON,
    is_valid TINYINT(1) DEFAULT 1 COMMENT 'SQLAlchemy Boolean type',
    validation_score DECIMAL(3,2) DEFAULT 1.00 COMMENT 'Score: 0.3-1.0 según similitud',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- 4. TABLA: search_results (relación N:M) CON FKs REALES
-- -----------------------------------------------------
CREATE TABLE search_results (
    search_id INT NOT NULL,
    contact_id INT NOT NULL,
    found_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    relevance_score DECIMAL(3,2) DEFAULT 1.00,
    PRIMARY KEY (search_id, contact_id),
    CONSTRAINT fk_search_results_searches 
        FOREIGN KEY (search_id) 
        REFERENCES searches(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_search_results_contacts 
        FOREIGN KEY (contact_id) 
        REFERENCES contacts(id) 
        ON DELETE CASCADE
);

-- -----------------------------------------------------
-- 5. TABLA: search_logs
-- -----------------------------------------------------
CREATE TABLE search_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    search_id INT NOT NULL,
    source_url TEXT NOT NULL,
    source_type VARCHAR(50),
    status VARCHAR(50),
    contacts_found INT DEFAULT 0,
    error_message TEXT,
    response_time_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_search_logs_searches 
        FOREIGN KEY (search_id) 
        REFERENCES searches(id) 
        ON DELETE CASCADE
);

-- -----------------------------------------------------
-- 6. TABLA: api_sources (opcional para fase 2)
-- -----------------------------------------------------
CREATE TABLE api_sources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    base_url TEXT NOT NULL,
    api_key_encrypted TEXT,
    auth_type VARCHAR(50),
    rate_limit INT DEFAULT 100,
    is_active TINYINT(1) DEFAULT 1 COMMENT 'SQLAlchemy Boolean type',
    last_used TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- 7. TABLA: system_config (opcional)
-- -----------------------------------------------------
CREATE TABLE system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- VERIFICACIÓN: Mostrar tablas creadas
-- -----------------------------------------------------
SELECT '=== HU 2.1 COMPLETADA ===' as mensaje;
SELECT 'Tablas creadas:' as resultado;
SHOW TABLES;