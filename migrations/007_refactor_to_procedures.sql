-- MIGRACIÓN: 007 - REFACTORIZACIÓN A PROCEDIMIENTOS ALMACENADOS
-- Autor: Antigravity (DB Persistence Agent)
-- Fecha: 2026-02-08
-- =============================================
-- 1. USUARIOS Y AUTENTICACIÓN
-- =============================================
-- Obtener usuario por email (para login)
CREATE OR REPLACE FUNCTION fn_auth_get_user_by_email(p_email TEXT) RETURNS SETOF usuarios AS $$ BEGIN RETURN QUERY
SELECT *
FROM usuarios
WHERE email = p_email;
END;
$$ LANGUAGE plpgsql;
-- Actualizar último login
CREATE OR REPLACE FUNCTION fn_auth_update_last_login(p_user_id UUID) RETURNS VOID AS $$ BEGIN
UPDATE usuarios
SET last_login = CURRENT_TIMESTAMP
WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
-- Obtener todos los usuarios
CREATE OR REPLACE FUNCTION fn_user_get_all() RETURNS TABLE (
        id UUID,
        email VARCHAR,
        nombre_completo VARCHAR,
        telefono VARCHAR,
        rol VARCHAR,
        activo BOOLEAN,
        last_login TIMESTAMP,
        created_at TIMESTAMP
    ) AS $$ BEGIN RETURN QUERY
SELECT u.id,
    u.email,
    u.nombre_completo,
    u.telefono,
    u.rol,
    u.activo,
    u.last_login,
    u.created_at
FROM usuarios u
ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;
-- Obtener usuario por ID
CREATE OR REPLACE FUNCTION fn_user_get_by_id(p_id UUID) RETURNS TABLE (
        id UUID,
        email VARCHAR,
        nombre_completo VARCHAR,
        telefono VARCHAR,
        rol VARCHAR,
        activo BOOLEAN,
        last_login TIMESTAMP,
        created_at TIMESTAMP
    ) AS $$ BEGIN RETURN QUERY
SELECT u.id,
    u.email,
    u.nombre_completo,
    u.telefono,
    u.rol,
    u.activo,
    u.last_login,
    u.created_at
FROM usuarios u
WHERE u.id = p_id;
END;
$$ LANGUAGE plpgsql;
-- Crear usuario
CREATE OR REPLACE FUNCTION fn_user_create(
        p_email VARCHAR,
        p_password_hash VARCHAR,
        p_nombre_completo VARCHAR,
        p_telefono VARCHAR,
        p_rol VARCHAR,
        p_activo BOOLEAN
    ) RETURNS usuarios AS $$
DECLARE v_user usuarios;
BEGIN
INSERT INTO usuarios (
        email,
        password_hash,
        nombre_completo,
        telefono,
        rol,
        activo
    )
VALUES (
        p_email,
        p_password_hash,
        p_nombre_completo,
        p_telefono,
        p_rol,
        p_activo
    )
RETURNING * INTO v_user;
RETURN v_user;
END;
$$ LANGUAGE plpgsql;
-- Actualizar usuario (soporta actualización parcial vía JSONB)
CREATE OR REPLACE FUNCTION fn_user_update(p_id UUID, p_data JSONB) RETURNS usuarios AS $$
DECLARE v_user usuarios;
BEGIN
UPDATE usuarios
SET nombre_completo = COALESCE((p_data->>'nombre_completo'), nombre_completo),
    telefono = COALESCE((p_data->>'telefono'), telefono),
    rol = COALESCE((p_data->>'rol'), rol),
    activo = COALESCE((p_data->>'activo')::BOOLEAN, activo),
    password_hash = COALESCE((p_data->>'password_hash'), password_hash),
    updated_at = CURRENT_TIMESTAMP
WHERE id = p_id
RETURNING * INTO v_user;
RETURN v_user;
END;
$$ LANGUAGE plpgsql;
-- Eliminar usuario
CREATE OR REPLACE FUNCTION fn_user_delete(p_id UUID) RETURNS UUID AS $$
DECLARE v_deleted_id UUID;
BEGIN
DELETE FROM usuarios
WHERE id = p_id
RETURNING id INTO v_deleted_id;
RETURN v_deleted_id;
END;
$$ LANGUAGE plpgsql;
-- =============================================
-- 2. ENTIDADES (CRM)
-- =============================================
-- Obtener entidad con todos sus detalles (agrupados en JSON)
CREATE OR REPLACE FUNCTION fn_crm_get_entity(p_id UUID) RETURNS JSONB AS $$
DECLARE v_result JSONB;
BEGIN
SELECT jsonb_build_object(
        'id',
        e.id,
        'nombre_legal',
        e.nombre_legal,
        'slug',
        e.slug,
        'descripcion',
        e.descripcion,
        'razon_social',
        e.razon_social,
        'cuit',
        e.cuit,
        'tipo_entidad',
        e.tipo_entidad,
        'activa',
        e.activa,
        'fecha_creacion',
        e.fecha_creacion,
        'fecha_actualizacion',
        e.fecha_actualizacion,
        'validation_score',
        e.validation_score,
        'direcciones',
        (
            SELECT jsonb_agg(d.*)
            FROM direcciones d
            WHERE d.entidad_id = e.id
        ),
        'telefonos',
        (
            SELECT jsonb_agg(t.*)
            FROM telefonos t
            WHERE t.entidad_id = e.id
        ),
        'emails',
        (
            SELECT jsonb_agg(em.*)
            FROM emails em
            WHERE em.entidad_id = e.id
        ),
        'sitios_web',
        (
            SELECT jsonb_agg(s.*)
            FROM sitios_web s
            WHERE s.entidad_id = e.id
        ),
        'redes_sociales',
        (
            SELECT jsonb_agg(r.*)
            FROM redes_sociales r
            WHERE r.entidad_id = e.id
        ),
        'contactos',
        (
            SELECT jsonb_agg(c.*)
            FROM contactos c
            WHERE c.entidad_id = e.id
        )
    ) INTO v_result
FROM entidades e
WHERE e.id = p_id;
RETURN v_result;
END;
$$ LANGUAGE plpgsql;
-- Obtener entidades filtradas (ej: con/sin web)
CREATE OR REPLACE FUNCTION fn_crm_get_entities_filtered(
        p_has_web BOOLEAN DEFAULT NULL,
        p_limit INTEGER DEFAULT 50
    ) RETURNS TABLE (
        id UUID,
        nombre_legal VARCHAR,
        slug VARCHAR,
        tipo_entidad VARCHAR,
        activa BOOLEAN,
        validation_score DECIMAL,
        fecha_creacion TIMESTAMP,
        website VARCHAR
    ) AS $$ BEGIN RETURN QUERY
SELECT e.id,
    e.nombre_legal,
    e.slug,
    e.tipo_entidad,
    e.activa,
    e.validation_score,
    e.fecha_creacion,
    (
        SELECT url
        FROM sitios_web
        WHERE entidad_id = e.id
            AND es_principal = true
        LIMIT 1
    ) as website
FROM entidades e
WHERE (
        p_has_web IS NULL
        OR (
            p_has_web = true
            AND EXISTS (
                SELECT 1
                FROM sitios_web
                WHERE entidad_id = e.id
            )
        )
        OR (
            p_has_web = false
            AND NOT EXISTS (
                SELECT 1
                FROM sitios_web
                WHERE entidad_id = e.id
            )
        )
    )
ORDER BY e.fecha_creacion DESC
LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
-- Crear entidad
CREATE OR REPLACE FUNCTION fn_crm_create_entity(
        p_nombre_legal VARCHAR,
        p_slug VARCHAR,
        p_descripcion TEXT,
        p_razon_social VARCHAR,
        p_cuit VARCHAR,
        p_tipo_entidad VARCHAR
    ) RETURNS entidades AS $$
DECLARE v_entidad entidades;
BEGIN
INSERT INTO entidades (
        nombre_legal,
        slug,
        descripcion,
        razon_social,
        cuit,
        tipo_entidad
    )
VALUES (
        p_nombre_legal,
        p_slug,
        p_descripcion,
        p_razon_social,
        p_cuit,
        p_tipo_entidad
    )
RETURNING * INTO v_entidad;
RETURN v_entidad;
END;
$$ LANGUAGE plpgsql;
-- Actualizar entidad
CREATE OR REPLACE FUNCTION fn_crm_update_entity(p_id UUID, p_data JSONB) RETURNS entidades AS $$
DECLARE v_entidad entidades;
BEGIN
UPDATE entidades
SET nombre_legal = COALESCE((p_data->>'nombre_legal'), nombre_legal),
    slug = COALESCE((p_data->>'slug'), slug),
    descripcion = COALESCE((p_data->>'descripcion'), descripcion),
    razon_social = COALESCE((p_data->>'razon_social'), razon_social),
    cuit = COALESCE((p_data->>'cuit'), cuit),
    tipo_entidad = COALESCE((p_data->>'tipo_entidad'), tipo_entidad),
    activa = COALESCE((p_data->>'activa')::BOOLEAN, activa),
    fecha_actualizacion = CURRENT_TIMESTAMP
WHERE id = p_id
RETURNING * INTO v_entidad;
RETURN v_entidad;
END;
$$ LANGUAGE plpgsql;
-- =============================================
-- 3. CATEGORÍAS
-- =============================================
-- Obtener todas las categorías
CREATE OR REPLACE FUNCTION fn_category_get_all() RETURNS SETOF categorias AS $$ BEGIN RETURN QUERY
SELECT *
FROM categorias
ORDER BY nivel_profundidad ASC,
    orden ASC,
    nombre ASC;
END;
$$ LANGUAGE plpgsql;
-- Obtener categoría por ID
CREATE OR REPLACE FUNCTION fn_category_get_by_id(p_id UUID) RETURNS SETOF categorias AS $$ BEGIN RETURN QUERY
SELECT *
FROM categorias
WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;
-- Crear categoría
CREATE OR REPLACE FUNCTION fn_category_create(
        p_nombre VARCHAR,
        p_slug VARCHAR,
        p_descripcion TEXT,
        p_icono_url VARCHAR,
        p_color_hex VARCHAR,
        p_parent_id UUID,
        p_nivel_profundidad INTEGER,
        p_orden INTEGER
    ) RETURNS categorias AS $$
DECLARE v_cat categorias;
BEGIN
INSERT INTO categorias (
        nombre,
        slug,
        descripcion,
        icono_url,
        color_hex,
        parent_id,
        nivel_profundidad,
        orden
    )
VALUES (
        p_nombre,
        p_slug,
        p_descripcion,
        p_icono_url,
        p_color_hex,
        p_parent_id,
        p_nivel_profundidad,
        p_orden
    )
RETURNING * INTO v_cat;
RETURN v_cat;
END;
$$ LANGUAGE plpgsql;
-- Actualizar categoría
CREATE OR REPLACE FUNCTION fn_category_update(p_id UUID, p_data JSONB) RETURNS categorias AS $$
DECLARE v_cat categorias;
BEGIN
UPDATE categorias
SET nombre = COALESCE((p_data->>'nombre'), nombre),
    slug = COALESCE((p_data->>'slug'), slug),
    descripcion = COALESCE((p_data->>'descripcion'), descripcion),
    icono_url = COALESCE((p_data->>'icono_url'), icono_url),
    color_hex = COALESCE((p_data->>'color_hex'), color_hex),
    parent_id = CASE
        WHEN p_data ? 'parent_id' THEN (p_data->>'parent_id')::UUID
        ELSE parent_id
    END,
    nivel_profundidad = COALESCE(
        (p_data->>'nivel_profundidad')::INTEGER,
        nivel_profundidad
    ),
    orden = COALESCE((p_data->>'orden')::INTEGER, orden),
    activa = COALESCE((p_data->>'activa')::BOOLEAN, activa),
    updated_at = CURRENT_TIMESTAMP
WHERE id = p_id
RETURNING * INTO v_cat;
RETURN v_cat;
END;
$$ LANGUAGE plpgsql;
-- Eliminar categoría
CREATE OR REPLACE FUNCTION fn_category_delete(p_id UUID) RETURNS BOOLEAN AS $$
DECLARE v_deleted_id UUID;
BEGIN
DELETE FROM categorias
WHERE id = p_id
RETURNING id INTO v_deleted_id;
RETURN v_deleted_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
-- =============================================
-- 4. DATA RAW (GOOGLE MAPS)
-- =============================================
-- Obtener data pendiente de procesar
CREATE OR REPLACE FUNCTION fn_raw_data_get_pending(p_limit INTEGER DEFAULT 100) RETURNS SETOF data_google_maps AS $$ BEGIN RETURN QUERY
SELECT *
FROM data_google_maps
WHERE etiqueta = 'nuevo'
ORDER BY created_at DESC
LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
-- Aprobar y convertir data cruda en Entidad
CREATE OR REPLACE FUNCTION fn_raw_data_approve_and_convert(p_raw_id UUID) RETURNS JSONB AS $$
DECLARE v_raw data_google_maps;
v_new_entity_id UUID;
v_slug TEXT;
v_result JSONB;
BEGIN -- 1. Obtener la data cruda
SELECT * INTO v_raw
FROM data_google_maps
WHERE id = p_raw_id;
IF v_raw IS NULL THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Registro no encontrado'
);
END IF;
-- 2. Crear slug básico
v_slug := lower(
    regexp_replace(v_raw.nombre, '[^a-zA-Z0-9]+', '-', 'g')
) || '-' || substring(p_raw_id::text, 1, 4);
-- 3. Crear Entidad
INSERT INTO entidades (
        nombre_legal,
        slug,
        validation_score,
        activa,
        fecha_creacion
    )
VALUES (
        v_raw.nombre,
        v_slug,
        COALESCE(v_raw.rating, 0),
        true,
        CURRENT_TIMESTAMP
    )
RETURNING id INTO v_new_entity_id;
-- 4. Insertar Teléfono si existe
IF v_raw.telefono IS NOT NULL
AND v_raw.telefono <> '' THEN
INSERT INTO telefonos (
        entidad_id,
        numero,
        tipo_telefonico,
        validado,
        es_principal
    )
VALUES (
        v_new_entity_id,
        v_raw.telefono,
        'fijo',
        true,
        true
    );
END IF;
-- 5. Insertar Sitio Web si existe
IF v_raw.website IS NOT NULL
AND v_raw.website <> '' THEN
INSERT INTO sitios_web (entidad_id, url, validado, es_principal)
VALUES (v_new_entity_id, v_raw.website, true, true);
END IF;
-- 6. Marcar como procesado y vincular
UPDATE data_google_maps
SET etiqueta = 'procesado',
    matched_entidad_id = v_new_entity_id,
    processed_at = CURRENT_TIMESTAMP
WHERE id = p_raw_id;
RETURN jsonb_build_object('success', true, 'entity_id', v_new_entity_id);
END;
$$ LANGUAGE plpgsql;
-- =============================================
-- 5. ANALYTICS & VALIDATION
-- =============================================
-- Estadísticas diarias de ingesta
CREATE OR REPLACE FUNCTION fn_analytics_get_daily_stats() RETURNS TABLE (extracted BIGINT, validated BIGINT) AS $$ BEGIN RETURN QUERY
SELECT (
        SELECT COUNT(*)
        FROM data_google_maps
        WHERE created_at >= CURRENT_DATE
    ),
    (
        SELECT COUNT(*)
        FROM entidades
        WHERE fecha_creacion >= CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;
-- Performance de Manager
CREATE OR REPLACE FUNCTION fn_analytics_get_manager_performance(p_manager_id UUID) RETURNS TABLE (resolved BIGINT, pending BIGINT) AS $$ BEGIN RETURN QUERY
SELECT COUNT(*) FILTER (
        WHERE status = 'Closed'
    ),
    COUNT(*) FILTER (
        WHERE status != 'Closed'
    )
FROM tasks_tickets
WHERE updated_by = p_manager_id;
END;
$$ LANGUAGE plpgsql;
-- Validar duplicados básicos
CREATE OR REPLACE FUNCTION fn_validation_check_duplicates(p_nombre VARCHAR, p_cuit VARCHAR) RETURNS BOOLEAN AS $$ BEGIN RETURN (
        SELECT NOT EXISTS (
                SELECT 1
                FROM entidades
                WHERE nombre_legal = p_nombre
                    OR (
                        cuit IS NOT NULL
                        AND cuit = p_cuit
                    )
            )
    );
END;
$$ LANGUAGE plpgsql;