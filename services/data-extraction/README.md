# Data Extraction Service

Servicio de extracción de datos de Google Maps usando Puppeteer.

## Funcionalidades

- Web scraping ético de Google Maps
- Búsqueda por categoría + código postal
- Máximo 100 resultados por búsqueda
- Almacenamiento en tabla `data_google_maps`

## Uso

```bash
node index.js --categoria="restaurantes" --postal="1425"
```

## Archivos

- `index.js` - Entry point
- `scraper.js` - Lógica de Puppeteer
- `parser.js` - Parsing de datos
