/**
 * Category Service - GuíaPymes
 * Gestión de categorías usando PostgreSQL directo
 */

const db = require('../../api/db');

class CategoryService {
    async getCategories() {
        const result = await db.query('SELECT * FROM fn_category_get_all()');
        return result.rows;
    }

    async getCategoryById(id) {
        const result = await db.query('SELECT * FROM fn_category_get_by_id($1)', [id]);
        return result.rows[0];
    }

    async createCategory(categoryData) {
        const { nombre, slug, descripcion, icono_url, color_hex, parent_id, nivel_profundidad, orden } = categoryData;

        // Generate slug if not provided
        const finalSlug = slug || nombre.toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '');

        const result = await db.query(
            'SELECT * FROM fn_category_create($1, $2, $3, $4, $5, $6, $7, $8)',
            [
                nombre, finalSlug, descripcion, icono_url, color_hex,
                parent_id, nivel_profundidad || 0, orden || 0
            ]
        );
        return result.rows[0];
    }

    async updateCategory(id, updateData) {
        const result = await db.query(
            'SELECT * FROM fn_category_update($1, $2)',
            [id, JSON.stringify(updateData)]
        );
        return result.rows[0];
    }

    async deleteCategory(id) {
        const result = await db.query('SELECT fn_category_delete($1) as success', [id]);
        return result.rows[0]?.success;
    }
}

module.exports = { CategoryService };
