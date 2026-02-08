/**
 * Area Service - GuíaPymes
 * CRUD para áreas de tickets usando procedimientos almacenados de PostgreSQL
 */

const db = require('../../api/db');

class AreaService {
    /**
     * Obtener todas las áreas
     * Usa: get_all_areas()
     */
    async getAllAreas(includeInactive = false) {
        const result = await db.query(
            'SELECT * FROM get_all_areas($1)',
            [includeInactive]
        );
        return result.rows;
    }

    /**
     * Obtener un área por ID
     * Usa: get_area_by_id()
     */
    async getAreaById(id) {
        const result = await db.query(
            'SELECT * FROM get_area_by_id($1)',
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Crear una nueva área
     * Usa: create_area()
     */
    async createArea(data) {
        const { nombre, descripcion, color_hex, icono } = data;

        const result = await db.query(
            'SELECT * FROM create_area($1, $2, $3, $4)',
            [nombre, descripcion || null, color_hex || '#6366f1', icono || null]
        );

        return result.rows[0];
    }

    /**
     * Actualizar un área existente
     * Usa: update_area()
     */
    async updateArea(id, data) {
        const { nombre, descripcion, color_hex, icono, activa } = data;

        const result = await db.query(
            'SELECT * FROM update_area($1, $2, $3, $4, $5, $6)',
            [id, nombre || null, descripcion || null, color_hex || null, icono || null, activa]
        );

        const row = result.rows[0];
        if (!row || !row.success) return null;
        return row;
    }

    /**
     * Eliminar un área
     * Usa: delete_area()
     */
    async deleteArea(id, hardDelete = false) {
        const result = await db.query(
            'SELECT * FROM delete_area($1, $2)',
            [id, hardDelete]
        );

        const row = result.rows[0];
        return row;
    }
}

module.exports = { AreaService };
