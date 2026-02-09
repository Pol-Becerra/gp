-- MIGRACIÓN: 013 - FIX RELACIONES Y CONSTRAINTS
-- Autor: Antigravity
-- 1. Agregar UNIQUE constraint a entidad_etiquetas si no existe
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE tablename = 'entidad_etiquetas'
        AND indexname = 'idx_entidad_etiquetas_unique'
) THEN CREATE UNIQUE INDEX idx_entidad_etiquetas_unique ON entidad_etiquetas(entidad_id, etiqueta_id);
END IF;
END $$;
-- 2. Asegurar que fn_crm_link_tag use el ON CONFLICT correctamente
CREATE OR REPLACE FUNCTION fn_crm_link_tag(p_entidad_id UUID, p_etiqueta_id UUID) RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
INSERT INTO entidad_etiquetas (entidad_id, etiqueta_id)
VALUES (p_entidad_id, p_etiqueta_id) ON CONFLICT (entidad_id, etiqueta_id) DO NOTHING
RETURNING id INTO v_id;
-- Si no se insertó porque ya existía, obtenemos el ID existente
IF v_id IS NULL THEN
SELECT id INTO v_id
FROM entidad_etiquetas
WHERE entidad_id = p_entidad_id
    AND etiqueta_id = p_etiqueta_id;
END IF;
RETURN v_id;
END;
$$ LANGUAGE plpgsql;
-- 3. Corregir fn_crm_assign_manager para usar el nombre de columna correcto (fecha_actualizacion)
CREATE OR REPLACE FUNCTION fn_crm_assign_manager(
        p_entidad_id UUID,
        p_manager_id UUID
    ) RETURNS BOOLEAN AS $$ BEGIN
UPDATE entidades
SET manager_id = p_manager_id,
    fecha_actualizacion = CURRENT_TIMESTAMP
WHERE id = p_entidad_id;
RETURN FOUND;
END;
$$ LANGUAGE plpgsql;