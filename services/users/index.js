const bcrypt = require('bcryptjs');
const db = require('../../api/db');

class UserService {
    async getAllUsers() {
        const result = await db.query('SELECT * FROM fn_user_get_all()');
        return result.rows;
    }

    async getUserById(id) {
        const result = await db.query('SELECT * FROM fn_user_get_by_id($1)', [id]);
        return result.rows[0];
    }

    async createUser(data) {
        const { email, password, nombre_completo, telefono, rol, activo } = data;

        // Check if user already exists
        const existingUser = await db.query('SELECT * FROM fn_auth_get_user_by_email($1)', [email]);
        if (existingUser.rows.length > 0) {
            throw new Error('El email ya está registrado');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.query(
            'SELECT * FROM fn_user_create($1, $2, $3, $4, $5, $6)',
            [email, hashedPassword, nombre_completo, telefono, rol || 'gestor', activo !== undefined ? activo : true]
        );

        return result.rows[0];
    }

    async updateUser(id, data) {
        const { password, ...updateData } = data;

        if (password) {
            updateData.password_hash = await bcrypt.hash(password, 10);
        }

        const result = await db.query(
            'SELECT * FROM fn_user_update($1, $2)',
            [id, JSON.stringify(updateData)]
        );
        return result.rows[0];
    }

    async deleteUser(id) {
        const result = await db.query('SELECT fn_user_delete($1) as id', [id]);
        return result.rows[0];
    }
}

module.exports = { UserService };
