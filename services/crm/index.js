/**
 * CRM Service - GuíaPymes
 * Gestión de empresas y contactos usando PostgreSQL directo
 */

const db = require('../../api/db');

class CRMService {
  async getEntity(id) {
    const result = await db.query('SELECT fn_crm_get_entity($1) as entity', [id]);
    return result.rows[0]?.entity;
  }

  async createEntity(entityData) {
    const { nombre_legal, slug, descripcion, razon_social, cuit, tipo_entidad } = entityData;
    const result = await db.query(
      'SELECT * FROM fn_crm_create_entity($1, $2, $3, $4, $5, $6)',
      [nombre_legal, slug, descripcion, razon_social, cuit, tipo_entidad]
    );
    return result.rows[0];
  }

  async updateEntity(id, updateData) {
    const result = await db.query(
      'SELECT * FROM fn_crm_update_entity($1, $2)',
      [id, JSON.stringify(updateData)]
    );
    return result.rows[0];
  }
}

module.exports = { CRMService };
