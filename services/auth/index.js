const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../api/db'); // Adjust path as needed, based on typical structure
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeychangeinproduction';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRE || '24h';

class AuthService {
    async login(email, password) {
        // 1. Check if user exists
        const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            throw new Error('Credenciales inválidas');
        }

        if (!user.activo) {
            throw new Error('Usuario inactivo');
        }

        // 2. Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new Error('Credenciales inválidas');
        }

        // 3. Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, rol: user.rol },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // 4. Update last login
        await db.query('UPDATE usuarios SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                nombre_completo: user.nombre_completo,
                rol: user.rol
            }
        };
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            throw new Error('Token inválido o expirado');
        }
    }
}

module.exports = { AuthService };
