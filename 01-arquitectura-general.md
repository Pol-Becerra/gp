# ARQUITECTURA GENERAL - ANTIGRAVITY GUIAPYMES

## Visión General
Sistema de Automatización Inteligente para Gestión de PyMEs Argentinas con extracción de datos de Google Maps, validación, CRM y gestión de tareas automáticas.

## Stack Técnico Recomendado

### Backend
- **Framework**: Express.js (Node.js)
- **Lenguaje alternativo**: Go (alto rendimiento para processamiento en paralelo)
- **Razón Go es más performante**: Compilado, bajo consumo de memoria, mejor para I/O concurrente

### Frontend
- **Framework**: Next.js 14+ (React moderno)
- **Styling**: Tailwind CSS
- **Razón**: Server components, API routes integradas, excelente SEO para directorio

### Base de Datos
- **Principal**: PostgreSQL 15+
- **Caché**: Redis (para tareas en paralelo, colas)
- **Búsqueda**: Elasticsearch (opcional, para búsqueda avanzada de PyMEs)

### Infraestructura
- **Contenedorización**: Docker
- **Orquestación**: Docker Compose (desarrollo) / Kubernetes (producción opcional)
- **Deployment**: Contabo VPS con Dokploy
- **CI/CD**: GitHub Actions

### Modelos de IA
- **Primario**: Claude (Google Antigravity)
- **Secundario**: GPT-4 (OpenAI) - para validación cruzada
- **Local**: Ollama (modelos open-source para análisis de código)

## Estructura Monolítica Modular

```
guiapymes-antigravity/
├── services/
│   ├── data-extraction/     # Extracción de Google Maps
│   ├── validation/          # Validación de empresas
│   ├── crm/                 # Gestión de relaciones
│   ├── task-management/     # Gestión de tickets
│   └── analytics/           # Reportes y análisis
├── agents/                  # Agentes Antigravity
│   ├── architect/
│   ├── builders/
│   ├── db-persistence/
│   ├── qa-browser/
│   ├── ui-ux/
│   ├── logic/
│   ├── integration/
│   └── browser/
├── skills/                  # Skills especializados
├── api/                     # API REST Express
├── web/                     # Frontend Next.js
├── migrations/              # Migraciones DB
└── docker/                  # Configuración Docker
```

## Flujos Principales

1. **Extracción de Datos**
   - Bot de Google Maps (web scraping ético)
   - Extracción de: Nombre, dirección, teléfono, categoría, horarios
   
2. **Validación**
   - Verificación de actividad en AFIP
   - Validación de datos duplicados
   - Scoring de confiabilidad
   
3. **Ingesta al CRM**
   - Deduplicación
   - Normalización de datos
   - Asignación a gestores
   
4. **Gestión de Tareas**
   - Tickets automáticos por validación fallida
   - Asignación inteligente
   - Seguimiento de estado

## Niveles de Acceso

- **Super Administrador**: Acceso completo, configuración del sistema
- **Administrador**: Gestión de datos, usuarios, reportes
- **Gestor de Cuentas**: Asignación de empresas, seguimiento

## Seguridad

- JWT para autenticación
- Encriptación de credenciales en .env
- Rate limiting en APIs
- Auditoría de cambios en DB
- Validación en backend y frontend
