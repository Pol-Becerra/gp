-- MIGRACIÓN: 014 - MEJORAR ACTUALIZACIÓN DE ENTIDAD
-- Autor: Antigravity
CREATE OR REPLACE FUNCTION public.fn_crm_update_entity(p_id uuid, p_data jsonb) RETURNS entidades LANGUAGE plpgsql AS $function$
DECLARE v_entidad entidades;
BEGIN
UPDATE entidades
SET nombre_legal = CASE
        WHEN p_data ? 'nombre_legal' THEN (p_data->>'nombre_legal')
        ELSE nombre_legal
    END,
    slug = CASE
        WHEN p_data ? 'slug' THEN (p_data->>'slug')
        ELSE slug
    END,
    descripcion = CASE
        WHEN p_data ? 'descripcion' THEN (p_data->>'descripcion')
        ELSE descripcion
    END,
    razon_social = CASE
        WHEN p_data ? 'razon_social' THEN (p_data->>'razon_social')
        ELSE razon_social
    END,
    cuit = CASE
        WHEN p_data ? 'cuit' THEN (p_data->>'cuit')
        ELSE cuit
    END,
    tipo_entidad = CASE
        WHEN p_data ? 'tipo_entidad' THEN (p_data->>'tipo_entidad')
        ELSE tipo_entidad
    END,
    activa = CASE
        WHEN p_data ? 'activa' THEN (p_data->>'activa')::BOOLEAN
        ELSE activa
    END,
    manager_id = CASE
        WHEN p_data ? 'manager_id' THEN (p_data->>'manager_id')::UUID
        ELSE manager_id
    END,
    fecha_actualizacion = CURRENT_TIMESTAMP
WHERE id = p_id
RETURNING * INTO v_entidad;
RETURN v_entidad;
END;
$function$;