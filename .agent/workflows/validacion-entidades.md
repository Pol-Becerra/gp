---
description: Validación y scoring de entidades (0-100) con múltiples criterios
---

# Validación de Entidades - GuíaPymes

## Criterios de Scoring (0-100)

| Criterio | Peso | Descripción |
|----------|------|-------------|
| Datos completos | 25% | Nombre, dirección, teléfono, categoría |
| CUIT válido | 20% | Verificación en AFIP (archivo local) |
| Teléfono verificado | 15% | Formato válido, área correcta |
| Sitio web activo | 15% | URL responde HTTP 200 |
| Ubicación precisa | 15% | Coordenadas dentro de Argentina |
| Sin duplicados | 10% | No coincide con entidad existente |

## Pasos

1. **Revisar datos pendientes**

   ```sql
   SELECT * FROM data_google_maps 
   WHERE etiqueta = 'nuevo' 
   AND matched_entidad_id IS NULL;
   ```

2. **Ejecutar validación**

   ```bash
   // turbo
   node scripts/validate-entities.js --batch=50
   ```

3. **Resultados del scoring**
   - Score >= 70: Auto-crear entidad
   - Score 50-69: Revisar manualmente
   - Score < 50: Marcar para verificación

4. **Crear entidad validada**
   - Datos van a tabla `entidades`
   - Crear relaciones: direcciones, telefonos, emails
   - Asignar categorías

5. **Verificar entidades creadas**

   ```sql
   SELECT id, nombre_legal, validation_score, activa 
   FROM entidades 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

## Reglas de Negocio

- CUIT debe ser único (11 dígitos)
- Al menos 1 dirección requerida
- Categoría primaria obligatoria
