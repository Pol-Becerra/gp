/**
 * Task Management Service - GuíaPymes
 * CRUD para tickets/tareas usando procedimientos almacenados de PostgreSQL
 */

const db = require('../../api/db');

class TaskService {
    /**
     * Obtener todos los tickets con filtros opcionales
     * Usa: get_all_tickets()
     */
    async getAllTickets(filters = {}) {
        const { status, priority, assigned_to, entity_id, area_id, parent_id, limit } = filters;

        const result = await db.query(
            'SELECT * FROM get_all_tickets($1, $2, $3, $4, $5, $6, $7)',
            [
                status || null,
                priority || null,
                assigned_to || null,
                entity_id || null,
                area_id || null,
                parent_id || null,
                limit || 100
            ]
        );

        return result.rows;
    }

    /**
     * Obtener un ticket por ID
     * Usa: get_ticket_by_id()
     */
    async getTicketById(id) {
        const result = await db.query(
            'SELECT * FROM get_ticket_by_id($1)',
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Crear un nuevo ticket
     * Usa: create_ticket()
     */
    async createTicket(data) {
        const { description, priority, status, entity_id, assigned_to, area_id, parent_id } = data;

        const result = await db.query(
            'SELECT * FROM create_ticket($1, $2, $3, $4, $5, $6, $7)',
            [
                description,
                priority || 'Medium',
                status || 'Open',
                entity_id || null,
                assigned_to || null,
                area_id || null,
                parent_id || null
            ]
        );

        return result.rows[0];
    }

    /**
     * Actualizar un ticket existente
     * Usa: update_ticket()
     */
    async updateTicket(id, data) {
        const { description, priority, status, entity_id, assigned_to, area_id, parent_id, updated_by } = data;

        const result = await db.query(
            'SELECT * FROM update_ticket($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [
                id,
                description || null,
                priority || null,
                status || null,
                entity_id || null,
                assigned_to || null,
                area_id || null,
                parent_id,
                updated_by || null
            ]
        );

        const row = result.rows[0];
        if (!row || !row.success) return null;
        return row;
    }

    /**
     * Actualizar solo el estado de un ticket
     * Usa: update_ticket_status()
     */
    async updateTicketStatus(ticketId, status) {
        const result = await db.query(
            'SELECT * FROM update_ticket_status($1, $2)',
            [ticketId, status]
        );

        const row = result.rows[0];
        if (!row || !row.success) return null;
        return row;
    }

    /**
     * Eliminar un ticket
     * Usa: delete_ticket()
     */
    async deleteTicket(id) {
        const result = await db.query(
            'SELECT * FROM delete_ticket($1)',
            [id]
        );

        const row = result.rows[0];
        return row && row.success;
    }

    /**
     * Obtener estadísticas de tickets
     * Usa: get_tickets_stats()
     */
    async getStats() {
        const result = await db.query('SELECT * FROM get_tickets_stats()');
        return result.rows[0];
    }

    /**
     * Obtener sub-tickets de un ticket padre
     * Usa: get_sub_tickets()
     */
    async getSubTickets(parentId) {
        const result = await db.query(
            'SELECT * FROM get_sub_tickets($1)',
            [parentId]
        );
        return result.rows;
    }

    /**
     * Obtener usuarios disponibles para asignación
     * Usa: get_users_for_assignment()
     */
    async getUsersForAssignment() {
        const result = await db.query('SELECT * FROM get_users_for_assignment()');
        return result.rows;
    }
}

module.exports = { TaskService };
