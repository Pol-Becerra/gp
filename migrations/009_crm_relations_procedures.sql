-- MIGRACIÓN: 009 - PROCEDIMIENTOS PARA RELACIONES CRM
-- Autor: Antigravity
-- =============================================
-- 1. TELEFONOS
-- =============================================
CREATE OR REPLACE FUNCTION fn_crm_add_phone(
        p_entidad_id UUID,
        p_numero VARCHAR,
        p_tipo VARCHAR,
        -- fijo, movil, whatsapp
        p_uso VARCHAR DEFAULT 'general'
    ) RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
INSERT INTO telefonos (
        entidad_id,
        numero,
        tipo_telefonico,
        tipo_uso,
        validado
    )
VALUES (p_entidad_id, p_numero, p_tipo, p_uso, true)
RETURNING id INTO v_id;
RETURN v_id;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION fn_crm_remove_phone(p_id UUID) RETURNS BOOLEAN AS $$ BEGIN
DELETE FROM telefonos
WHERE id = p_id;
RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
-- =============================================
-- 2. EMAILS
-- =============================================
CREATE OR REPLACE FUNCTION fn_crm_add_email(
        p_entidad_id UUID,
        p_email VARCHAR,
        p_uso VARCHAR DEFAULT 'general'
    ) RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
INSERT INTO emails (entidad_id, email, tipo_uso, validado)
VALUES (p_entidad_id, p_email, p_uso, true)
RETURNING id INTO v_id;
RETURN v_id;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION fn_crm_remove_email(p_id UUID) RETURNS BOOLEAN AS $$ BEGIN
DELETE FROM emails
WHERE id = p_id;
RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
-- =============================================
-- 3. SITIOS WEB
-- =============================================
CREATE OR REPLACE FUNCTION fn_crm_add_website(
        p_entidad_id UUID,
        p_url VARCHAR,
        p_tipo VARCHAR DEFAULT 'web_principal'
    ) RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
INSERT INTO sitios_web (entidad_id, url, tipo_sitio, validado)
VALUES (p_entidad_id, p_url, p_tipo, true)
RETURNING id INTO v_id;
RETURN v_id;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION fn_crm_remove_website(p_id UUID) RETURNS BOOLEAN AS $$ BEGIN
DELETE FROM sitios_web
WHERE id = p_id;
RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
-- =============================================
-- 4. REDES SOCIALES
-- =============================================
CREATE OR REPLACE FUNCTION fn_crm_add_social(
        p_entidad_id UUID,
        p_plataforma VARCHAR,
        p_url VARCHAR
    ) RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
INSERT INTO redes_sociales (entidad_id, plataforma, usuario_o_url, validada)
VALUES (p_entidad_id, p_plataforma, p_url, true)
RETURNING id INTO v_id;
RETURN v_id;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION fn_crm_remove_social(p_id UUID) RETURNS BOOLEAN AS $$ BEGIN
DELETE FROM redes_sociales
WHERE id = p_id;
RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
-- =============================================
-- 5. DIRECCIONES
-- =============================================
CREATE OR REPLACE FUNCTION fn_crm_add_address(
        p_entidad_id UUID,
        p_calle VARCHAR,
        p_numero VARCHAR,
        p_localidad VARCHAR,
        p_provincia VARCHAR,
        p_tipo VARCHAR DEFAULT 'principal'
    ) RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
INSERT INTO direcciones (
        entidad_id,
        calle,
        numero,
        localidad,
        provincia,
        tipo_direccion,
        validada
    )
VALUES (
        p_entidad_id,
        p_calle,
        p_numero,
        p_localidad,
        p_provincia,
        p_tipo,
        true
    )
RETURNING id INTO v_id;
RETURN v_id;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION fn_crm_remove_address(p_id UUID) RETURNS BOOLEAN AS $$ BEGIN
DELETE FROM direcciones
WHERE id = p_id;
RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
-- =============================================
-- 6. CATEGORIAS (VINCULACION)
-- =============================================
CREATE OR REPLACE FUNCTION fn_crm_link_category(
        p_entidad_id UUID,
        p_categoria_id UUID,
        p_es_primaria BOOLEAN DEFAULT false
    ) RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
INSERT INTO entidad_categorias (entidad_id, categoria_id, es_primaria)
VALUES (p_entidad_id, p_categoria_id, p_es_primaria) ON CONFLICT (entidad_id, categoria_id) DO
UPDATE
SET es_primaria = p_es_primaria
RETURNING id INTO v_id;
RETURN v_id;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION fn_crm_unlink_category(p_entidad_id UUID, p_categoria_id UUID) RETURNS BOOLEAN AS $$ BEGIN
DELETE FROM entidad_categorias
WHERE entidad_id = p_entidad_id
    AND categoria_id = p_categoria_id;
RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
-- =============================================
-- 7. ETIQUETAS (VINCULACION)
-- =============================================
CREATE OR REPLACE FUNCTION fn_crm_link_tag(p_entidad_id UUID, p_etiqueta_id UUID) RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
INSERT INTO entidad_etiquetas (entidad_id, etiqueta_id)
VALUES (p_entidad_id, p_etiqueta_id) ON CONFLICT DO NOTHING
RETURNING id INTO v_id;
RETURN v_id;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION fn_crm_unlink_tag(p_entidad_id UUID, p_etiqueta_id UUID) RETURNS BOOLEAN AS $$ BEGIN
DELETE FROM entidad_etiquetas
WHERE entidad_id = p_entidad_id
    AND etiqueta_id = p_etiqueta_id;
RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
-- =============================================
-- 8. GESTORES (ASIGNACION)
-- =============================================
-- Asumimos que hay una columna manager_id en entidades según el prompt, 
-- aunque en el schema v2 original no la veo explicitamente en la tabla create, 
-- pero el agente db-persistence la mencionó. 
-- Voy a revisar si existe la columna, si no la agrego.
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'entidades'
        AND column_name = 'manager_id'
) THEN
ALTER TABLE entidades
ADD COLUMN manager_id UUID REFERENCES usuarios(id);
END IF;
END $$;
CREATE OR REPLACE FUNCTION fn_crm_assign_manager(
        p_entidad_id UUID,
        p_manager_id UUID -- puede ser null para desasignar
    ) RETURNS BOOLEAN AS $$ BEGIN
UPDATE entidades
SET manager_id = p_manager_id,
    updated_at = CURRENT_TIMESTAMP -- Asumiendo que existe updated_at o fecha_actualizacion
WHERE id = p_entidad_id;
RETURN FOUND;
END;
$$ LANGUAGE plpgsql;