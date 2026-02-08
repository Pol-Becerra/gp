# Validation Service

Servicio de validación y scoring de entidades (0-100).

## Criterios de Scoring

| Criterio | Peso |
|----------|------|
| Datos completos | 25% |
| CUIT válido | 20% |
| Teléfono verificado | 15% |
| Sitio web activo | 15% |
| Ubicación precisa | 15% |
| Sin duplicados | 10% |

## Archivos

- `index.js` - Entry point
- `scorer.js` - Algoritmo de scoring
- `validators/` - Validadores específicos
