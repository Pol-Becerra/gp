/**
 * CRM Service - GuíaPymes
 * Gestión de empresas y contactos usando PostgreSQL directo
 */

const db = require('../../api/db');

class CRMService {
    async getEntity(id) {
        const query = `
      SELECT e.*, 
             (SELECT json_agg(d.*) FROM direcciones d WHERE d.entidad_id = e.id) as direcciones,
             (SELECT json_agg(t.*) FROM telefonos t WHERE t.entidad_id = e.id) as telefonos,
             (SELECT json_agg(em.*) FROM emails em WHERE em.entidad_id = e.id) as emails,
             (SELECT json_agg(s.*) FROM sitios_web s WHERE s.entidad_id = e.id) as sitios_web,
             (SELECT json_agg(r.*) FROM redes_sociales r WHERE r.entidad_id = e.id) as redes_sociales,
             (SELECT json_agg(c.*) FROM contactos c WHERE c.entidad_id = e.id) as contactos
      FROM entidades e
      WHERE e.id = $1
    `;

        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    async createEntity(entityData) {
        const { nombre_legal, slug, descripcion, razon_social, cuit, tipo_entidad } = entityData;
        const query = `
      INSERT INTO entidades (nombre_legal, slug, descripcion, razon_social, cuit, tipo_entidad)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

        const result = await db.query(query, [nombre_legal, slug, descripcion, razon_social, cuit, tipo_entidad]);
        return result.rows[0];
    }

    async updateEntity(id, updateData) {
        const keys = Object.keys(updateData);
        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = [id, ...Object.values(updateData)];

        const query = `
      UPDATE entidades
      SET ${setClause}, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

        const result = await db.query(query, values);
        return result.rows[0];
    }
}

module.exports = { CRMService };
