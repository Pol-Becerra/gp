# AGENTS.md - Guía Rápida para Agentes

> **⚡ INSTRUCCIÓN PARA AGENTES**: Lee este archivo primero antes de trabajar en este proyecto.

---

## 📋 ¿Qué es este proyecto?

**GuíaPymes** - Sistema de automatización inteligente para extraer, validar e ingestar datos de PyMEs argentinas desde Google Maps.

**Stack**: Next.js + Express.js + PostgreSQL + Docker

---

## 🤖 Agentes Disponibles (8)

| Agente | Rol | Archivo | Cuándo Usar |
|--------|-----|---------|-------------|
| **The Architect** | Orquestador principal | `agents/architect/architect-agent.md` | Decisiones técnicas, coordinación |
| **Backend Builder** | APIs Express.js | `agents/builders/builders-agents.md` | Endpoints, lógica de servidor |
| **Frontend Builder** | Next.js/React | `agents/builders/builders-agents.md` | UI, componentes, páginas |
| **Logic Builder** | Algoritmos | `agents/logic/logic-agent.md` | Scoring, validaciones, reglas |
| **Integration Builder** | Conectores | `agents/integration/integration-browser-agents.md` | APIs externas, webhooks |
| **DB Persistence** | PostgreSQL | `agents/db-persistence/db-persistence-agent.md` | Schemas, queries, migraciones |
| **QA Browser** | Testing | `agents/qa-browser/qa-browser-agent.md` | Tests, bugs, validación |
| **UI/UX Agent** | Diseño | `agents/ui-ux/ui-ux-agent.md` | Componentes, accesibilidad |

---

## 📚 Skills Especializados (7)

Cada skill tiene especificaciones técnicas detalladas en `skills/skills-library.md`:

1. **Google Maps Extractor** - Extracción de datos de empresas
2. **Validation Scorer** - Score de confiabilidad 0-100
3. **Duplicate Detection** - Detección de duplicados (95%+ accuracy)
4. **Manager Assignment** - Asignación inteligente de gestores
5. **Task Prioritization** - Priorización automática de tickets
6. **AFIP Validation** - Validación contra AFIP Argentina
7. **Email Notifier** - Notificaciones por email

---

## ⚡ Workflows Principales

Ubicados en `.agent/workflows/`:

- **`scraping-google-maps.md`** - Extracción diaria de datos
- **`validacion-entidades.md`** - Validación de empresas
- **`gestion-duplicados.md`** - Deduplicación
- **`deploy.md`** - Deployment con Dokploy

---

## 🏗️ Arquitectura

```
guiapymes/
├── services/               # Lógica de negocio
│   ├── data-extraction/   # Extracción Google Maps
│   ├── validation/        # Validación de empresas
│   ├── crm/               # Gestión de relaciones
│   ├── task-management/   # Tickets y tareas
│   └── analytics/         # Reportes
├── api/                   # Express.js REST API
├── web/                   # Next.js frontend
├── agents/                # Configuración de agentes
├── skills/                # Skills especializados
└── migrations/            # Migraciones PostgreSQL
```

---

## 🔧 Cómo Colaboran los Agentes

### Flujo Típico de Trabajo

```
1. The Architect recibe requerimiento
   ↓
2. Divide tareas entre Builders especializados
   ↓
3. DB Persistence diseña schema si es necesario
   ↓
4. Builders implementan (Backend/Frontend/Logic)
   ↓
5. QA Browser valida con tests
   ↓
6. Integration Builder conecta servicios externos
   ↓
7. UI/UX Agent revisa interfaz y experiencia
   ↓
8. The Architect revisa integración final
```

### Reglas de Colaboración

- **The Architect** coordina, nunca implementa directamente
- **Builders** implementan siguiendo estándares definidos
- **Logic Agent** maneja algoritmos complejos (scoring, deduplicación)
- **DB Persistence** es el único que toca schemas SQL
- **QA Browser** debe aprobar antes de merge
- **UI/UX Agent** revisa toda interfaz de usuario
- **Integration Agent** maneja todas las APIs externas

---

## 📖 Documentación Completa

| Archivo | Contenido |
|---------|-----------|
| `01-arquitectura-general.md` | Stack, estructura, flujos |
| `02-parallelization-errors.md` | Tareas paralelas, manejo de errores |
| `03-mcp-security-restrictions.md` | MCPs, seguridad, límites |
| `04-prompts-workflows-examples.md` | Prompts maestros, workflows |
| `06-schema-base-datos-v2.md` | Esquema completo PostgreSQL |
| `07-flujos-datos.md` | Flujos de datos detallados |

---

## 🚀 Comandos Útiles

```bash
# Setup inicial
npm install
cp .env.example .env
npm run db:migrate

# Desarrollo
npm run dev          # Backend + Frontend
npm run test         # Tests
npm run lint         # Linting

# Deploy
dokploy deploy --service guiapymes
```

---

## ⚠️ Convenciones Importantes

### Código
- **Backend**: Express.js, async/await, manejo de errores consistente
- **Frontend**: Next.js 14+, Server Components, Tailwind CSS
- **Database**: PostgreSQL, parameterized queries obligatorias
- **Commits**: `[Type] description` (feat, fix, docs, refactor)

### Seguridad
- JWT para autenticación (24h expiration)
- Rate limiting: 100 req/min público, 500 autenticado
- SQL Injection: Queries parametrizadas SIEMPRE
- Secrets: En `.env`, nunca en código

### Testing
- Tests unitarios obligatorios para lógica de negocio
- Tests de integración para APIs
- Coverage mínimo: 80%

---

## 📊 Métricas Clave del Sistema

- **Extracción**: 5,000+ empresas/día
- **Validación**: Score promedio > 70
- **Duplicados**: 95%+ accuracy
- **Tareas**: Resolución < 48h (Medium)
- **API**: Response < 200ms (p99)
- **Uptime**: 99.9%

---

## 🆘 ¿Necesitas Ayuda?

1. **Ver documentación específica del agente** en `agents/[nombre]/`
2. **Ver skills relevantes** en `skills/skills-library.md`
3. **Consultar workflows** en `.agent/workflows/`
4. **Ver ejemplos** en `04-prompts-workflows-examples.md`

---

## 📝 Checklist Antes de Trabajar

- [ ] Leí este archivo (AGENTS.md)
- [ ] Identifiqué qué agente(s) necesito
- [ ] Revisé la documentación del agente específico
- [ ] Entendí el workflow/flujo de trabajo
- [ ] Tengo acceso a las variables de entorno necesarias

---

**Versión**: 1.0.0  
**Última actualización**: Febrero 2025  
**Mantenedor**: The Architect

---

> 💡 **TIP**: Si eres un agente nuevo en este proyecto, comienza leyendo `01-arquitectura-general.md` y luego ve al archivo de tu agente específico en `agents/`.
