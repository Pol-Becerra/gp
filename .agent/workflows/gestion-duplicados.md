---
description: Detección y gestión de duplicados con 95%+ accuracy
---

# Gestión de Duplicados - GuíaPymes

## Algoritmo de Detección

1. **Normalización de nombres**
   - Quitar tildes, mayúsculas
   - Eliminar palabras comunes: "SRL", "SA", "S.A."
   - Aplicar fuzzy matching (Levenshtein)

2. **Criterios de match**
   - Nombre similar (>80% match)
   - Ubicación cercana (<500m)
   - Mismo teléfono
   - Mismo CUIT

## Pasos

1. **Detectar duplicados**

   ```bash
   // turbo
   node scripts/detect-duplicates.js
   ```

2. **Revisar posibles duplicados**

   ```sql
   SELECT id, nombre, detected_duplicates, 
          array_length(detected_duplicates, 1) as qty
   FROM data_google_maps 
   WHERE detected_duplicates IS NOT NULL
   ORDER BY qty DESC;
   ```

3. **Opciones de resolución**
   - **Unificar**: Combinar datos en 1 entidad
   - **Es Sucursal**: Crear como dirección adicional
   - **No es duplicado**: Procesar normalmente
   - **Descartar**: Marcar como inválido

4. **Ejecutar merge**

   ```bash
   // turbo
   node scripts/merge-entities.js --id=UUID --action=unify
   ```

5. **Registrar auditoría**
   - Toda acción va a `audit_log`
   - Guardar `valores_anteriores` y `valores_nuevos`

## Métricas

- Target accuracy: 95%+
- Falsos positivos aceptables: <5%
