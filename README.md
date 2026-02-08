# GUIAPYMES - ANTIGRAVITY CONFIGURATION

## 📋 Resumen Ejecutivo

**GuíaPymes** es un sistema de automatización inteligente para extraer, validar e ingestar datos de pequeñas y medianas empresas (PyMEs) argentinas desde Google Maps al sistema de CRM interno, con gestión automática de tareas y asignación inteligente de managers.

**Stack Técnico**: Next.js + Express.js + PostgreSQL + Docker + Contabo VPS

**Arquitectura**: Monolítica Modular con 8 Agentes Antigravity especializados

**Automatización**: 95%+ de procesos sin intervención manual

---

## 🎯 Objetivos Principales

1. **Extracción Automática**: Obtener datos de 50,000+ PyMEs de Google Maps mensuales
2. **Validación Inteligente**: Scoring de confiabilidad (0-100) con múltiples criterios
3. **Deduplicación Precisa**: 95%+ accuracy en detección de duplicados
4. **CRM Centralizado**: Gestión completa de empresas validadas
5. **Gestión de Tareas**: Tickets automáticos y asignación inteligente de managers
6. **Escalabilidad**: Soporte para millones de empresas con performance consistente

---

## 🤖 AGENTES ANTIGRAVITY (8 Total)

### 1. **The Architect** - Orquestador

- **Responsabilidad**: Diseñar arquitectura, planificar sprints, coordinar builders
- **Archivo**: `agents/architect-agent.md`
- **Trigger**: Nuevas features, decisiones técnicas

### 2. **The Builders** (Grupo) - Implementación

- **Responsabilidad**: Escribir código limpio, testeable, documentado
- **Archivo**: `agents/builders-agents.md`
- **Especializaciones**:
  - Backend Builder (Express.js)
  - Frontend Builder (Next.js/React)
  - Logic Builder (Algoritmos)
  - Integration Builder (Conectores)

### 3. **DB Persistence Agent** - PostgreSQL

- **Responsabilidad**: Schemas, migraciones, optimización de queries
- **Archivo**: `agents/db-persistence-agent.md`
- **Skills**: SQL expertise, indexing, performance tuning

### 4. **QA Browser Agent** - Testing & Validación

- **Responsabilidad**: Tests automáticos, detección de bugs, validación de funcionalidad
- **Archivo**: `agents/qa-browser-agent.md`
- **Coverage**: Unitarios, integración, E2E, performance

### 5. **UI/UX Agent** - Interfaz y Experiencia

- **Responsabilidad**: Diseño, componentes, accesibilidad
- **Archivo**: `agents/ui-ux-agent.md`
- **Estándar**: WCAG 2.1 AA, responsive design

### 6. **Logic Agent** - Lógica de Negocio

- **Responsabilidad**: Algoritmos, scoring, deduplicación, workflows
- **Archivo**: `agents/logic-agent.md`
- **Especialidad**: Algoritmos complejos, reglas de negocio

### 7. **Integration Agent** - Conectores Externos

- **Responsabilidad**: APIs externas, webhooks, sincronización de datos
- **Archivo**: `agents/integration-browser-agents.md`
- **Integraciones**: Google Maps, AFIP, webhooks, email

### 8. **Browser Agent** - Web Automation

- **Responsabilidad**: Web scraping ético, automatización de navegador
- **Archivo**: `agents/integration-browser-agents.md`
- **Stack**: Puppeteer/Playwright

---

## 📚 SKILLS ESPECIALIZADOS

| Skill | Propósito | Autor | Trigger |
|-------|----------|-------|---------|
| **Google Maps Extractor** | Extrae datos de empresas | Integration + Browser | Daily batch |
| **Validation Scorer** | Calcula score 0-100 | Logic | Empresa ingresada |
| **Duplicate Detection** | Detecta duplicados (95%+) | Logic | Nueva empresa |
| **Manager Assignment** | Asigna inteligentemente | Logic | Empresa validada |
| **Task Prioritization** | Prioriza tickets | Logic | Ticket creado |
| **AFIP Validation** | Valida contra AFIP | Integration + Logic | Validación |
| **Email Notifier** | Notificaciones por email | Integration | Múltiples triggers |

---

## ⚙️ CONFIGURACIÓN RÁPIDA

### Requisitos

```bash
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker 24+
- Contabo VPS (Ubuntu 24)
```

### Instalación

```bash
# 1. Clonar repositorio
git clone https://github.com/Pol-Becerra/gp
cd gp

# 2. Instalar dependencias
npm install

# 3. Configurar environment
cp .env.example .env
# Editar .env con tus credenciales

# 4. Setup base de datos
npm run db:migrate

# 5. Iniciar desarrollo
npm run dev

# 6. Deploy con Dokploy
dokploy deploy --service guiapymes
```

### Variables de Entorno Críticas

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/guiapymes_db

# Google Maps
GOOGLE_MAPS_API_KEY=xxx
GOOGLE_MAPS_SEARCH_RADIUS=50000

# AFIP (carga local)
AFIP_DATA_PATH=./data/afip-companies.json

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=24h

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=xxx

# Redis
REDIS_URL=redis://localhost:6379

# Cloud
AWS_S3_BUCKET=guiapymes-data
AWS_REGION=sa-east-1
```

---

## 📊 ARQUITECTURA DE BASE DE DATOS

### Tablas Principales

- **companies**: Empresas validadas (índices: status, manager, google_maps_id)
- **professionals**: Profesionales asociados a empresas
- **validation_logs**: Historial de validaciones
- **tasks_tickets**: Tickets/tareas de managers
- **users**: Usuarios del sistema (super_admin, admin, account_manager)
- **audit_log**: Auditoría completa de cambios

### Índices Estratégicos

- `idx_companies_status`: Queries por estado
- `idx_companies_manager`: Distribución de carga
- `idx_tasks_status`: Dashboard de tareas
- `idx_companies_location`: Búsqueda geográfica

---

## 🔐 Seguridad

| Aspecto | Configuración |
|--------|----------------|
| **Autenticación** | JWT + 24h expiration + refresh token |
| **Autorización** | Role-based (super_admin, admin, account_manager) |
| **Encriptación** | HTTPS/TLS 1.3, AES-256-GCM en reposo |
| **Secrets** | HashiCorp Vault en prod, .env en dev |
| **Rate Limiting** | 100 req/min public, 500 req/min auth |
| **SQL Injection** | Parameterized queries obligatorias |
| **CORS** | Whitelist de dominios específicos |
| **Auditoría** | Toda operación crítica loguea user_id + timestamp |

---

## 📈 Flujos de Trabajo Principales

### Workflow 1: Extracción Diaria de PyMEs

```
09:00 → Inicio batch
09:05 → Extracción paralela de Google Maps (30 min)
09:35 → Normalización + deduplicación (15 min)
09:50 → Validación y scoring (15 min)
10:05 → Ingesta a BD + creación de tareas (10 min)
10:15 → Notificación a managers (5 min)
10:20 → Validación QA (5 min)
⏱️ Total: 75 minutos por 5,000 empresas
```

### Workflow 2: Validación Manual

```
Manager → Abre task en dashboard
        → Revisa datos originales vs extraídos
        → Edita si necesario
        → Confirma
        → Sistema guarda + notifica
```

### Workflow 3: Asignación Automática

```
Empresa validada → Logic Agent calcula scores
               → Especialización + geografía + carga
               → Asigna a manager óptimo
               → Notifica por email
```

---

## 🚨 Manejo de Errores

### Errores Críticos (Bloquean)

| Error | Acción | SLA |
|-------|--------|-----|
| DB Connection Lost | Retry exponencial | 1h |
| Auth Failure | Logout | 30m |
| Data Integrity Violation | Rollback + investigate | 2h |
| API Rate Limit (Google) | Queue + exponential backoff | N/A |

### Errores Recuperables (No bloquean)

| Error | Acción | Fallback |
|-------|--------|----------|
| Phone Verification Timeout | Retry 1x después 30m | Mark unverified |
| Email Send Failed | Queue + retry 5x | Admin ve pendiente |
| AFIP Service Down | Use cache | Score penalizado |
| Google 5xx Error | Queue + exponential backoff | Continúa otros |

---

## 📊 Métricas y Monitoreo

### Metrics Clave

```
- Companies ingresadas/día: Target 5,000+
- Validation score promedio: Target > 70
- Duplicate detection accuracy: Target 95%+
- Task resolution time: Target < 48h (Medium priority)
- API response time: Target < 200ms (p99)
- Uptime: Target 99.9%
```

### Dashboards

- **Admin**: Estadísticas generales, usuarios, permisos
- **Manager**: Empresas asignadas, tareas, follow-ups
- **System**: Health checks, error logs, performance

---

## 🔄 Parallelización

### Tareas que Corren en Paralelo

```
1. Extracción: 4 workers (Comercios, Servicios, Prof, Franquicias)
2. Validación: 8 workers (Google scoring, AFIP, Phone, Duplicates)
3. Tareas: 6 workers (Crear tickets, asignar, notificar)
4. Sincronización: 4 workers (AFIP updates, reviews, cache)
```

### Límites de Concurrencia

- Max API workers: 8
- Max DB connections: 100
- Max Redis connections: 50
- Max Google Maps requests/day: 50,000

---

## 🔄 MCPs Configurados

| MCP | Función | Auth |
|-----|---------|------|
| **GitHub** | Repo + CI/CD | PAT (read-only) |
| **PostgreSQL** | Database operations | user/pass limitado |
| **Docker/Dokploy** | Deployment | API Key |
| **Redis** | Queue management | Connection string |
<!-- | **Google Maps** | Data extraction | API Key |
| **S3** | File storage | AWS credentials | -->
| **Webhooks** | External integrations | HMAC signatures |

---

## 📝 Documentación Completa

```
├── 01-arquitectura-general.md        ← Stack, estructura, flujos
├── 02-parallelization-errors.md      ← Tareas paralelas, manejo de errores
├── 03-mcp-security-restrictions.md   ← MCPs, seguridad, límites
├── 04-prompts-workflows-examples.md  ← Prompts maestros, workflows, ejemplos
├── agents/
│   ├── architect-agent.md
│   ├── builders-agents.md
│   ├── db-persistence-agent.md
│   ├── qa-browser-agent.md
│   ├── ui-ux-agent.md
│   ├── logic-agent.md
│   └── integration-browser-agents.md
└── skills/
    └── skills-library.md             ← 7 skills especializados
```

---

## 🚀 Próximos Pasos

1. **Setup Infraestructura**
   - [ ] VPS Contabo configurado
   - [ ] Docker y Dokploy instalados
   - [ ] PostgreSQL, Redis, Elasticsearch setup

2. **Configurar Agentes**
   - [ ] Copiar prompts maestros a Antigravity
   - [ ] Setup MCPs en Antigravity
   - [ ] Validar acceso a recursos

3. **Primeros Tests**
   - [ ] Test de extracción (10 empresas)
   - [ ] Test de validación
   - [ ] Test de ingesta a BD
   - [ ] Test de asignación de managers

4. **Deployment Staging**
   - [ ] Deploy a staging VPS
   - [ ] Full day batch test
   - [ ] Load testing
   - [ ] Security audit

5. **Go-Live**
   - [ ] Setup monitoring y alertas
   - [ ] Capacitar managers
   - [ ] Activar batch diario

---

## 📞 Soporte y Escalación

| Problema | Contactar | SLA |
|----------|-----------|-----|
| Critical downtime | Architect + Ops | 15 min |
| High priority bug | QA + Builders | 2 horas |
| Feature request | Architect | 1 día |
| Performance issue | DB Agent + Builders | 4 horas |
| Security issue | Super admin | ASAP |

---

## 📄 Licencia

MIT License - Ver LICENSE.md

---

## 👥 Contribuciones

Las contribuciones sigue el workflow:

1. Crea branch: `feature/feature-name`
2. Commit messages: `[Type] description` (feat, fix, docs, etc)
3. Create pull request
4. Code review por 2x builders
5. Merge después de aprobación

---

**Última actualización**: Febrero 2024  
**Versión**: 1.0.0  
**Status**: Production-Ready  
**Mantenedor**: The Architect (Antigravity)

---

## 🎓 Para Entender Mejor Este Sistema

1. Lee primero: `01-arquitectura-general.md`
2. Luego: `agents/architect-agent.md` (comprende el Orquestador)
3. Explora: `04-prompts-workflows-examples.md` (ve cómo funcionan juntos)
4. Profundiza: Agent específico que te interese
5. Reference: `skills/skills-library.md` para detalles técnicos

**El sistema es completamente modular y escalable. Cada agente puede trabajar independientemente pero coordinan a través de The Architect.**
