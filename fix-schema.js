const db = require('./api/db');

async function fixSchema() {
    try {
        console.log('Aplicando corrección de esquema...');
        await db.query('ALTER TABLE data_google_maps ALTER COLUMN google_maps_id TYPE TEXT;');
        console.log('✅ Columna google_maps_id actualizada a TEXT.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error al actualizar esquema:', err);
        process.exit(1);
    }
}

fixSchema();
