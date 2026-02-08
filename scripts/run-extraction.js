/**
 * Extraction Task Runner - GuíaPymes
 * Ejecuta el extractor de Google Maps y guarda en PostgreSQL (v2 - Refactorizado)
 * 
 * Uso: node scripts/run-extraction.js "Categoría" "CodigoPostal" [opciones]
 * Ejemplo: node scripts/run-extraction.js "Ferretería" "1425" --debug --max=50
 */

const { GoogleMapsExtractor } = require('../services/data-extraction');
const db = require('../api/db');
require('dotenv').config();

// Parsear argumentos
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        categoria: 'Gimnasios',
        cp: '1001',
        maxResults: 100,
        debug: false,
        headless: true
    };

    for (const arg of args) {
        if (arg.startsWith('--max=')) {
            options.maxResults = parseInt(arg.split('=')[1]) || 100;
        } else if (arg === '--debug') {
            options.debug = true;
        } else if (arg === '--visible') {
            options.headless = false;
        } else if (!arg.startsWith('--')) {
            if (!options._cat) {
                options.categoria = arg;
                options._cat = true;
            } else {
                options.cp = arg;
            }
        }
    }

    return options;
}

async function run(options) {
    const { categoria, cp, maxResults, debug, headless } = options;

    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📍 GuíaPymes - Extractor de Google Maps v2`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Categoría: ${categoria}`);
    console.log(`   Código Postal: ${cp}`);
    console.log(`   Máximo resultados: ${maxResults}`);
    console.log(`   Debug: ${debug ? 'Sí' : 'No'}`);
    console.log('───────────────────────────────────────────────────────────');

    const extractor = new GoogleMapsExtractor({
        headless,
        maxResults,
        debug
    });

    const stats = {
        total: 0,
        inserted: 0,
        updated: 0,
        errors: 0,
        withPhone: 0,
        withWeb: 0
    };

    try {
        await extractor.init();
        const results = await extractor.search(categoria, cp);
        stats.total = results.length;

        console.log(`\n💾 Guardando ${results.length} resultados en la base de datos...\n`);

        for (const item of results) {
            try {
                // Usar stored procedure para upsert
                const query = `SELECT * FROM upsert_google_maps_data($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`;

                // Generar ID único: preferir place_id, sino usar hash de URL
                const uniqueId = item.google_place_id || item.google_maps_url;

                const values = [
                    item.nombre,
                    uniqueId,
                    item.google_place_id,
                    item.google_maps_url,
                    item.rating,
                    item.review_count || 0,
                    item.telefono,
                    item.website,
                    item.raw_info,
                    categoria,
                    cp,
                    'nuevo'
                ];

                const result = await db.query(query, values);
                const { operation } = result.rows[0];

                if (operation === 'INSERT') {
                    stats.inserted++;
                    console.log(`  ✅ NUEVO: ${item.nombre}`);
                } else {
                    stats.updated++;
                    console.log(`  🔄 ACTUALIZADO: ${item.nombre}`);
                }

                // Estadísticas de calidad
                if (item.telefono) stats.withPhone++;
                if (item.website) stats.withWeb++;

                if (debug) {
                    console.log(`      📞 ${item.telefono || 'Sin teléfono'}`);
                    console.log(`      🌐 ${item.website || 'Sin web'}`);
                    console.log(`      📍 ${item.direccion || 'Sin dirección'}`);
                }

            } catch (dbErr) {
                stats.errors++;
                console.error(`  ❌ Error guardando ${item.nombre}: ${dbErr.message}`);
            }
        }

        // Resumen final
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('📊 RESUMEN DE EXTRACCIÓN');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`   Total procesados: ${stats.total}`);
        console.log(`   ✅ Nuevos: ${stats.inserted}`);
        console.log(`   🔄 Actualizados: ${stats.updated}`);
        console.log(`   ❌ Errores: ${stats.errors}`);
        console.log('───────────────────────────────────────────────────────────');
        console.log(`   📞 Con teléfono: ${stats.withPhone} (${Math.round(stats.withPhone / stats.total * 100)}%)`);
        console.log(`   🌐 Con website: ${stats.withWeb} (${Math.round(stats.withWeb / stats.total * 100)}%)`);
        console.log('═══════════════════════════════════════════════════════════');

    } catch (err) {
        console.error('❌ Error crítico durante la extracción:', err);
    } finally {
        await extractor.close();
        await db.pool.end();
    }
}

// Ejecutar
const options = parseArgs();
run(options);
