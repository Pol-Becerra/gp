/**
 * Task Management Service - GuíaPymes
 * Gestión de tickets y asignación automática usando PostgreSQL directo
 */

const db = require('../../api/db');

class TaskService {
    async createTicket(entityId, description, priority = 'Medium') {
        const query = `
      INSERT INTO tasks_tickets (entity_id, description, priority, status)
      VALUES ($1, $2, $3, 'Open')
      RETURNING *
    `;

        const result = await db.query(query, [entityId, description, priority]);
        const ticket = result.rows[0];

        // Disparar lógica de asignación
        await this.assignToBestManager(ticket.id);

        return ticket;
    }

    async assignToBestManager(ticketId) {
        // TODO: Implementar lógica de asignación basada en SQL
        console.log(`Asignando ticket ${ticketId} al mejor gestor disponible...`);
    }

    async updateTicketStatus(ticketId, status) {
        const query = `
      UPDATE tasks_tickets
      SET status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

        const result = await db.query(query, [ticketId, status]);
        return result.rows[0];
    }
}

module.exports = { TaskService };
