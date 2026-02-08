/**
 * Analytics Service - GuíaPymes
 * Generación de reportes y métricas usando PostgreSQL directo
 */

const db = require('../../api/db');

class AnalyticsService {
  async getDailyIngestionStats() {
    const result = await db.query('SELECT * FROM fn_analytics_get_daily_stats()');
    return result.rows[0];
  }

  async getManagerPerformance(managerId) {
    const result = await db.query('SELECT * FROM fn_analytics_get_manager_performance($1)', [managerId]);
    return result.rows[0];
  }
}

module.exports = { AnalyticsService };
