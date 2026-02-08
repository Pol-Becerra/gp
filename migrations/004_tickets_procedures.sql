-- Migration: Create stored procedures for tasks_tickets CRUD
-- Description: Funciones para gestión de tickets/tareas
-- Created: 2026-02-08
-- ============================================
-- FUNCIÓN: get_all_tickets
-- Obtener todos los tickets con filtros opcionales
-- ============================================
CREATE OR REPLACE FUNCTION get_all_tickets(
        p_status VARCHAR DEFAULT NULL,
        p_priority VARCHAR DEFAULT NULL,
        p_assigned_to UUID DEFAULT NULL,
        p_entity_id UUID DEFAULT NULL,
        p_limit INTEGER DEFAULT 100
    ) RETURNS TABLE (
        id UUID,
        entity_id UUID,
        description TEXT,
        priority VARCHAR,
        status VARCHAR,
        assigned_to UUID,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        updated_by UUID,
        entidad_nombre VARCHAR,
        assigned_to_nombre VARCHAR
    ) AS $$ BEGIN RETURN QUERY
SELECT t.id,
    t.entity_id,
    t.description,
    t.priority,
    t.status,
    t.assigned_to,
    t.created_at,
    t.updated_at,
    t.updated_by,
    e.nombre_legal as entidad_nombre,
    u.nombre_completo as assigned_to_nombre
FROM tasks_tickets t
    LEFT JOIN entidades e ON t.entity_id = e.id
    LEFT JOIN usuarios u ON t.assigned_to = u.id
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
ORDER BY t.created_at DESC
LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION get_all_tickets IS 'Obtiene todos los tickets con filtros opcionales por estado, prioridad, asignado y entidad.';
-- ============================================
-- FUNCIÓN: get_ticket_by_id
-- Obtener un ticket específico por su ID
-- ============================================
CREATE OR REPLACE FUNCTION get_ticket_by_id(p_id UUID) RETURNS TABLE (
        id UUID,
        entity_id UUID,
        description TEXT,
        priority VARCHAR,
        status VARCHAR,
        assigned_to UUID,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        updated_by UUID,
        entidad_nombre VARCHAR,
        assigned_to_nombre VARCHAR
    ) AS $$ BEGIN RETURN QUERY
SELECT t.id,
    t.entity_id,
    t.description,
    t.priority,
    t.status,
    t.assigned_to,
    t.created_at,
    t.updated_at,
    t.updated_by,
    e.nombre_legal as entidad_nombre,
    u.nombre_completo as assigned_to_nombre
FROM tasks_tickets t
    LEFT JOIN entidades e ON t.entity_id = e.id
    LEFT JOIN usuarios u ON t.assigned_to = u.id
WHERE t.id = p_id;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION get_ticket_by_id IS 'Obtiene un ticket específico por su ID con información de entidad y usuario asignado.';
-- ============================================
-- FUNCIÓN: create_ticket
-- Crear un nuevo ticket
-- ============================================
CREATE OR REPLACE FUNCTION create_ticket(
        p_description TEXT,
        p_priority VARCHAR DEFAULT 'Medium',
        p_status VARCHAR DEFAULT 'Open',
        p_entity_id UUID DEFAULT NULL,
        p_assigned_to UUID DEFAULT NULL
    ) RETURNS TABLE (
        id UUID,
        entity_id UUID,
        description TEXT,
        priority VARCHAR,
        status VARCHAR,
        assigned_to UUID,
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
        assigned_to
    )
VALUES (
        p_entity_id,
        p_description,
        p_priority,
        p_status,
        p_assigned_to
    )
RETURNING tasks_tickets.id INTO v_new_id;
RETURN QUERY
SELECT t.id,
    t.entity_id,
    t.description,
    t.priority,
    t.status,
    t.assigned_to,
    t.created_at,
    t.updated_at
FROM tasks_tickets t
WHERE t.id = v_new_id;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION create_ticket IS 'Crea un nuevo ticket y retorna el registro creado.';
-- ============================================
-- FUNCIÓN: update_ticket
-- Actualizar un ticket existente
-- ============================================
CREATE OR REPLACE FUNCTION update_ticket(
        p_id UUID,
        p_description TEXT DEFAULT NULL,
        p_priority VARCHAR DEFAULT NULL,
        p_status VARCHAR DEFAULT NULL,
        p_entity_id UUID DEFAULT NULL,
        p_assigned_to UUID DEFAULT NULL,
        p_updated_by UUID DEFAULT NULL
    ) RETURNS TABLE (
        id UUID,
        entity_id UUID,
        description TEXT,
        priority VARCHAR,
        status VARCHAR,
        assigned_to UUID,
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
    t.created_at,
    t.updated_at,
    t.updated_by,
    true as success
FROM tasks_tickets t
WHERE t.id = p_id;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION update_ticket IS 'Actualiza un ticket existente. Solo actualiza los campos proporcionados (no NULL).';
-- ============================================
-- FUNCIÓN: update_ticket_status
-- Actualizar solo el estado de un ticket
-- ============================================
CREATE OR REPLACE FUNCTION update_ticket_status(p_id UUID, p_status VARCHAR) RETURNS TABLE (
        id UUID,
        status VARCHAR,
        updated_at TIMESTAMP,
        success BOOLEAN
    ) AS $$ BEGIN
UPDATE tasks_tickets t
SET status = p_status,
    updated_at = CURRENT_TIMESTAMP
WHERE t.id = p_id;
IF NOT FOUND THEN RETURN QUERY
SELECT NULL::UUID,
    NULL::VARCHAR,
    NULL::TIMESTAMP,
    false;
RETURN;
END IF;
RETURN QUERY
SELECT t.id,
    t.status,
    t.updated_at,
    true as success
FROM tasks_tickets t
WHERE t.id = p_id;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION update_ticket_status IS 'Actualiza solo el estado de un ticket.';
-- ============================================
-- FUNCIÓN: delete_ticket
-- Eliminar un ticket
-- ============================================
CREATE OR REPLACE FUNCTION delete_ticket(p_id UUID) RETURNS TABLE (
        deleted_id UUID,
        success BOOLEAN,
        message TEXT
    ) AS $$
DECLARE v_exists BOOLEAN;
BEGIN
SELECT EXISTS(
        SELECT 1
        FROM tasks_tickets
        WHERE tasks_tickets.id = p_id
    ) INTO v_exists;
IF NOT v_exists THEN RETURN QUERY
SELECT NULL::UUID,
    false,
    'Ticket no encontrado'::TEXT;
RETURN;
END IF;
DELETE FROM tasks_tickets
WHERE tasks_tickets.id = p_id;
RETURN QUERY
SELECT p_id,
    true,
    'Ticket eliminado correctamente'::TEXT;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION delete_ticket IS 'Elimina un ticket por su ID.';
-- ============================================
-- FUNCIÓN: get_tickets_stats
-- Obtener estadísticas de tickets
-- ============================================
CREATE OR REPLACE FUNCTION get_tickets_stats() RETURNS TABLE (
        total BIGINT,
        open BIGINT,
        in_progress BIGINT,
        resolved BIGINT,
        closed BIGINT,
        high_priority BIGINT,
        medium_priority BIGINT,
        low_priority BIGINT
    ) AS $$ BEGIN RETURN QUERY
SELECT COUNT(*)::BIGINT as total,
    COUNT(*) FILTER (
        WHERE tasks_tickets.status = 'Open'
    )::BIGINT as open,
    COUNT(*) FILTER (
        WHERE tasks_tickets.status = 'In Progress'
    )::BIGINT as in_progress,
    COUNT(*) FILTER (
        WHERE tasks_tickets.status = 'Resolved'
    )::BIGINT as resolved,
    COUNT(*) FILTER (
        WHERE tasks_tickets.status = 'Closed'
    )::BIGINT as closed,
    COUNT(*) FILTER (
        WHERE tasks_tickets.priority = 'High'
    )::BIGINT as high_priority,
    COUNT(*) FILTER (
        WHERE tasks_tickets.priority = 'Medium'
    )::BIGINT as medium_priority,
    COUNT(*) FILTER (
        WHERE tasks_tickets.priority = 'Low'
    )::BIGINT as low_priority
FROM tasks_tickets;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION get_tickets_stats IS 'Obtiene estadísticas agregadas de todos los tickets.';
-- Grant execute permissions (adjust role as needed)
-- GRANT EXECUTE ON FUNCTION get_all_tickets TO app_role;
-- GRANT EXECUTE ON FUNCTION get_ticket_by_id TO app_role;
-- GRANT EXECUTE ON FUNCTION create_ticket TO app_role;
-- GRANT EXECUTE ON FUNCTION update_ticket TO app_role;
-- GRANT EXECUTE ON FUNCTION update_ticket_status TO app_role;
-- GRANT EXECUTE ON FUNCTION delete_ticket TO app_role;
-- GRANT EXECUTE ON FUNCTION get_tickets_stats TO app_role;