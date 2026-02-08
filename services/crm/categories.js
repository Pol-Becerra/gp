/**
 * Category Service - GuíaPymes
 * Gestión de categorías usando PostgreSQL directo
 */

const db = require('../../api/db');

class CategoryService {
    async getCategories() {
        const query = `
            SELECT * FROM categorias 
            ORDER BY nivel_profundidad ASC, orden ASC, nombre ASC
        `;
        const result = await db.query(query);
        return result.rows;
    }

    async getCategoryById(id) {
        const query = 'SELECT * FROM categorias WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    async createCategory(categoryData) {
        const { nombre, slug, descripcion, icono_url, color_hex, parent_id, nivel_profundidad, orden } = categoryData;

        // Generate slug if not provided
        const finalSlug = slug || nombre.toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '');

        const query = `
            INSERT INTO categorias (
                nombre, slug, descripcion, icono_url, color_hex, 
                parent_id, nivel_profundidad, orden
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;

        const values = [
            nombre, finalSlug, descripcion, icono_url, color_hex,
            parent_id, nivel_profundidad || 0, orden || 0
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    async updateCategory(id, updateData) {
        // Only allow these fields to be updated
        const allowedFields = ['nombre', 'slug', 'descripcion', 'icono_url', 'color_hex', 'parent_id', 'nivel_profundidad', 'orden', 'activa'];

        const filteredData = {};
        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key)) {
                filteredData[key] = updateData[key];
            }
        });

        const keys = Object.keys(filteredData);
        if (keys.length === 0) return this.getCategoryById(id);

        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = [id, ...Object.values(filteredData)];

        const query = `
            UPDATE categorias
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    async deleteCategory(id) {
        // Warning: This will fail if there are foreign key constraints (like in entidad_categorias)
        // Schema shows 
        const query = 'DELETE FROM categorias WHERE id = $1 RETURNING id';
        const result = await db.query(query, [id]);
        return result.rows.length > 0;
    }
}

module.exports = { CategoryService };
