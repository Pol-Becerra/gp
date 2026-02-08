const bcrypt = require('bcryptjs');
const db = require('../../api/db');

class UserService {
    async getAllUsers() {
        const result = await db.query(
            'SELECT id, email, nombre_completo, telefono, rol, activo, last_login, created_at FROM usuarios ORDER BY created_at DESC'
        );
        return result.rows;
    }

    async getUserById(id) {
        const result = await db.query(
            'SELECT id, email, nombre_completo, telefono, rol, activo, last_login, created_at FROM usuarios WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    async createUser(data) {
        const { email, password, nombre_completo, telefono, rol, activo } = data;

        // Check if user already exists
        const existingUser = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            throw new Error('El email ya está registrado');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.query(
            `INSERT INTO usuarios (email, password_hash, nombre_completo, telefono, rol, activo)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, email, nombre_completo, rol, activo, created_at`,
            [email, hashedPassword, nombre_completo, telefono, rol || 'gestor', activo !== undefined ? activo : true]
        );

        return result.rows[0];
    }

    async updateUser(id, data) {
        const { nombre_completo, telefono, rol, activo, password } = data;

        // Build dynamic update query
        let query = 'UPDATE usuarios SET updated_at = CURRENT_TIMESTAMP';
        const values = [];
        let paramIndex = 1;

        if (nombre_completo !== undefined) {
            query += `, nombre_completo = $${paramIndex}`;
            values.push(nombre_completo);
            paramIndex++;
        }
        if (telefono !== undefined) {
            query += `, telefono = $${paramIndex}`;
            values.push(telefono);
            paramIndex++;
        }
        if (rol !== undefined) {
            query += `, rol = $${paramIndex}`;
            values.push(rol);
            paramIndex++;
        }
        if (activo !== undefined) {
            query += `, activo = $${paramIndex}`;
            values.push(activo);
            paramIndex++;
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += `, password_hash = $${paramIndex}`;
            values.push(hashedPassword);
            paramIndex++;
        }

        query += ` WHERE id = $${paramIndex} RETURNING id, email, nombre_completo, rol, activo`;
        values.push(id);

        const result = await db.query(query, values);
        return result.rows[0];
    }

    async deleteUser(id) {
        // Check if user exists first to return meaningful error?
        // Or directly delete.
        // Also check if trying to delete self? (Middleware level maybe)
        const result = await db.query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);
        return result.rows[0];
    }
}

module.exports = { UserService };
