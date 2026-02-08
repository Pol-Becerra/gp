-- Migration: Create stored procedure for Google Maps data insertion
-- Description: Replaces inline INSERT/UPDATE with reusable stored procedure
-- Created: 2026-02-08

-- Stored Procedure: upsert_google_maps_data
-- Purpose: Insert or update Google Maps extraction data with conflict handling
-- Parameters match the fields in data_google_maps table

CREATE OR REPLACE FUNCTION upsert_google_maps_data(
    p_nombre VARCHAR(500),
    p_google_maps_id VARCHAR(200),
    p_google_place_id VARCHAR(200),
    p_google_maps_url TEXT,
    p_rating DECIMAL(3,2),
    p_review_count INTEGER,
    p_telefono VARCHAR(50),
    p_website VARCHAR(500),
    p_raw_info TEXT,
    p_etiqueta VARCHAR(50) DEFAULT 'nuevo',
    p_search_category VARCHAR(200),
    p_search_postal_code VARCHAR(10)
)
RETURNS TABLE (
    id UUID,
    operation VARCHAR(10),
    google_maps_id VARCHAR(200)
) AS $$
DECLARE
    v_id UUID;
    v_operation VARCHAR(10);
BEGIN
    -- Attempt insert with conflict handling
    INSERT INTO data_google_maps (
        nombre,
        google_maps_id,
        google_place_id,
        google_maps_url,
        rating,
        review_count,
        telefono,
        website,
        raw_info,
        etiqueta,
        search_category,
        search_postal_code,
        search_timestamp,
        created_at,
        updated_at
    ) VALUES (
        p_nombre,
        p_google_maps_id,
        p_google_place_id,
        p_google_maps_url,
        p_rating,
        p_review_count,
        p_telefono,
        p_website,
        p_raw_info,
        p_etiqueta,
        p_search_category,
        p_search_postal_code,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (google_maps_id) DO UPDATE SET
        rating = EXCLUDED.rating,
        review_count = EXCLUDED.review_count,
        telefono = COALESCE(EXCLUDED.telefono, data_google_maps.telefono),
        website = COALESCE(EXCLUDED.website, data_google_maps.website),
        google_maps_url = COALESCE(EXCLUDED.google_maps_url, data_google_maps.google_maps_url),
        raw_info = EXCLUDED.raw_info,
        updated_at = CURRENT_TIMESTAMP
    RETURNING data_google_maps.id INTO v_id;
    
    -- Determine if it was an insert or update
    IF EXISTS (SELECT 1 FROM data_google_maps WHERE id = v_id AND created_at = updated_at) THEN
        v_operation := 'INSERT';
    ELSE
        v_operation := 'UPDATE';
    END IF;
    
    RETURN QUERY SELECT v_id, v_operation, p_google_maps_id;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION upsert_google_maps_data IS 
    'Upserts Google Maps extraction data. Returns the record ID, operation type (INSERT/UPDATE), and Google Maps ID. Handles conflicts on google_maps_id unique constraint.';

-- Grant execute permission to application role (adjust as needed)
-- GRANT EXECUTE ON FUNCTION upsert_google_maps_data TO app_role;
