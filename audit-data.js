const db = require('./api/db');

async function auditData() {
    try {
        const res = await db.query('SELECT COUNT(*) as total, COUNT(telefono) as con_tel, COUNT(website) as con_web FROM data_google_maps');
        const stats = res.rows[0];

        console.log('--- AUDITORÍA DE DATOS ---');
        console.log(`Total registros: ${stats.total}`);
        console.log(`Con teléfono: ${stats.con_tel} (${((stats.con_tel / stats.total) * 100).toFixed(2)}%)`);
        console.log(`Con website: ${stats.con_web} (${((stats.con_web / stats.total) * 100).toFixed(2)}%)`);

        const recent = await db.query('SELECT nombre, telefono, website, search_timestamp FROM data_google_maps ORDER BY search_timestamp DESC LIMIT 20');
        console.log('\n--- ÚLTIMOS 20 REGISTROS (NUEVOS) ---');
        recent.rows.forEach(r => {
            const hasTel = r.telefono ? '✅' : '❌';
            const hasWeb = r.website ? '✅' : '❌';
            console.log(`${hasTel} Tel | ${hasWeb} Web | ${r.nombre}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

auditData();
