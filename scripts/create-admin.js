const { UserService } = require('../services/users');
const db = require('../api/db');

async function createAdmin() {
    try {
        const users = new UserService();

        const email = process.argv[2] || 'admin@guiapymes.com';
        const password = process.argv[3] || 'admin123';

        console.log(`Creating admin user: ${email}`);

        const newUser = await users.createUser({
            email,
            password,
            nombre_completo: 'Super Admin',
            rol: 'super_admin',
            activo: true,
            telefono: '0000000000'
        });

        console.log('User created successfully:', newUser);
    } catch (err) {
        console.error('Error creating user:', err.message);
    } finally {
        process.exit();
    }
}

createAdmin();
