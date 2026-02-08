/**
 * Database Connection Utility - GuíaPymes
 * Centralized PostgreSQL pool using 'pg'
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Opción para SSL si es necesario en producción
    /*
    ssl: {
      rejectUnauthorized: false
    }
    */
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
    pool
};
