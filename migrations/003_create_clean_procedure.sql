-- Migration: Create stored procedure to clean data_google_maps table
-- Description: Truncates or deletes all records from data_google_maps for development cleanup
-- Created: 2026-02-08
-- Updated: 2026-02-08 - Fixed deletion order (child tables first)

-- Stored Procedure: clean_data_google_maps
-- Purpose: Clean all records from data_google_maps table (useful for development/testing)
-- Returns: Count of deleted records

CREATE OR REPLACE FUNCTION clean_data_google_maps(
    p_confirm BOOLEAN DEFAULT false
)
RETURNS TABLE (
    deleted_count INTEGER,
    message TEXT
) AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Safety check: require explicit confirmation
    IF NOT p_confirm THEN
        RETURN QUERY SELECT 
            0::INTEGER, 
            'ERROR: Debe proporcionar p_confirm=true para ejecutar la limpieza'::TEXT;
        RETURN;
    END IF;
    
    -- Get count before deletion
    SELECT COUNT(*) INTO v_count FROM data_google_maps;
    
    -- IMPORTANTE: Eliminar primero las tablas hijas (FK) luego la padre
    -- 1. Eliminar de tablas de relación (junction tables) primero
    DELETE FROM data_google_maps_categorias;
    
    DELETE FROM data_google_maps_etiquetas;
    
    -- 2. Ahora sí eliminar de la tabla principal
    DELETE FROM data_google_maps;
    
    RETURN QUERY SELECT 
        v_count,
        'Tabla data_google_maps limpiada exitosamente. Registros eliminados: ' || v_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION clean_data_google_maps IS 
    'Limpia todos los registros de la tabla data_google_maps. Elimina primero las tablas hijas (categorías y etiquetas) para evitar errores de FK. Requiere p_confirm=true como medida de seguridad.';

-- Grant execute permission to application role (adjust as needed)
-- GRANT EXECUTE ON FUNCTION clean_data_google_maps TO app_role;
