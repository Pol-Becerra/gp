-- MIGRACIÓN: 008 - MEJORAS EN CRM (ADVANCED LIST & DELETE)
-- Autor: Antigravity
-- Eliminar entidad (soft delete o hard delete según preferencia, aquí haremos hard delete con cascade)
CREATE OR REPLACE FUNCTION fn_crm_delete_entity(p_id UUID) RETURNS BOOLEAN AS $$
DECLARE v_found BOOLEAN;
BEGIN -- Verificar si existe antes de borrar
SELECT EXISTS(
        SELECT 1
        FROM entidades
        WHERE id = p_id
    ) INTO v_found;
IF NOT v_found THEN RETURN FALSE;
END IF;
DELETE FROM entidades
WHERE id = p_id;
RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
-- Obtener entidades con búsqueda avanzada y paginación
DROP FUNCTION IF EXISTS fn_crm_get_entities_advanced(INTEGER, INTEGER, TEXT, BOOLEAN);
CREATE OR REPLACE FUNCTION fn_crm_get_entities_advanced(
        p_limit INTEGER DEFAULT 50,
        p_offset INTEGER DEFAULT 0,
        p_search TEXT DEFAULT NULL,
        p_has_web BOOLEAN DEFAULT NULL
    ) RETURNS TABLE (
        id UUID,
        nombre_legal VARCHAR,
        slug VARCHAR,
        cuit VARCHAR,
        tipo_entidad VARCHAR,
        activa BOOLEAN,
        validation_score DECIMAL,
        fecha_creacion TIMESTAMP,
        website VARCHAR,
        total_count BIGINT
    ) AS $$ BEGIN RETURN QUERY WITH filtered_entities AS (
        SELECT e.id,
            e.nombre_legal,
            e.slug,
            e.cuit,
            e.tipo_entidad,
            e.activa,
            e.validation_score,
            e.fecha_creacion,
            (
                SELECT s.url
                FROM sitios_web s
                WHERE s.entidad_id = e.id
                    AND s.es_principal = true
                LIMIT 1
            ) as website
        FROM entidades e
        WHERE (
                p_search IS NULL
                OR e.nombre_legal ILIKE '%' || p_search || '%'
                OR e.cuit ILIKE '%' || p_search || '%'
                OR e.slug ILIKE '%' || p_search || '%'
            )
            AND (
                p_has_web IS NULL
                OR (
                    p_has_web = true
                    AND EXISTS (
                        SELECT 1
                        FROM sitios_web s
                        WHERE s.entidad_id = e.id
                    )
                )
                OR (
                    p_has_web = false
                    AND NOT EXISTS (
                        SELECT 1
                        FROM sitios_web s
                        WHERE s.entidad_id = e.id
                    )
                )
            )
    )
SELECT f.id,
    f.nombre_legal,
    f.slug,
    f.cuit,
    f.tipo_entidad,
    f.activa,
    f.validation_score,
    f.fecha_creacion,
    f.website,
    (
        SELECT COUNT(*)
        FROM filtered_entities
    )::BIGINT as total_count
FROM filtered_entities f
ORDER BY f.fecha_creacion DESC
LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;