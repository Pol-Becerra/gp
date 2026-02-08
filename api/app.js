/**
 * Express.js API Server - GuíaPymes
 * Conectado a PostgreSQL y servicios internos
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { CRMService } = require('../services/crm');
const { CategoryService } = require('../services/crm/categories');
const { TaskService } = require('../services/task-management');
const db = require('./db');

const app = express();
const PORT = process.env.API_PORT || 4000;

console.log(`🚀 [BACKEND] API corriendo en http://localhost:${PORT}`);
console.log(`🏠 [BACKEND] NODE_ENV: ${process.env.NODE_ENV}`);

const crm = new CRMService();
const categories = new CategoryService();
const tasks = new TaskService();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('<h1>GuíaPymes API</h1><p>El backend se está ejecutando correctamente. Usa <a href="/health">/health</a> para verificar el estado.</p>');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// APIs para Entidades
app.get('/api/entities', async (req, res) => {
    try {
        const { has_web } = req.query;
        let query = `
            SELECT e.*, 
            (SELECT url FROM sitios_web WHERE entidad_id = e.id AND es_principal = true LIMIT 1) as website
            FROM entidades e
        `;

        const conditions = [];
        if (has_web === 'true') {
            conditions.push(`EXISTS (SELECT 1 FROM sitios_web WHERE entidad_id = e.id)`);
        } else if (has_web === 'false') {
            conditions.push(`NOT EXISTS (SELECT 1 FROM sitios_web WHERE entidad_id = e.id)`);
        }

        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(' AND ');
        }

        query += ` ORDER BY e.fecha_creacion DESC LIMIT 50`;

        const { rows } = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/entities/:id', async (req, res) => {
    try {
        const entity = await crm.getEntity(req.params.id);
        if (!entity) return res.status(404).json({ error: 'Entidad no encontrada' });
        res.json(entity);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// APIs para Categorías
app.get('/api/categories', async (req, res) => {
    try {
        const data = await categories.getCategories();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/categories', async (req, res) => {
    try {
        const data = await categories.createCategory(req.body);
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/categories/:id', async (req, res) => {
    try {
        const data = await categories.updateCategory(req.params.id, req.body);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        const success = await categories.deleteCategory(req.params.id);
        if (success) res.json({ message: 'Categoría eliminada' });
        else res.status(404).json({ error: 'Categoría no encontrada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// APIs para Tareas
app.get('/api/tasks', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM tasks_tickets ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API para ejecutar el Scraper
const { GoogleMapsExtractor } = require('../services/data-extraction');

app.post('/api/scraper/run', async (req, res) => {
    const { category, postalCode } = req.body;

    if (!category || !postalCode) {
        return res.status(400).json({ error: 'Categoría y Código Postal son requeridos' });
    }

    console.log(`[API] Iniciando scraper para: ${category} en CP ${postalCode}`);

    // Responder inmediatamente para no dejar colgado el frontend
    res.json({
        status: 'pending',
        message: 'El scraper ha comenzado. Los resultados aparecerán en unos minutos.'
    });

    // Ejecutar en background
    (async () => {
        const extractor = new GoogleMapsExtractor({ headless: true, maxResults: 40 });
        try {
            await extractor.init();
            const results = await extractor.search(category, postalCode);

            for (const item of results) {
                const query = `
                    INSERT INTO data_google_maps (
                      nombre, google_maps_id, google_place_id, google_maps_url,
                      rating, review_count, telefono, website, raw_info,
                      etiqueta, search_category, search_postal_code, search_timestamp
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
                    item.nombre, item.google_place_id || item.google_maps_url,
                    item.google_place_id, item.google_maps_url,
                    item.rating, item.review_count || 0,
                    item.telefono, item.website, item.raw_info,
                    category, postalCode
                ];
                await db.query(query, values);
            }
            console.log(`[API] ✅ Scraper finalizado con ${results.length} resultados.`);
        } catch (err) {
            console.error('[API] ❌ Error en proceso background del scraper:', err);
        } finally {
            try {
                await extractor.close();
            } catch (e) { }
        }
    })().catch(err => console.error('[API] Fatal background error:', err));
});

// API para Data Google Maps (Cruda) - Mostrar solo nuevos
app.get('/api/raw-data', async (req, res) => {
    try {
        const { rows } = await db.query("SELECT * FROM data_google_maps WHERE etiqueta = 'nuevo' ORDER BY created_at DESC LIMIT 100");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Aprobar data cruda y convertir en Entidad
app.post('/api/raw-data/:id/approve', async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Obtener la data cruda
        const rawRes = await db.query('SELECT * FROM data_google_maps WHERE id = $1', [id]);
        if (rawRes.rows.length === 0) return res.status(404).json({ error: 'Registro no encontrado' });

        const raw = rawRes.rows[0];

        // 2. Crear el slug
        const slug = raw.nombre.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + id.substring(0, 4);

        // 3. Insertar en entidades
        const insertQuery = `
            INSERT INTO entidades (nombre_legal, slug, validation_score, activa, fecha_creacion)
            VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
            RETURNING id
        `;
        const entRes = await db.query(insertQuery, [raw.nombre, slug, raw.rating || 0]);
        const newEntityId = entRes.rows[0].id;

        // 3b. Insertar Teléfono si existe
        if (raw.telefono) {
            await db.query(`
                INSERT INTO telefonos (entidad_id, numero, tipo_telefonico, validado, es_principal)
                VALUES ($1, $2, 'fijo', true, true)
            `, [newEntityId, raw.telefono]);
        }

        // 3c. Insertar Sitio Web si existe
        if (raw.website) {
            await db.query(`
                INSERT INTO sitios_web (entidad_id, url, validado, es_principal)
                VALUES ($1, $2, true, true)
            `, [newEntityId, raw.website]);
        }

        // 4. Marcar como procesado y vincular
        await db.query(`
            UPDATE data_google_maps 
            SET etiqueta = 'procesado', matched_entidad_id = $1, processed_at = CURRENT_TIMESTAMP 
            WHERE id = $2
        `, [newEntityId, id]);

        res.json({ success: true, entityId: newEntityId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
