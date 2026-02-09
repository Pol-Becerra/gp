-- MIGRACIÓN: 011 - GESTIÓN DE ETIQUETAS
-- Autor: Antigravity
-- 1. Obtener todas las etiquetas
CREATE OR REPLACE FUNCTION fn_crm_get_all_tags(p_aplicable_a TEXT DEFAULT NULL) RETURNS TABLE (
        id UUID,
        nombre VARCHAR,
        descripcion TEXT,
        tipo VARCHAR,
        color_hex VARCHAR,
        icono VARCHAR,
        aplicable_a TEXT [],
        activa BOOLEAN
    ) AS $$ BEGIN RETURN QUERY
SELECT t.id,
    t.nombre,
    t.descripcion,
    t.tipo,
    t.color_hex,
    t.icono,
    t.aplicable_a,
    t.activa
FROM etiquetas t
WHERE (
        p_aplicable_a IS NULL
        OR p_aplicable_a = ANY(t.aplicable_a)
    )
    AND t.activa = true
ORDER BY t.nombre ASC;
END;
$$ LANGUAGE plpgsql;
-- 2. Crear una nueva etiqueta
CREATE OR REPLACE FUNCTION fn_crm_create_tag(
        p_nombre VARCHAR,
        p_descripcion TEXT DEFAULT NULL,
        p_tipo VARCHAR DEFAULT 'segmentacion',
        p_color_hex VARCHAR DEFAULT '#cccccc',
        p_icono VARCHAR DEFAULT NULL,
        p_aplicable_a TEXT [] DEFAULT ARRAY ['entidades']
    ) RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
INSERT INTO etiquetas (
        nombre,
        descripcion,
        tipo,
        color_hex,
        icono,
        aplicable_a
    )
VALUES (
        p_nombre,
        p_descripcion,
        p_tipo,
        p_color_hex,
        p_icono,
        p_aplicable_a
    ) ON CONFLICT (nombre) DO
UPDATE
SET descripcion = EXCLUDED.descripcion,
    tipo = EXCLUDED.tipo,
    color_hex = EXCLUDED.color_hex,
    icono = EXCLUDED.icono,
    aplicable_a = EXCLUDED.aplicable_a,
    activa = true
RETURNING id INTO v_id;
RETURN v_id;
END;
$$ LANGUAGE plpgsql;