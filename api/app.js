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
const { AreaService } = require('../services/task-management/areas');
const { AuthService } = require('../services/auth');
const { UserService } = require('../services/users');
const { authenticateToken, authorizeRoles } = require('./middleware/auth');
const db = require('./db');

const app = express();
const PORT = process.env.API_PORT || 4000;

console.log(`🚀 [BACKEND] API corriendo en http://localhost:${PORT}`);
console.log(`🏠 [BACKEND] NODE_ENV: ${process.env.NODE_ENV}`);

const crm = new CRMService();
const categories = new CategoryService();
const tasks = new TaskService();
const areas = new AreaService();
const auth = new AuthService();
const users = new UserService();

// Middleware
// Middleware d
app.use(cors({
    origin: '*', // Permitir todas las conexiones. En producción restringir a dominios específicos.
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request logger middleware
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// app.use(helmet()); // Temporalmente deshabilitado para debug
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('<h1>GuíaPymes API</h1><p>El backend se está ejecutando correctamente. Usa <a href="/health">/health</a> para verificar el estado.</p>');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// =============================================
// AUTHENTICATION & USERS
// =============================================

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
        const result = await auth.login(email, password);
        res.json(result);
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json(req.user);
});

// User Management (Protected)
app.get('/api/users', authenticateToken, authorizeRoles('super_admin', 'admin'), async (req, res) => {
    try {
        const userList = await users.getAllUsers();
        res.json(userList);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users/:id', authenticateToken, authorizeRoles('super_admin', 'admin'), async (req, res) => {
    try {
        const user = await users.getUserById(req.params.id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users', authenticateToken, authorizeRoles('super_admin', 'admin'), async (req, res) => {
    try {
        const newUser = await users.createUser(req.body);
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/users/:id', authenticateToken, authorizeRoles('super_admin', 'admin'), async (req, res) => {
    try {
        const updated = await users.updateUser(req.params.id, req.body);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:id', authenticateToken, authorizeRoles('super_admin', 'admin'), async (req, res) => {
    try {
        const result = await users.deleteUser(req.params.id);
        res.json({ message: 'Usuario eliminado', id: result.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// APIs para Entidades
app.get('/api/entities', async (req, res) => {
    try {
        const { has_web } = req.query;
        const p_has_web = has_web === 'true' ? true : (has_web === 'false' ? false : null);

        const { rows } = await db.query('SELECT * FROM fn_crm_get_entities_filtered($1)', [p_has_web]);
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

// APIs para Tickets/Tareas (CRUD completo)
app.get('/api/tickets', async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            priority: req.query.priority,
            assigned_to: req.query.assigned_to,
            entity_id: req.query.entity_id,
            area_id: req.query.area_id,
            parent_id: req.query.parent_id,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined
        };
        const data = await tasks.getAllTickets(filters);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/tickets/stats', async (req, res) => {
    try {
        const stats = await tasks.getStats();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/tickets/:id', async (req, res) => {
    try {
        const ticket = await tasks.getTicketById(req.params.id);
        if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
        res.json(ticket);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/tickets', async (req, res) => {
    try {
        const { description, priority, status, entity_id, assigned_to, area_id, parent_id } = req.body;
        if (!description) {
            return res.status(400).json({ error: 'La descripción es requerida' });
        }
        const ticket = await tasks.createTicket({ description, priority, status, entity_id, assigned_to, area_id, parent_id });
        res.status(201).json(ticket);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/tickets/:id', async (req, res) => {
    try {
        const updated = await tasks.updateTicket(req.params.id, req.body);
        if (!updated) return res.status(404).json({ error: 'Ticket no encontrado' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/tickets/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ error: 'El estado es requerido' });
        const updated = await tasks.updateTicketStatus(req.params.id, status);
        if (!updated) return res.status(404).json({ error: 'Ticket no encontrado' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/tickets/:id', async (req, res) => {
    try {
        const deleted = await tasks.deleteTicket(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Ticket no encontrado' });
        res.json({ success: true, message: 'Ticket eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mantener endpoint legacy para compatibilidad
app.get('/api/tasks', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM get_all_tickets(NULL, NULL, NULL, NULL, NULL, NULL, 100)');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sub-tickets de un ticket padre
app.get('/api/tickets/:id/sub-tickets', async (req, res) => {
    try {
        const subTickets = await tasks.getSubTickets(req.params.id);
        res.json(subTickets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Usuarios disponibles para asignación
app.get('/api/users/assignable', async (req, res) => {
    try {
        const users = await tasks.getUsersForAssignment();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =============================================
// APIs para Áreas de Tickets (CRUD completo)
// =============================================
app.get('/api/areas', async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const data = await areas.getAllAreas(includeInactive);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/areas/:id', async (req, res) => {
    try {
        const area = await areas.getAreaById(req.params.id);
        if (!area) return res.status(404).json({ error: 'Área no encontrada' });
        res.json(area);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/areas', async (req, res) => {
    try {
        const { nombre, descripcion, color_hex, icono } = req.body;
        if (!nombre) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }
        const area = await areas.createArea({ nombre, descripcion, color_hex, icono });
        res.status(201).json(area);
    } catch (err) {
        if (err.message.includes('duplicate key')) {
            return res.status(400).json({ error: 'Ya existe un área con ese nombre' });
        }
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/areas/:id', async (req, res) => {
    try {
        const updated = await areas.updateArea(req.params.id, req.body);
        if (!updated) return res.status(404).json({ error: 'Área no encontrada' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/areas/:id', async (req, res) => {
    try {
        const hardDelete = req.query.hard === 'true';
        const result = await areas.deleteArea(req.params.id, hardDelete);
        if (!result.success) return res.status(404).json({ error: result.message });
        res.json(result);
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

    const stats = {
        total: 0,
        inserted: 0,
        updated: 0,
        errors: 0,
        withPhone: 0,
        withWeb: 0
    };

    const extractor = new GoogleMapsExtractor({ headless: true, maxResults: 50 });

    try {
        await extractor.init();
        const results = await extractor.search(category, postalCode);
        stats.total = results.length;

        for (const item of results) {
            try {
                // Usar stored procedure para upsert
                const query = `SELECT * FROM upsert_google_maps_data($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`;
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
                    category,
                    postalCode,
                    'nuevo'
                ];

                const result = await db.query(query, values);
                const { operation } = result.rows[0];

                if (operation === 'INSERT') {
                    stats.inserted++;
                } else {
                    stats.updated++;
                }

                if (item.telefono) stats.withPhone++;
                if (item.website) stats.withWeb++;

            } catch (dbErr) {
                stats.errors++;
                console.error(`[API] Error guardando ${item.nombre}: ${dbErr.message}`);
            }
        }

        console.log(`[API] ✅ Scraper finalizado: ${stats.total} total, ${stats.inserted} nuevos, ${stats.updated} actualizados`);

        res.json({
            status: 'success',
            message: `Extracción completada: ${stats.total} negocios procesados`,
            stats
        });

    } catch (err) {
        console.error('[API] ❌ Error en scraper:', err);
        res.status(500).json({
            status: 'error',
            error: err.message,
            stats
        });
    } finally {
        try {
            await extractor.close();
        } catch (e) { }
    }
});

// API para Data Google Maps (Cruda) - Mostrar solo nuevos
app.get('/api/raw-data', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM fn_raw_data_get_pending()');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Aprobar data cruda y convertir en Entidad
app.post('/api/raw-data/:id/approve', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM fn_raw_data_approve_and_convert($1)', [id]);
        const status = result.rows[0].fn_raw_data_approve_and_convert;

        if (!status.success) {
            return res.status(404).json({ error: status.error });
        }

        res.json({ success: true, entityId: status.entity_id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Limpiar tabla data_google_maps (DESARROLLO)
app.delete('/api/raw-data/clean', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM clean_data_google_maps(true)');
        const result = rows[0];
        res.json({
            success: true,
            deletedCount: result.deleted_count,
            message: result.message
        });
    } catch (err) {
        console.error('[API] Error al limpiar data_google_maps:', err);
        res.status(500).json({ error: err.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
