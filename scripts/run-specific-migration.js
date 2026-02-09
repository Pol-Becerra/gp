const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function runMigration() {
    const migrationFile = process.argv[2];
    if (!migrationFile) {
        console.error('Por favor, proporciona la ruta al archivo de migración como argumento.');
        process.exit(1);
    }

    const migrationPath = path.resolve(migrationFile);
    if (!fs.existsSync(migrationPath)) {
        console.error(`El archivo de migración no existe: ${migrationPath}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log(`--- Ejecutando migración: ${path.basename(migrationPath)} ---`);

    try {
        await pool.query(sql);
        console.log('✅ Migración ejecutada con éxito.');
    } catch (err) {
        console.error('❌ Error ejecutando la migración:');
        console.error(err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
