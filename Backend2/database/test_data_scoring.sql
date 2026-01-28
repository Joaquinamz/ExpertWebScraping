-- ======================================================
-- DATOS DE PRUEBA PARA SISTEMA DE SCORING
-- Script para insertar contactos con diferentes niveles de similitud
-- y probar todos los scores posibles (1.0, 0.9, 0.7, 0.6, 0.4, 0.3)
-- ======================================================

USE expert_finder_db;

SELECT '=== INICIANDO CARGA DE DATOS DE PRUEBA PARA SCORING ===' as inicio;

-- Limpiar datos de prueba anteriores
DELETE FROM search_results WHERE contact_id IN (SELECT id FROM contacts WHERE email LIKE '%@scoring.test');
DELETE FROM contacts WHERE email LIKE '%@scoring.test';

SELECT 'Datos de prueba anteriores eliminados' as paso;

-- ======================================================
-- CONTACTO BASE #1: Totalmente único (SCORE esperado: 1.0)
-- ======================================================
INSERT INTO contacts (
    name, organization, position, email, phone, region, 
    source_url, source_type, research_lines
) VALUES (
    'Dr. Ana Martínez Rodríguez',
    'Universidad de Chile',
    'Directora de Investigación',
    'ana.martinez@scoring.test',
    '+56 9 8765 4321',
    'Metropolitana',
    'https://uchile.cl/investigadores/ana-martinez',
    'web',
    '["Inteligencia Artificial", "Machine Learning"]'
);

SELECT 'Contacto #1 insertado: Ana Martínez (BASE - ÚNICO)' as paso;

-- ======================================================
-- CONTACTO #2: Solo 1 dato duplicado - misma organización (SCORE esperado: 0.9)
-- ======================================================
INSERT INTO contacts (
    name, organization, position, email, phone, region, 
    source_url, source_type
) VALUES (
    'Dr. Carlos Pérez Soto',
    'Universidad de Chile',  -- DUPLICADO: misma org que Ana
    'Profesor Titular',
    'carlos.perez@scoring.test',
    '+56 9 7654 3210',
    'Valparaíso',
    'https://investigacion.cl/carlos-perez',
    'web'
);

SELECT 'Contacto #2 insertado: Carlos Pérez (1 dato duplicado - org)' as paso;

-- ======================================================
-- CONTACTO #3: Solo nombre duplicado (SCORE esperado: 0.9)
-- ======================================================
INSERT INTO contacts (
    name, organization, position, email, phone, region, 
    source_url, source_type
) VALUES (
    'Dr. Ana Martínez Rodríguez',  -- DUPLICADO: mismo nombre que contacto #1
    'Pontificia Universidad Católica',
    'Investigadora Senior',
    'ana.martinez.puc@scoring.test',
    '+56 9 6543 2109',
    'Biobío',
    'https://puc.cl/investigadores/ana-martinez',
    'web'
);

SELECT 'Contacto #3 insertado: Ana Martínez PUC (nombre duplicado)' as paso;

-- ======================================================
-- CONTACTO #4: 2 datos secundarios duplicados (org + región) (SCORE esperado: 0.9)
-- ======================================================
INSERT INTO contacts (
    name, organization, position, email, phone, region, 
    source_url, source_type
) VALUES (
    'Dra. María González Torres',
    'Universidad de Chile',  -- DUPLICADO: misma org que Ana
    'Profesora Asociada',
    'maria.gonzalez@scoring.test',
    '+56 9 5432 1098',
    'Metropolitana',  -- DUPLICADO: misma región que Ana
    'https://uchile.cl/investigadores/maria-gonzalez',
    'web'
);

SELECT 'Contacto #4 insertado: María González (org + región duplicados)' as paso;

-- ======================================================
-- CONTACTO #5: Solo phone duplicado (SCORE esperado: 0.6)
-- ======================================================
INSERT INTO contacts (
    name, organization, position, email, phone, region, 
    source_url, source_type
) VALUES (
    'Dr. Roberto Silva Campos',
    'Universidad de Concepción',
    'Investigador Postdoctoral',
    'roberto.silva@scoring.test',
    '+56 9 8765 4321',  -- DUPLICADO: mismo phone que Ana (#1)
    'Biobío',
    'https://udec.cl/investigadores/roberto-silva',
    'web'
);

SELECT 'Contacto #5 insertado: Roberto Silva (phone duplicado)' as paso;

-- ======================================================
-- CONTACTO #6: Nombre + 1 dato secundario (org) (SCORE esperado: 0.7)
-- ======================================================
INSERT INTO contacts (
    name, organization, position, email, phone, region, 
    source_url, source_type
) VALUES (
    'Dr. Carlos Pérez Soto',  -- DUPLICADO: mismo nombre que contacto #2
    'Universidad de Chile',  -- DUPLICADO: misma org que Ana (#1) y Carlos (#2)
    'Investigador Principal',
    'carlos.perez.uchile@scoring.test',
    '+56 9 4321 0987',
    'Araucanía',
    'https://uchile.cl/investigadores/carlos-perez',
    'web'
);

SELECT 'Contacto #6 insertado: Carlos Pérez UCH (nombre + org)' as paso;

-- ======================================================
-- CONTACTO #7: Nombre + position + región (SCORE esperado: 0.4)
-- ======================================================
INSERT INTO contacts (
    name, organization, position, email, phone, region, 
    source_url, source_type
) VALUES (
    'Dr. Ana Martínez Rodríguez',  -- DUPLICADO: mismo nombre que #1
    'Universidad de Santiago',
    'Directora de Investigación',  -- DUPLICADO: misma position que #1
    'ana.martinez.usach@scoring.test',
    '+56 9 3210 9876',
    'Metropolitana',  -- DUPLICADO: misma región que #1
    'https://usach.cl/investigadores/ana-martinez',
    'web'
);

SELECT 'Contacto #7 insertado: Ana Martínez USACH (nombre + position + región)' as paso;

-- ======================================================
-- CONTACTO #8: URL duplicado (SCORE esperado: 0.3)
-- ======================================================
-- Nota: Este contacto NO se insertará porque email es UNIQUE en DB
-- Pero probamos con diferente email, misma URL
INSERT INTO contacts (
    name, organization, position, email, phone, region, 
    source_url, source_type
) VALUES (
    'Dra. Patricia Ramírez León',
    'Universidad Técnica Federico Santa María',
    'Académica Investigadora',
    'patricia.ramirez@scoring.test',
    '+56 9 2109 8765',
    'Valparaíso',
    'https://uchile.cl/investigadores/ana-martinez',  -- DUPLICADO: misma URL que Ana (#1)
    'web'
);

SELECT 'Contacto #8 insertado: Patricia Ramírez (URL duplicado)' as paso;

-- ======================================================
-- CONTACTO #9: Nombre + org + position (3 matches) (SCORE esperado: 0.3-0.4)
-- ======================================================
INSERT INTO contacts (
    name, organization, position, email, phone, region, 
    source_url, source_type
) VALUES (
    'Dr. Carlos Pérez Soto',  -- DUPLICADO: mismo nombre que #2 y #6
    'Universidad de Chile',  -- DUPLICADO: misma org
    'Profesor Titular',  -- DUPLICADO: misma position que #2
    'carlos.perez.titular@scoring.test',
    '+56 9 1098 7654',
    'Los Lagos',
    'https://uchile.cl/investigadores/carlos-perez-titular',
    'web'
);

SELECT 'Contacto #9 insertado: Carlos Pérez Titular (nombre + org + position)' as paso;

-- ======================================================
-- CONTACTO #10: Solo región duplicada (SCORE esperado: 0.9)
-- ======================================================
INSERT INTO contacts (
    name, organization, position, email, phone, region, 
    source_url, source_type
) VALUES (
    'Dr. Fernando Núñez Vargas',
    'Universidad Austral de Chile',
    'Profesor Asistente',
    'fernando.nunez@scoring.test',
    '+56 9 0987 6543',
    'Metropolitana',  -- DUPLICADO: misma región que Ana (#1)
    'https://uach.cl/investigadores/fernando-nunez',
    'web'
);

SELECT 'Contacto #10 insertado: Fernando Núñez (región duplicada)' as paso;

-- ======================================================
-- CONTACTO #11: Position duplicada (SCORE esperado: 0.9)
-- ======================================================
INSERT INTO contacts (
    name, organization, position, email, phone, region, 
    source_url, source_type
) VALUES (
    'Dra. Laura Jiménez Morales',
    'Universidad de Valparaíso',
    'Directora de Investigación',  -- DUPLICADO: misma position que Ana (#1)
    'laura.jimenez@scoring.test',
    '+56 9 9876 5432',
    'Valparaíso',
    'https://uv.cl/investigadores/laura-jimenez',
    'web'
);

SELECT 'Contacto #11 insertado: Laura Jiménez (position duplicada)' as paso;

-- ======================================================
-- CONTACTO #12: 3 datos secundarios (org + position + región) sin nombre (SCORE esperado: 0.9)
-- ======================================================
INSERT INTO contacts (
    name, organization, position, email, phone, region, 
    source_url, source_type
) VALUES (
    'Dr. Andrés Rojas Fuentes',
    'Universidad de Chile',  -- DUPLICADO
    'Directora de Investigación',  -- DUPLICADO (sí, dice "Directora" pero es el mismo cargo)
    'andres.rojas@scoring.test',
    '+56 9 8765 4322',
    'Metropolitana',  -- DUPLICADO
    'https://uchile.cl/investigadores/andres-rojas',
    'web'
);

SELECT 'Contacto #12 insertado: Andrés Rojas (3 datos secundarios sin nombre)' as paso;

-- ======================================================
-- CONTACTO #13: Totalmente único #2 (SCORE esperado: 1.0)
-- ======================================================
INSERT INTO contacts (
    name, organization, position, email, phone, region, 
    source_url, source_type, research_lines
) VALUES (
    'Dr. Sebastián Vargas Muñoz',
    'Universidad de Talca',
    'Investigador Senior en Biotecnología',
    'sebastian.vargas@scoring.test',
    '+56 9 7777 8888',
    'Maule',
    'https://utalca.cl/investigadores/sebastian-vargas',
    'web',
    '["Biotecnología", "Genómica", "Bioinformática"]'
);

SELECT 'Contacto #13 insertado: Sebastián Vargas (ÚNICO)' as paso;

-- ======================================================
-- CONTACTO #14: Nombre + phone (2 datos) (SCORE esperado: 0.4)
-- ======================================================
INSERT INTO contacts (
    name, organization, position, email, phone, region, 
    source_url, source_type
) VALUES (
    'Dra. María González Torres',  -- DUPLICADO: mismo nombre que #4
    'Universidad de Antofagasta',
    'Investigadora Adjunta',
    'maria.gonzalez.uantof@scoring.test',
    '+56 9 5432 1098',  -- DUPLICADO: mismo phone que #4
    'Antofagasta',
    'https://uantof.cl/investigadores/maria-gonzalez',
    'web'
);

SELECT 'Contacto #14 insertado: María González Antof (nombre + phone)' as paso;

-- ======================================================
-- CONTACTO #15: 4+ coincidencias (muy sospechoso) (SCORE esperado: 0.2)
-- ======================================================
INSERT INTO contacts (
    name, organization, position, email, phone, region, 
    source_url, source_type
) VALUES (
    'Dr. Ana Martínez Rodríguez',  -- DUPLICADO: nombre
    'Universidad de Chile',  -- DUPLICADO: org
    'Directora de Investigación',  -- DUPLICADO: position
    'ana.martinez.duplicada@scoring.test',
    '+56 9 8765 4321',  -- DUPLICADO: phone
    'Metropolitana',  -- DUPLICADO: región (5 coincidencias!)
    'https://uchile.cl/investigadores/ana-martinez-dup',
    'web'
);

SELECT 'Contacto #15 insertado: Ana Martínez Duplicada (5 coincidencias - MUY SOSPECHOSO)' as paso;

-- ======================================================
-- RESUMEN DE CONTACTOS INSERTADOS
-- ======================================================
SELECT '=== RESUMEN DE CONTACTOS DE PRUEBA ===' as titulo;

SELECT 
    id,
    name as nombre,
    organization as organizacion,
    SUBSTRING(email, 1, 30) as email,
    validation_score as score,
    CASE 
        WHEN validation_score = 1.0 THEN '✅ ÚNICO'
        WHEN validation_score >= 0.9 THEN '🟢 BAJA SIMILITUD'
        WHEN validation_score >= 0.7 THEN '🟡 SIMILITUD MEDIA'
        WHEN validation_score >= 0.6 THEN '🟠 SIMILITUD ALTA'
        WHEN validation_score >= 0.4 THEN '🔴 MUY SIMILAR'
        ELSE '❌ DUPLICADO PROBABLE'
    END as estado
FROM contacts 
WHERE email LIKE '%@scoring.test'
ORDER BY validation_score DESC, id;

-- Estadísticas por nivel de score
SELECT '=== DISTRIBUCIÓN POR NIVEL DE SCORE ===' as titulo_stats;

SELECT 
    CASE 
        WHEN validation_score = 1.0 THEN '1.0 - Único'
        WHEN validation_score >= 0.9 THEN '0.9 - Baja similitud'
        WHEN validation_score >= 0.7 THEN '0.7 - Similitud media'
        WHEN validation_score >= 0.6 THEN '0.6 - Similitud alta'
        WHEN validation_score >= 0.4 THEN '0.4 - Muy similar'
        WHEN validation_score >= 0.3 THEN '0.3 - URL duplicado'
        ELSE '0.2 - Duplicado probable'
    END as nivel_score,
    COUNT(*) as cantidad,
    GROUP_CONCAT(name SEPARATOR '; ') as contactos
FROM contacts 
WHERE email LIKE '%@scoring.test'
GROUP BY 
    CASE 
        WHEN validation_score = 1.0 THEN '1.0 - Único'
        WHEN validation_score >= 0.9 THEN '0.9 - Baja similitud'
        WHEN validation_score >= 0.7 THEN '0.7 - Similitud media'
        WHEN validation_score >= 0.6 THEN '0.6 - Similitud alta'
        WHEN validation_score >= 0.4 THEN '0.4 - Muy similar'
        WHEN validation_score >= 0.3 THEN '0.3 - URL duplicado'
        ELSE '0.2 - Duplicado probable'
    END
ORDER BY MIN(validation_score) DESC;

-- Contactos que se mostrarán en el listado (score > 0.6)
SELECT '=== CONTACTOS VÁLIDOS (score > 0.6) ===' as titulo_validos;

SELECT 
    COUNT(*) as total_validos,
    CONCAT(ROUND((COUNT(*) / (SELECT COUNT(*) FROM contacts WHERE email LIKE '%@scoring.test')) * 100, 1), '%') as porcentaje
FROM contacts 
WHERE email LIKE '%@scoring.test'
AND validation_score > 0.6;

-- Contactos que se consideran duplicados (score <= 0.6)
SELECT '=== CONTACTOS DUPLICADOS (score <= 0.6) ===' as titulo_duplicados;

SELECT 
    COUNT(*) as total_duplicados,
    CONCAT(ROUND((COUNT(*) / (SELECT COUNT(*) FROM contacts WHERE email LIKE '%@scoring.test')) * 100, 1), '%') as porcentaje
FROM contacts 
WHERE email LIKE '%@scoring.test'
AND validation_score <= 0.6;

SELECT '=== DATOS DE PRUEBA CARGADOS EXITOSAMENTE ===' as fin;
SELECT 'Puedes consultar estos contactos en: GET http://localhost:8080/contacts/?min_validation_score=0' as info;
SELECT 'Para ver solo válidos (por defecto): GET http://localhost:8080/contacts/' as info2;
