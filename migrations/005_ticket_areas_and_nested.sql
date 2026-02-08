-- Migration: Add ticket_areas table and modify tasks_tickets for nested tickets
-- Description: Áreas de tickets y tickets anidados
-- Created: 2026-02-08
-- ============================================
-- TABLA: ticket_areas
-- Áreas para clasificar tickets (Instagram, Servidores, Backups, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS ticket_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    color_hex VARCHAR(7) DEFAULT '#6366f1',
    icono VARCHAR(50),
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_ticket_areas_activa ON ticket_areas(activa);
CREATE INDEX idx_ticket_areas_nombre ON ticket_areas(nombre);
-- Insertar áreas predeterminadas
INSERT INTO ticket_areas (nombre, descripcion, color_hex, icono)
VALUES (
        'Instagram',
        'Gestión de redes sociales - Instagram',
        '#E1306C',
        'instagram'
    ),
    (
        'Servidores',
        'Infraestructura y servidores',
        '#10B981',
        'server'
    ),
    (
        'Backups',
        'Copias de seguridad y recuperación',
        '#F59E0B',
        'database'
    ),
    (
        'Diseño',
        'Diseño gráfico y UI/UX',
        '#8B5CF6',
        'palette'
    ),
    (
        'PostgreSQL',
        'Base de datos PostgreSQL',
        '#336791',
        'database'
    ),
    (
        'Frontend',
        'Desarrollo frontend',
        '#3B82F6',
        'layout'
    ),
    (
        'Backend',
        'Desarrollo backend y APIs',
        '#EF4444',
        'code'
    ),
    (
        'SEO',
        'Optimización para buscadores',
        '#22C55E',
        'search'
    ),
    (
        'Marketing',
        'Marketing digital',
        '#EC4899',
        'megaphone'
    ),
    (
        'Soporte',
        'Atención al cliente',
        '#06B6D4',
        'headphones'
    ) ON CONFLICT (nombre) DO NOTHING;
-- ============================================
-- MODIFICAR: tasks_tickets
-- Añadir parent_id para tickets anidados y area_id
-- ============================================
ALTER TABLE tasks_tickets
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES tasks_tickets(id) ON DELETE
SET NULL;
ALTER TABLE tasks_tickets
ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES ticket_areas(id) ON DELETE
SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_tickets_parent ON tasks_tickets(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tickets_area ON tasks_tickets(area_id);
-- ============================================
-- FUNCIÓN: get_all_areas
-- Obtener todas las áreas activas
-- ============================================
CREATE OR REPLACE FUNCTION get_all_areas(p_include_inactive BOOLEAN DEFAULT false) RETURNS TABLE (
        id UUID,
        nombre VARCHAR,
        descripcion TEXT,
        color_hex VARCHAR,
        icono VARCHAR,
        activa BOOLEAN,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        ticket_count BIGINT
    ) AS $$ BEGIN RETURN QUERY
SELECT a.id,
    a.nombre,
    a.descripcion,
    a.color_hex,
    a.icono,
    a.activa,
    a.created_at,
    a.updated_at,
    (
        SELECT COUNT(*)
        FROM tasks_tickets t
        WHERE t.area_id = a.id
    )::BIGINT as ticket_count
FROM ticket_areas a
WHERE p_include_inactive
    OR a.activa = true
ORDER BY a.nombre ASC;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION get_all_areas IS 'Obtiene todas las áreas de tickets con conteo de tickets asociados.';
-- ============================================
-- FUNCIÓN: get_area_by_id
-- Obtener un área por ID
-- ============================================
CREATE OR REPLACE FUNCTION get_area_by_id(p_id UUID) RETURNS TABLE (
        id UUID,
        nombre VARCHAR,
        descripcion TEXT,
        color_hex VARCHAR,
        icono VARCHAR,
        activa BOOLEAN,
        created_at TIMESTAMP,
        updated_at TIMESTAMP
    ) AS $$ BEGIN RETURN QUERY
SELECT a.id,
    a.nombre,
    a.descripcion,
    a.color_hex,
    a.icono,
    a.activa,
    a.created_at,
    a.updated_at
FROM ticket_areas a
WHERE a.id = p_id;
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- FUNCIÓN: create_area
-- Crear una nueva área
-- ============================================
CREATE OR REPLACE FUNCTION create_area(
        p_nombre VARCHAR,
        p_descripcion TEXT DEFAULT NULL,
        p_color_hex VARCHAR DEFAULT '#6366f1',
        p_icono VARCHAR DEFAULT NULL
    ) RETURNS TABLE (
        id UUID,
        nombre VARCHAR,
        descripcion TEXT,
        color_hex VARCHAR,
        icono VARCHAR,
        activa BOOLEAN,
        created_at TIMESTAMP
    ) AS $$
DECLARE v_new_id UUID;
BEGIN
INSERT INTO ticket_areas (nombre, descripcion, color_hex, icono)
VALUES (p_nombre, p_descripcion, p_color_hex, p_icono)
RETURNING ticket_areas.id INTO v_new_id;
RETURN QUERY
SELECT a.id,
    a.nombre,
    a.descripcion,
    a.color_hex,
    a.icono,
    a.activa,
    a.created_at
FROM ticket_areas a
WHERE a.id = v_new_id;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION create_area IS 'Crea una nueva área de tickets.';
-- ============================================
-- FUNCIÓN: update_area
-- Actualizar un área existente
-- ============================================
CREATE OR REPLACE FUNCTION update_area(
        p_id UUID,
        p_nombre VARCHAR DEFAULT NULL,
        p_descripcion TEXT DEFAULT NULL,
        p_color_hex VARCHAR DEFAULT NULL,
        p_icono VARCHAR DEFAULT NULL,
        p_activa BOOLEAN DEFAULT NULL
    ) RETURNS TABLE (
        id UUID,
        nombre VARCHAR,
        descripcion TEXT,
        color_hex VARCHAR,
        icono VARCHAR,
        activa BOOLEAN,
        updated_at TIMESTAMP,
        success BOOLEAN
    ) AS $$ BEGIN
UPDATE ticket_areas a
SET nombre = COALESCE(p_nombre, a.nombre),
    descripcion = COALESCE(p_descripcion, a.descripcion),
    color_hex = COALESCE(p_color_hex, a.color_hex),
    icono = COALESCE(p_icono, a.icono),
    activa = COALESCE(p_activa, a.activa),
    updated_at = CURRENT_TIMESTAMP
WHERE a.id = p_id;
IF NOT FOUND THEN RETURN QUERY
SELECT NULL::UUID,
    NULL::VARCHAR,
    NULL::TEXT,
    NULL::VARCHAR,
    NULL::VARCHAR,
    NULL::BOOLEAN,
    NULL::TIMESTAMP,
    false;
RETURN;
END IF;
RETURN QUERY
SELECT a.id,
    a.nombre,
    a.descripcion,
    a.color_hex,
    a.icono,
    a.activa,
    a.updated_at,
    true as success
FROM ticket_areas a
WHERE a.id = p_id;
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- FUNCIÓN: delete_area
-- Eliminar un área (soft delete)
-- ============================================
CREATE OR REPLACE FUNCTION delete_area(p_id UUID, p_hard_delete BOOLEAN DEFAULT false) RETURNS TABLE (
        deleted_id UUID,
        success BOOLEAN,
        message TEXT
    ) AS $$
DECLARE v_exists BOOLEAN;
v_ticket_count INTEGER;
BEGIN
SELECT EXISTS(
        SELECT 1
        FROM ticket_areas
        WHERE ticket_areas.id = p_id
    ) INTO v_exists;
IF NOT v_exists THEN RETURN QUERY
SELECT NULL::UUID,
    false,
    'Área no encontrada'::TEXT;
RETURN;
END IF;
-- Check if area has tickets
SELECT COUNT(*) INTO v_ticket_count
FROM tasks_tickets
WHERE area_id = p_id;
IF p_hard_delete THEN IF v_ticket_count > 0 THEN -- Remove area from tickets first
UPDATE tasks_tickets
SET area_id = NULL
WHERE area_id = p_id;
END IF;
DELETE FROM ticket_areas
WHERE ticket_areas.id = p_id;
RETURN QUERY
SELECT p_id,
    true,
    'Área eliminada permanentemente'::TEXT;
ELSE -- Soft delete
UPDATE ticket_areas
SET activa = false,
    updated_at = CURRENT_TIMESTAMP
WHERE ticket_areas.id = p_id;
RETURN QUERY
SELECT p_id,
    true,
    'Área desactivada correctamente'::TEXT;
END IF;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION delete_area IS 'Elimina o desactiva un área de tickets.';
-- ============================================
-- ACTUALIZAR: Procedimientos de tickets para incluir area_id y parent_id
-- ============================================
-- Actualizar get_all_tickets
DROP FUNCTION IF EXISTS get_all_tickets(VARCHAR, VARCHAR, UUID, UUID, INTEGER);
CREATE OR REPLACE FUNCTION get_all_tickets(
        p_status VARCHAR DEFAULT NULL,
        p_priority VARCHAR DEFAULT NULL,
        p_assigned_to UUID DEFAULT NULL,
        p_entity_id UUID DEFAULT NULL,
        p_area_id UUID DEFAULT NULL,
        p_parent_id UUID DEFAULT NULL,
        p_limit INTEGER DEFAULT 100
    ) RETURNS TABLE (
        id UUID,
        entity_id UUID,
        description TEXT,
        priority VARCHAR,
        status VARCHAR,
        assigned_to UUID,
        area_id UUID,
        parent_id UUID,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        updated_by UUID,
        entidad_nombre VARCHAR,
        assigned_to_nombre VARCHAR,
        area_nombre VARCHAR,
        area_color VARCHAR,
        sub_tickets_count BIGINT
    ) AS $$ BEGIN RETURN QUERY
SELECT t.id,
    t.entity_id,
    t.description,
    t.priority,
    t.status,
    t.assigned_to,
    t.area_id,
    t.parent_id,
    t.created_at,
    t.updated_at,
    t.updated_by,
    e.nombre_legal as entidad_nombre,
    u.nombre_completo as assigned_to_nombre,
    a.nombre as area_nombre,
    a.color_hex as area_color,
    (
        SELECT COUNT(*)
        FROM tasks_tickets sub
        WHERE sub.parent_id = t.id
    )::BIGINT as sub_tickets_count
FROM tasks_tickets t
    LEFT JOIN entidades e ON t.entity_id = e.id
    LEFT JOIN usuarios u ON t.assigned_to = u.id
    LEFT JOIN ticket_areas a ON t.area_id = a.id
WHERE (
        p_status IS NULL
        OR t.status = p_status
    )
    AND (
        p_priority IS NULL
        OR t.priority = p_priority
    )
    AND (
        p_assigned_to IS NULL
        OR t.assigned_to = p_assigned_to
    )
    AND (
        p_entity_id IS NULL
        OR t.entity_id = p_entity_id
    )
    AND (
        p_area_id IS NULL
        OR t.area_id = p_area_id
    )
    AND (
        p_parent_id IS NULL
        OR t.parent_id = p_parent_id
    )
ORDER BY t.created_at DESC
LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
-- Actualizar get_ticket_by_id
DROP FUNCTION IF EXISTS get_ticket_by_id(UUID);
CREATE OR REPLACE FUNCTION get_ticket_by_id(p_id UUID) RETURNS TABLE (
        id UUID,
        entity_id UUID,
        description TEXT,
        priority VARCHAR,
        status VARCHAR,
        assigned_to UUID,
        area_id UUID,
        parent_id UUID,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        updated_by UUID,
        entidad_nombre VARCHAR,
        assigned_to_nombre VARCHAR,
        area_nombre VARCHAR,
        area_color VARCHAR
    ) AS $$ BEGIN RETURN QUERY
SELECT t.id,
    t.entity_id,
    t.description,
    t.priority,
    t.status,
    t.assigned_to,
    t.area_id,
    t.parent_id,
    t.created_at,
    t.updated_at,
    t.updated_by,
    e.nombre_legal as entidad_nombre,
    u.nombre_completo as assigned_to_nombre,
    a.nombre as area_nombre,
    a.color_hex as area_color
FROM tasks_tickets t
    LEFT JOIN entidades e ON t.entity_id = e.id
    LEFT JOIN usuarios u ON t.assigned_to = u.id
    LEFT JOIN ticket_areas a ON t.area_id = a.id
WHERE t.id = p_id;
END;
$$ LANGUAGE plpgsql;
-- Actualizar create_ticket
DROP FUNCTION IF EXISTS create_ticket(TEXT, VARCHAR, VARCHAR, UUID, UUID);
CREATE OR REPLACE FUNCTION create_ticket(
        p_description TEXT,
        p_priority VARCHAR DEFAULT 'Medium',
        p_status VARCHAR DEFAULT 'Open',
        p_entity_id UUID DEFAULT NULL,
        p_assigned_to UUID DEFAULT NULL,
        p_area_id UUID DEFAULT NULL,
        p_parent_id UUID DEFAULT NULL
    ) RETURNS TABLE (
        id UUID,
        entity_id UUID,
        description TEXT,
        priority VARCHAR,
        status VARCHAR,
        assigned_to UUID,
        area_id UUID,
        parent_id UUID,
        created_at TIMESTAMP,
        updated_at TIMESTAMP
    ) AS $$
DECLARE v_new_id UUID;
BEGIN
INSERT INTO tasks_tickets (
        entity_id,
        description,
        priority,
        status,
        assigned_to,
        area_id,
        parent_id
    )
VALUES (
        p_entity_id,
        p_description,
        p_priority,
        p_status,
        p_assigned_to,
        p_area_id,
        p_parent_id
    )
RETURNING tasks_tickets.id INTO v_new_id;
RETURN QUERY
SELECT t.id,
    t.entity_id,
    t.description,
    t.priority,
    t.status,
    t.assigned_to,
    t.area_id,
    t.parent_id,
    t.created_at,
    t.updated_at
FROM tasks_tickets t
WHERE t.id = v_new_id;
END;
$$ LANGUAGE plpgsql;
-- Actualizar update_ticket
DROP FUNCTION IF EXISTS update_ticket(UUID, TEXT, VARCHAR, VARCHAR, UUID, UUID, UUID);
CREATE OR REPLACE FUNCTION update_ticket(
        p_id UUID,
        p_description TEXT DEFAULT NULL,
        p_priority VARCHAR DEFAULT NULL,
        p_status VARCHAR DEFAULT NULL,
        p_entity_id UUID DEFAULT NULL,
        p_assigned_to UUID DEFAULT NULL,
        p_area_id UUID DEFAULT NULL,
        p_parent_id UUID DEFAULT NULL,
        p_updated_by UUID DEFAULT NULL
    ) RETURNS TABLE (
        id UUID,
        entity_id UUID,
        description TEXT,
        priority VARCHAR,
        status VARCHAR,
        assigned_to UUID,
        area_id UUID,
        parent_id UUID,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        updated_by UUID,
        success BOOLEAN
    ) AS $$ BEGIN
UPDATE tasks_tickets t
SET description = COALESCE(p_description, t.description),
    priority = COALESCE(p_priority, t.priority),
    status = COALESCE(p_status, t.status),
    entity_id = COALESCE(p_entity_id, t.entity_id),
    assigned_to = COALESCE(p_assigned_to, t.assigned_to),
    area_id = COALESCE(p_area_id, t.area_id),
    parent_id = p_parent_id,
    updated_by = p_updated_by,
    updated_at = CURRENT_TIMESTAMP
WHERE t.id = p_id;
IF NOT FOUND THEN RETURN QUERY
SELECT NULL::UUID,
    NULL::UUID,
    NULL::TEXT,
    NULL::VARCHAR,
    NULL::VARCHAR,
    NULL::UUID,
    NULL::UUID,
    NULL::UUID,
    NULL::TIMESTAMP,
    NULL::TIMESTAMP,
    NULL::UUID,
    false;
RETURN;
END IF;
RETURN QUERY
SELECT t.id,
    t.entity_id,
    t.description,
    t.priority,
    t.status,
    t.assigned_to,
    t.area_id,
    t.parent_id,
    t.created_at,
    t.updated_at,
    t.updated_by,
    true as success
FROM tasks_tickets t
WHERE t.id = p_id;
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- FUNCIÓN: get_sub_tickets
-- Obtener sub-tickets de un ticket padre
-- ============================================
CREATE OR REPLACE FUNCTION get_sub_tickets(p_parent_id UUID) RETURNS TABLE (
        id UUID,
        description TEXT,
        priority VARCHAR,
        status VARCHAR,
        assigned_to UUID,
        assigned_to_nombre VARCHAR,
        area_id UUID,
        area_nombre VARCHAR,
        created_at TIMESTAMP
    ) AS $$ BEGIN RETURN QUERY
SELECT t.id,
    t.description,
    t.priority,
    t.status,
    t.assigned_to,
    u.nombre_completo as assigned_to_nombre,
    t.area_id,
    a.nombre as area_nombre,
    t.created_at
FROM tasks_tickets t
    LEFT JOIN usuarios u ON t.assigned_to = u.id
    LEFT JOIN ticket_areas a ON t.area_id = a.id
WHERE t.parent_id = p_parent_id
ORDER BY t.created_at ASC;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION get_sub_tickets IS 'Obtiene los sub-tickets de un ticket padre.';
-- ============================================
-- FUNCIÓN: get_users_for_assignment
-- Obtener usuarios disponibles para asignación
-- ============================================
CREATE OR REPLACE FUNCTION get_users_for_assignment() RETURNS TABLE (
        id UUID,
        nombre_completo VARCHAR,
        email VARCHAR,
        rol VARCHAR
    ) AS $$ BEGIN RETURN QUERY
SELECT u.id,
    u.nombre_completo,
    u.email,
    u.rol
FROM usuarios u
WHERE u.activo = true
ORDER BY u.nombre_completo ASC;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION get_users_for_assignment IS 'Obtiene usuarios activos disponibles para asignar tickets.';