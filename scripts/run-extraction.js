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
            const query = `
        INSERT INTO data_google_maps (
          nombre, 
          google_maps_id, 
          google_place_id,
          google_maps_url,
          rating, 
          review_count, 
          telefono,
          website,
          raw_info,
          etiqueta,
          search_category,
          search_postal_code,
          search_timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'nuevo', $10, $11, CURRENT_TIMESTAMP)
        ON CONFLICT (google_maps_id) DO UPDATE SET 
          rating = EXCLUDED.rating,
          review_count = EXCLUDED.review_count,
          telefono = COALESCE(EXCLUDED.telefono, data_google_maps.telefono),
          website = COALESCE(EXCLUDED.website, data_google_maps.website),
          google_maps_url = COALESCE(EXCLUDED.google_maps_url, data_google_maps.google_maps_url),
          raw_info = EXCLUDED.raw_info,
          updated_at = CURRENT_TIMESTAMP
      `;

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
                categoria,
                cp
            ];

            await db.query(query, values);
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
