/**
 * Simple Migration Runner - GuíaPymes
 * Ejecuta archivos SQL en la base de datos
 */

const fs = require('fs');
const path = require('path');
const db = require('../api/db');

async function runMigration() {
    const migrationPath = path.join(__dirname, '../migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('--- Iniciando Migración ---');

    try {
        await db.query(sql);
        console.log('✅ Migración completada con éxito.');
    } catch (err) {
        console.error('❌ Error en la migración:');
        console.error(err.message);
        process.exit(1);
    } finally {
        await db.pool.end();
    }
}

runMigration();
