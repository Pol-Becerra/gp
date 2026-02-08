/**
 * Analytics Service - GuíaPymes
 * Generación de reportes y métricas usando PostgreSQL directo
 */

const db = require('../../api/db');

class AnalyticsService {
    async getDailyIngestionStats() {
        const query = `
      SELECT 
        (SELECT COUNT(*) FROM data_google_maps WHERE created_at >= CURRENT_DATE) as extracted,
        (SELECT COUNT(*) FROM entidades WHERE created_at >= CURRENT_DATE) as validated
    `;

        const result = await db.query(query);
        return result.rows[0];
    }

    async getManagerPerformance(managerId) {
        const query = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'Closed') as resolved,
        COUNT(*) FILTER (WHERE status != 'Closed') as pending
      FROM tasks_tickets
      WHERE updated_by = $1 -- O campo correspondiente al manager
    `;

        const result = await db.query(query, [managerId]);
        return result.rows[0];
    }
}

module.exports = { AnalyticsService };
