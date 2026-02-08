/**
 * Extraction Task Runner - GuíaPymes
 * Ejecuta el extractor de Google Maps y guarda en PostgreSQL
 */

const { GoogleMapsExtractor } = require('../services/data-extraction');
const db = require('../api/db');
require('dotenv').config();

async function run(categoria, cp) {
    const extractor = new GoogleMapsExtractor({ headless: true, maxResults: 100 });

    try {
        await extractor.init();
        const results = await extractor.search(categoria, cp);

        console.log(`Guardando ${results.length} resultados en la base de datos...`);

        for (const item of results) {
            // Use stored procedure for upsert operation
            const query = `SELECT * FROM upsert_google_maps_data($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`;
            
            const values = [
                item.nombre,
                item.google_place_id || item.google_maps_url, // ID único
                item.google_place_id,
                item.google_maps_url,
                item.rating,
                item.review_count,
                item.telefono,
                item.website,
                item.raw_info,
                'nuevo', // etiqueta
                categoria,
                cp
            ];

            const result = await db.query(query, values);
            const { operation, google_maps_id } = result.rows[0];
            console.log(`  ${operation}: ${item.nombre} (${google_maps_id})`);
        }

        console.log('✅ Proceso de extracción completado.');
    } catch (err) {
        console.error('❌ Error durante la extracción:', err);
    } finally {
        await extractor.close();
        await db.pool.end();
    }
}

// Ejemplo de uso: node scripts/run-extraction.js "Ferretería" "1425"
const args = process.argv.slice(2);
const categoria = args[0] || 'Gimnasios';
const cp = args[1] || '1001';

run(categoria, cp);
