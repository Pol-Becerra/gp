---
description: Extracción automática de datos de PyMEs desde Google Maps usando Puppeteer
---

# Scraping Google Maps - GuíaPymes

## Prerequisitos

- Puppeteer instalado (`npm install puppeteer`)
- Conexión a PostgreSQL configurada

## Pasos

1. **Definir parámetros de búsqueda**
   - Categoría: ej. "restaurantes", "ferreterías"
   - Código postal: ej. "1425", "5000"
   - Máximo resultados: 100 por búsqueda

2. **Ejecutar extracción**

   ```bash
   // turbo
   node scripts/scrape-google-maps.js --categoria="restaurantes" --postal="1425"
   ```

3. **Datos extraídos van a tabla `data_google_maps`**
   - nombre, address, telefono, website
   - latitude, longitude
   - rating, review_count
   - google_maps_id, google_place_id

4. **Análisis automático de duplicados**
   - Detecta por nombre similar + ubicación cercana
   - Marca `etiqueta` como 'nuevo', 'duplicado', 'sucursal'

5. **Verificar en PostgreSQL**

   ```sql
   SELECT * FROM data_google_maps 
   WHERE etiqueta = 'nuevo' 
   ORDER BY created_at DESC 
   LIMIT 20;
   ```

## Notas

- Respetar rate limiting de Google (delays entre requests)
- Máximo 50,000 empresas/mes según documentación
- Datos crudos requieren validación posterior
