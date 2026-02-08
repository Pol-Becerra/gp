# MCPs, SEGURIDAD Y RESTRICCIONES

## Model Context Protocol (MCP) - Configuración Antigravity

### MCPs Recomendados para Usar

#### 1. MCP: GitHub Integration
```
Propósito: Acceso a repositorios, commits, PRs
Configuración:
  - Repository: https://github.com/yourusername/guiapymes
  - Auth: Personal Access Token (read-only)
  - Scope: Code read, Actions trigger

Capabilities:
  - Ver estructura de proyectos
  - Leer archivos
  - Crear issues/PRs (si autorizados)
  - Ver CI/CD status
  
Restrictions:
  - No delete directo
  - No force push
  - All changes via PR
```

#### 2. MCP: PostgreSQL Database
```
Propósito: Consultas y migraciones DB
Configuración:
  Host: postgres.guiapymes.internal
  Port: 5432
  Database: guiapymes_db
  User: ai_agent (read/write limit)
  
Capabilities:
  - SELECT queries
  - INSERT/UPDATE (con validación)
  - Crear migraciones
  - Backup queries

Restrictions:
  - No DELETE sin approval
  - Máximo 1000 rows por query
  - Timeout 30 segundos
  - No access a user passwords
  - No transactions mayores 5 minutos
```

#### 3. MCP: Docker/Dokploy Management
```
Propósito: Deployment y orchestración de contenedores
Configuración:
  API: https://dokploy.guiapymes.com
  Auth: API Key
  
Capabilities:
  - Ver estado de servicios
  - Logs de contenedores
  - Triggear deployments
  - Ver métricas
  
Restrictions:
  - Staging only (no production sin approval)
  - All deployments logged
  - Require approval para prod
  - Rollback automático si health check falla
```

#### 4. MCP: Redis Queue Management
```
Propósito: Gestión de job queues y caché
Configuración:
  Host: redis.guiapymes.internal
  Port: 6379
  DB: 0 (tasks), 1 (cache), 2 (sessions)
  
Capabilities:
  - Ver jobs en queue
  - Ejecutar scripts Lua
  - Clear cache sections
  - Monitor memory
  
Restrictions:
  - No delete de production cache sin reason
  - Max key size 1MB
  - Monitoreo de queue size (alertar si > 100k)
```

#### 5. MCP: External APIs (Webhooks)
```
Propósito: Enviar y recibir webhooks
Configuración:
  - Google Maps API
  - AFIP XML Web Service
  - Email service (SendGrid)
  - Slack notifications
  
Capabilities:
  - Trigger API calls
  - Receive webhooks
  - Test endpoints
  
Restrictions:
  - Rate limits respetados
  - No exponential backoff infinito
  - Timeout máximo 30 segundos
  - Logging obligatorio
```

#### 6. MCP: File Storage (S3/Object Storage)
```
Propósito: Guardar y recuperar archivos
Configuración:
  Bucket: guiapymes-data
  Region: sa-east-1 (Argentina)
  
Capabilities:
  - Upload archivos
  - Descargar archivos
  - List files
  - Delete (con logging)
  
Restrictions:
  - Max file size 500MB
  - Allowed types: csv, json, xlsx, pdf, images
  - Encrypted en tránsito
  - Versionado de archivos críticos
```

#### 7. MCP: Logging & Monitoring (CloudWatch/ELK)
```
Propósito: Acceso a logs y métricas del sistema
Configuración:
  ELK Stack: elasticsearch.guiapymes.com
  
Capabilities:
  - Query logs
  - Ver métricas
  - Crear alertas
  - Ver dashboards
  
Restrictions:
  - No modification de logs históricos
  - Retention: 30 días
  - Sensitive data redacted
```

---

## Seguridad y Restricciones

### 1. Autenticación y Autorización

#### Roles de Acceso
```
SUPER_ADMIN
├─ Acceso total al sistema
├─ Crear/editar usuarios
├─ Configurar integraciones
├─ Ver auditoría completa
└─ Cambiar policies

ADMIN
├─ Gestionar datos
├─ Ver reportes
├─ Gestionar gestores
├─ Ver auditoría de datos propios
└─ NO: crear super_admin, cambiar config crítica

ACCOUNT_MANAGER
├─ Ver empresas asignadas
├─ Editar datos de empresa
├─ Crear tickets
├─ Ver sus propios tickets
├─ Comentar en tickets
└─ NO: ver otras empresas, ver usuarios, ver config
```

#### Token-based Auth (JWT)
```javascript
Headers: {
  Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Payload:
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "account_manager",
  "permissions": ["read:companies", "write:tickets"],
  "iat": 1640000000,
  "exp": 1640086400  // expires in 24h
}

Refresh Token: Válido por 7 días
```

#### Session Timeout
```
- Si inactivo: 24 horas (auto logout)
- Si login desde otro device: Session anterior invalida
- Force logout: Si role cambió o permissions revoked
```

### 2. Data Security

#### Encryption
```
En Tránsito (Transit):
- HTTPS/TLS 1.3 obligatorio
- Certificados válidos

En Reposo (At Rest):
- Contraseñas: bcrypt (rounds: 12)
- API Keys: Encriptadas con AES-256-GCM
- Datos sensibles (email, phone): Enmascarados en logs
- Backups: Encriptados
```

#### Secrets Management
```
Almacenar en:
- Variables de entorno (.env - development)
- Vault (HashiCorp Vault - production)
- Dokploy Secrets (environment)

NUNCA:
- En código
- En comentarios
- En logs
- En git history

Gestión:
- Rotación de API keys cada 90 días
- Revocación inmediata si leak
- Audit log de accesos a secrets
```

#### PII (Personally Identifiable Information)
```
Data PII en sistema:
- Email (managers y super_admins)
- Phone (empresas)
- Nombres

Reglas:
- No log full phone numbers: +54 9 *** **** (last 4 visible)
- No log full email: u***@example.com (last 5 visible)
- Encriptación de campos PII en DB
- Acceso limitado: Solo quien "needs to know"
- Auditoría: Cada acceso a PII loguea user_id, timestamp, reason
```

### 3. API Security

#### Rate Limiting
```
Public Endpoints:
- 100 requests / minute per IP
- 1000 requests / hour per IP

Authenticated Endpoints:
- Account_manager: 500 requests / minute
- Admin: 2000 requests / minute
- Super_admin: Unlimited

Webhook Endpoints:
- 50 requests / minute per source
- 1000 requests / day per source

Implementation: Redis-based counter
```

#### SQL Injection Prevention
```
ALWAYS: Use parameterized queries
✅ Good:
  db.query(
    'SELECT * FROM companies WHERE id = $1',
    [company_id]
  )

❌ Bad:
  db.query(`SELECT * FROM companies WHERE id = ${company_id}`)

ORM (Sequelize/TypeORM): Usa prepared statements automáticamente
```

#### CORS y CSRF
```
CORS:
- Allowed origins: https://guiapymes.com.ar, https://admin.guiapymes.com.ar
- Allowed methods: GET, POST, PUT, DELETE
- Allowed headers: Content-Type, Authorization
- Credentials: true

CSRF:
- Tokens en forms
- Same-site cookies: Strict
- Validate token en POST/PUT/DELETE
```

### 4. Input Validation

#### Frontend Validation
```javascript
// Antes de enviar al backend
- Email: RFC 5322 regex
- Phone: +54 [0-9]{9,10}
- Name: Máximo 255 caracteres, no scripts
- Address: Máximo 500 caracteres, no SQL
- Date: Formato ISO 8601
```

#### Backend Validation
```javascript
// SIEMPRE validar en backend, no confiar en frontend
- Type checking: TypeScript o Joi schema validation
- Length limits: Máximo especificado
- Format validation: Email, phone, URL
- XSS prevention: HTML escape, DOMPurify
- Schema validation: Joi, Zod, o similar

Librería recomendada: Joi
```

### 5. Auditoría y Logging

#### Audit Log - Tablas críticas
```
Registra:
- Tabla afectada
- Operación (INSERT, UPDATE, DELETE)
- Usuario que hizo cambio
- Timestamp exacto
- Valores anteriores y nuevos (JSONB)
- IP address del usuario
- Reason (si disponible)

Retención: 1 año mínimo (compliance)

Acceso: Solo admins y super_admins

Ejemplo:
{
  "id": "uuid",
  "user_id": "uuid",
  "table_name": "companies",
  "operation": "UPDATE",
  "old_values": { "status": "pending", "validation_score": 45 },
  "new_values": { "status": "active", "validation_score": 78 },
  "timestamp": "2024-02-01T10:30:00Z",
  "ip_address": "192.168.1.1"
}
```

#### Application Logs
```
Nivel de logging:

ERROR: Algo falló, requiere atención
  - DB connections lost
  - API failures
  - Validation failures

WARN: Algo sospechoso, pero recuperable
  - API rate limit casi alcanzado
  - Slow query (> 1 segundo)
  - Retry attempt

INFO: Operaciones normales
  - API request success
  - Task created
  - User logged in

DEBUG: Detalles técnicos (solo en desarrollo)
  - Function entry/exit
  - Variable values
  - SQL queries

Retención:
- ERROR/WARN: 90 días
- INFO: 30 días
- DEBUG: 7 días (dev only)

Sensitive data filtering:
- Passwords: [REDACTED]
- Phone: +54 9 *** **** 1234
- Email: u***@example.com
- API Keys: key_***
```

### 6. Restricciones de Negocio

#### Context Limits
```
Arquitecto (The Architect):
- Especificaciones: Máximo 350 líneas
- Decisiones: Documentadas siempre
- Coordinación: Paralela cuando sea posible

Builders:
- Funciones: Máximo 100 líneas
- Archivos: Máximo 300 líneas (ideally < 200)
- Tests: Coverage mínimo 80%

DB Agent:
- Queries: Máximo timeout 1000ms
- Índices: Estratégicos, documentados
- Migraciones: Siempre reversibles

QA Agent:
- Tests: Completar en < 5 minutos
- Coverage: > 80%
- Critical paths: 100%

Logic Agent:
- Algoritmos: Máximo 500 líneas
- Performance: < 100ms para cálculos
- Outputs: Explainables
```

#### Rate Limiting de Operaciones
```
Operaciones masivas (bulk):
- Máximo 10,000 registros por operación
- Split automático en chunks de 1000

Extractción de Google Maps:
- Máximo 50,000 requests/día
- Rate limit: 2-3s entre requests
- Máximo 4 workers paralelos

Validación:
- 100 companies/segundo máximo
- 8 workers paralelos

Búsquedas:
- Máximo 10,000 resultados
- Timeout: 5 segundos
- Paginación: 100 resultados por página
```

#### Restricciones de Producción
```
Deployment:
- Requiere code review 2x admins
- Tests deben pasar 100%
- Staging validation 24h antes
- Rollback automático si health check falla

Data changes:
- No DELETE sin backup previo
- No direct SQL en production
- Todos vía migration scripts
- Change log obligatorio

Emergency access:
- Super_admin only
- Requiere 2FA
- Audit log detallado
- Automático disabling después 1 hora
```

---

## Límites de Recursos

### Computational Limits
```
API Server:
- RAM: 4GB límite por proceso
- CPU: 2 cores
- Concurrent connections: 1000
- Max request size: 10MB

Worker Processes:
- RAM: 2GB límite
- Timeout: 5 minutos por job
- Concurrent jobs: 8-16 por worker

Database:
- Max connections: 100
- Max query time: 30 segundos
- Max row update per transaction: 10,000
```

### Storage Limits
```
Database:
- Storage: 100GB (alert at 80%)
- Backup: Daily incremental, weekly full
- Retention: 30 días de backups

File Storage (S3):
- Quota: 1TB per month
- Max file: 500MB
- Retention: 1 año (archival después)

Logs:
- Rotation: Daily
- Compression: Automático después 7 días
- Retention: 90 días
```
