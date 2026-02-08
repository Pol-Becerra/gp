/**
 * Validation Service - GuíaPymes
 * Scoring de entidades (0-100) usando PostgreSQL directo
 */

const db = require('../../api/db');

const WEIGHTS = {
    datosCompletos: 0.25,
    cuitValido: 0.20,
    telefonoVerificado: 0.15,
    sitioWebActivo: 0.15,
    ubicacionPrecisa: 0.15,
    sinDuplicados: 0.10
};

class EntityValidator {
    async validate(entity) {
        const scores = {
            datosCompletos: this.checkCompleteness(entity),
            cuitValido: await this.validateCuit(entity.cuit),
            telefonoVerificado: this.validatePhone(entity.telefono),
            sitioWebActivo: await this.checkWebsite(entity.website),
            ubicacionPrecisa: this.validateLocation(entity.latitude, entity.longitude),
            sinDuplicados: await this.checkDuplicates(entity)
        };

        const totalScore = Object.entries(scores).reduce((total, [key, score]) => {
            return total + (score * WEIGHTS[key]);
        }, 0);

        return {
            score: Math.round(totalScore * 100),
            details: scores,
            status: this.getStatus(totalScore * 100)
        };
    }

    checkCompleteness(entity) {
        const requiredFields = ['nombre', 'direccion', 'telefono', 'categoria'];
        const filledFields = requiredFields.filter(f => entity[f] && typeof entity[f] === 'string' && entity[f].trim());
        return filledFields.length / requiredFields.length;
    }

    async validateCuit(cuit) {
        if (!cuit) return 0;
        const cleanCuit = cuit.replace(/\D/g, '');
        if (cleanCuit.length !== 11) return 0;
        return 1;
    }

    validatePhone(phone) {
        if (!phone) return 0;
        const cleaned = phone.replace(/\D/g, '');
        return (cleaned.length >= 10 && cleaned.length <= 11) ? 1 : 0.5;
    }

    async checkWebsite(url) {
        if (!url) return 0;
        try {
            // Nota: Fetch está disponible en Node 18+ de forma nativa
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok ? 1 : 0.5;
        } catch {
            return 0;
        }
    }

    validateLocation(lat, lng) {
        if (!lat || !lng) return 0;
        const inArgentina = lat >= -55 && lat <= -22 && lng >= -73 && lng <= -53;
        return inArgentina ? 1 : 0;
    }

    async checkDuplicates(entity) {
        const result = await db.query('SELECT fn_validation_check_duplicates($1, $2) as is_unique', [entity.nombre, entity.cuit]);
        return result.rows[0]?.is_unique ? 1 : 0;
    }

    getStatus(score) {
        if (score >= 70) return 'auto_approve';
        if (score >= 50) return 'manual_review';
        return 'needs_verification';
    }
}

module.exports = { EntityValidator, WEIGHTS };
