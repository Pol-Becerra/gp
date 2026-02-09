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

    // Generate slug if not provided
    const finalSlug = slug || nombre_legal.toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');

    // Ensure empty CUIT is null to avoid constraint violation
    const finalCuit = cuit && cuit.trim() !== '' ? cuit.replace(/\D/g, '') : null;

    const result = await db.query(
      'SELECT * FROM fn_crm_create_entity($1, $2, $3, $4, $5, $6)',
      [nombre_legal, finalSlug, descripcion, razon_social, finalCuit, tipo_entidad]
    );
    return result.rows[0];
  }

  async listEntities(limit = 50, offset = 0, search = null, hasWeb = null) {
    const result = await db.query(
      'SELECT * FROM fn_crm_get_entities_advanced($1, $2, $3, $4)',
      [limit, offset, search, hasWeb]
    );
    // If no results, result.rows is empty. If results, total_count is in each row.
    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

    return {
      data: result.rows.map(row => ({
        id: row.id,
        nombre_legal: row.nombre_legal,
        slug: row.slug,
        cuit: row.cuit,
        tipo_entidad: row.tipo_entidad,
        activa: row.activa,
        validation_score: row.validation_score,
        fecha_creacion: row.fecha_creacion,
        website: row.website
      })),
      total: totalCount,
      limit,
      offset
    };
  }

  async updateEntity(id, updateData) {
    // Ensure empty CUIT is null to avoid constraint violation
    if (updateData.cuit !== undefined) {
      updateData.cuit = updateData.cuit && updateData.cuit.trim() !== '' ? updateData.cuit.replace(/\D/g, '') : null;
    }

    const result = await db.query(
      'SELECT * FROM fn_crm_update_entity($1, $2)',
      [id, JSON.stringify(updateData)]
    );
    return result.rows[0];
  }

  // Related Data Management
  async addPhone(entityId, phoneData) {
    const { numero, tipo, uso } = phoneData;
    const result = await db.query('SELECT fn_crm_add_phone($1, $2, $3, $4) as id', [entityId, numero, tipo, uso]);
    return result.rows[0];
  }

  async removePhone(phoneId) {
    const result = await db.query('SELECT fn_crm_remove_phone($1) as success', [phoneId]);
    return result.rows[0];
  }

  async addEmail(entityId, emailData) {
    const { email, uso } = emailData;
    const result = await db.query('SELECT fn_crm_add_email($1, $2, $3) as id', [entityId, email, uso]);
    return result.rows[0];
  }

  async removeEmail(emailId) {
    const result = await db.query('SELECT fn_crm_remove_email($1) as success', [emailId]);
    return result.rows[0];
  }

  async addWebsite(entityId, webData) {
    const { url, tipo } = webData;
    const result = await db.query('SELECT fn_crm_add_website($1, $2, $3) as id', [entityId, url, tipo]);
    return result.rows[0];
  }

  async removeWebsite(webId) {
    const result = await db.query('SELECT fn_crm_remove_website($1) as success', [webId]);
    return result.rows[0];
  }

  async addSocial(entityId, socialData) {
    const { plataforma, url } = socialData;
    const result = await db.query('SELECT fn_crm_add_social($1, $2, $3) as id', [entityId, plataforma, url]);
    return result.rows[0];
  }

  async removeSocial(socialId) {
    const result = await db.query('SELECT fn_crm_remove_social($1) as success', [socialId]);
    return result.rows[0];
  }

  async addAddress(entityId, addressData) {
    const { calle, numero, localidad, provincia, tipo } = addressData;
    const result = await db.query('SELECT fn_crm_add_address($1, $2, $3, $4, $5, $6) as id', [entityId, calle, numero, localidad, provincia, tipo]);
    return result.rows[0];
  }

  async removeAddress(addressId) {
    const result = await db.query('SELECT fn_crm_remove_address($1) as success', [addressId]);
    return result.rows[0];
  }

  async linkCategory(entityId, categoryId, isPrimary = false) {
    const result = await db.query('SELECT fn_crm_link_category($1, $2, $3) as id', [entityId, categoryId, isPrimary]);
    return result.rows[0];
  }

  async unlinkCategory(entityId, categoryId) {
    const result = await db.query('SELECT fn_crm_unlink_category($1, $2) as success', [entityId, categoryId]);
    return result.rows[0];
  }

  // Tags
  async getTags(aplicableA = 'entidades') {
    const result = await db.query('SELECT * FROM fn_crm_get_all_tags($1)', [aplicableA]);
    return result.rows;
  }

  async createTag(tagData) {
    const { nombre, descripcion, tipo, color_hex, icono, aplicable_a } = tagData;
    const result = await db.query(
      'SELECT fn_crm_create_tag($1, $2, $3, $4, $5, $6) as id',
      [nombre, descripcion, tipo, color_hex, icono, aplicable_a]
    );
    return result.rows[0];
  }

  async linkTag(entityId, tagId) {
    const result = await db.query('SELECT fn_crm_link_tag($1, $2) as id', [entityId, tagId]);
    return result.rows[0];
  }

  async unlinkTag(entityId, tagId) {
    const result = await db.query('SELECT fn_crm_unlink_tag($1, $2) as success', [entityId, tagId]);
    return result.rows[0];
  }

  // Managers
  async assignManager(entityId, managerId) {
    const result = await db.query('SELECT fn_crm_assign_manager($1, $2) as success', [entityId, managerId]);
    return result.rows[0];
  }

  async deleteEntity(id) {
    const result = await db.query('SELECT fn_crm_delete_entity($1) as success', [id]);
    return result.rows[0]?.success;
  }
}

module.exports = { CRMService };
