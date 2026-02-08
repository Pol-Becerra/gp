# PARALLELIZACIÓN Y FLUJOS DE TRABAJO

## Tareas que pueden ejecutarse en paralelo

### 1. Batch de Extracción de Google Maps
```
Extracción_Paralela:
├─ Categoría 1 (Comercios) ─────────────┐
├─ Categoría 2 (Servicios) ────────────┼─> Deduplicación
├─ Categoría 3 (Profesionales) ────────┤   Centralizada
├─ Categoría 4 (Franquicias) ──────────┘
└─ Actualización de Watchlist ─────────── (paralela)

Grado de Paralelismo: 4 workers simultáneos
Límite: 50k requests/day a Google Maps (rate limit)
Batch Size: 100 empresas por request
Delay: 2-3 segundos entre requests para no saturar
```

### 2. Validación de Empresas
```
Validación_Paralela:
├─ Google Maps Scoring ──────────┐
├─ AFIP Validation ──────────────┼─> Consolidación
├─ Phone Verification ──────────┤   de Scores
├─ Duplicate Detection ─────────┘
└─ Website Reachability ─────────── (paralela)

Grado de Paralelismo: 8 workers
Timeout por validación: 5 segundos
Fallo de uno no bloquea otros
```

### 3. Gestión de Tareas y Asignaciones
```
Task_Management_Paralelo:
├─ Creación de Tickets ─────────┐
├─ Asignación Inteligente ──────┼─> Notificación
├─ Scoring de Prioridad ────────┤   a Managers
├─ Escalación si es necesario ──┘
└─ Email Notifications ─────────── (paralela)

Grado de Paralelismo: 6 workers
No hay bloqueos interdependientes
```

### 4. Sincronización y Actualizaciones
```
Sync_Paralela:
├─ Actualizar Status AFIP ──────┐
├─ Actualizar Reviews Google ───┼─> Merge
├─ Verificar Cambios de Datos ──┤   de Cambios
└─ Limpiar Cache Expirado ──────┘

Grado de Paralelismo: 4 workers
Frecuencia: Cada 4 horas
Transacciones atómicas en DB
```

## Errores Críticos vs Recuperables

### ERRORES CRÍTICOS (Bloquean proceso)
```
1. Database Connection Error
   - Impacto: No se puede guardar nada
   - Acción: Retry exponencial (5, 10, 30, 60 segundos)
   - Max retries: 5
   - Fallback: Enqueue en mensaje queue (Redis)
   - Alert: Critical (página en rojo)
   - SLA: 1 hora para resolver

2. Authentication/Authorization Failure
   - Impacto: Usuario no puede acceder
   - Acción: Logout, mostrar error, redirect a login
   - Max retries: 1 (no retry automático)
   - Alert: High
   - SLA: 30 minutos

3. Data Integrity Violation
   - Impacto: Violación de constraint única
   - Acción: Rollback, investigar raíz causa
   - Max retries: 0 (manual review)
   - Alert: Critical
   - SLA: 2 horas

4. API Rate Limit Exceeded (Google Maps)
   - Impacto: No se puede extraer datos
   - Acción: Exponential backoff, queue para después
   - Max retries: 3 (con espera)
   - Alert: Medium (después 2 horas)
   - SLA: No afecta si es temporary
   - Recovery: Reintenta en 24h con nueva cuota

5. Memory/CPU Exhausted
   - Impacto: Servicio crash
   - Acción: Auto-restart
   - Max retries: 3
   - Alert: Critical
   - SLA: 5 minutos
   - Investigación: PostMortem requerido
```

### ERRORES RECUPERABLES (No bloquean)
```
1. Single Validation Failed
   - Impacto: Company no tiene score validado
   - Acción: Mark como "pending_validation", crear ticket
   - Max retries: Automático después 1 hora
   - Alert: None (creó ticket)
   - Fallback: Score por defecto conservador (30/100)

2. Phone Verification Timeout
   - Impacto: No se verifica contacto
   - Acción: Skip validación, continuar
   - Max retries: 1 después 30 minutos
   - Alert: Low
   - Fallback: Mark como "unverified" en scoring

3. Email Sending Failed
   - Impacto: Manager no notificado
   - Acción: Queue en email service, retry
   - Max retries: 5 (con espera exponencial)
   - Alert: Low
   - Fallback: Admin ve en dashboard "email pending"

4. Google Maps API Temporary Error (5xx)
   - Impacto: Extracción interrumpida
   - Acción: Exponential backoff, queue
   - Max retries: 3
   - Alert: None (luego 2 horas si persiste)
   - Fallback: Continuar con otros trabajos

5. AFIP Service Temporary Unavailable
   - Impacto: No validación AFIP
   - Acción: Use cache último conocido
   - Max retries: 3 (distribuidos en tiempo)
   - Alert: None
   - Fallback: Score penalizado pero no rechazado

6. Duplicate Detection Ambiguous
   - Impacto: No sabe si es duplicado
   - Acción: Create task para revisión manual
   - Max retries: No aplica
   - Alert: None
   - Fallback: Ingresa como "pending_review"

7. Network Timeout
   - Impacto: Solicitud no completada
   - Acción: Retry con timeout aumentado
   - Max retries: 3 (con 5s, 10s, 15s)
   - Alert: Low (después 2 timeouts)
   - Fallback: Queue para reintento
```

## Matriz de Manejo de Errores

```
┌─────────────────────────────────────────────────────────────────┐
│ ERROR HANDLING MATRIX                                           │
├──────────────────┬──────────┬──────────┬───────────┬────────────┤
│ Tipo Error       │ Severity │ Max Try  │ Backoff   │ Alert      │
├──────────────────┼──────────┼──────────┼───────────┼────────────┤
│ DB Connection    │ CRITICAL │ 5        │ Expo      │ Immediate  │
│ Auth Fail        │ HIGH     │ 1        │ None      │ Immediate  │
│ Data Integrity   │ CRITICAL │ 0        │ N/A       │ Immediate  │
│ API Rate Limit   │ MEDIUM   │ 3        │ Expo + 1h │ After 2h   │
│ Memory OOM       │ CRITICAL │ 3        │ Linear    │ Immediate  │
├──────────────────┼──────────┼──────────┼───────────┼────────────┤
│ Validation Fail  │ MEDIUM   │ Auto     │ 1h        │ None       │
│ Phone Verify     │ LOW      │ 1        │ 30m       │ None       │
│ Email Send       │ LOW      │ 5        │ Expo      │ Low        │
│ Google 5xx       │ MEDIUM   │ 3        │ Expo      │ After 2h   │
│ AFIP Timeout     │ LOW      │ 3        │ Spread    │ None       │
│ Dup Ambiguous    │ MEDIUM   │ 0        │ N/A       │ None       │
│ Network Timeout  │ LOW      │ 3        │ Linear    │ After 2    │
└──────────────────┴──────────┴──────────┴───────────┴────────────┘
```

## Recuperación de Errores - Ejemplo de Implementación

### Exponential Backoff
```javascript
// Espera: 1s, 2s, 4s, 8s, 16s...
const delay = baseDelay * Math.pow(2, attemptNumber);
const jitter = Math.random() * baseDelay; // evitar thundering herd
await sleep(delay + jitter);
```

### Circuit Breaker Pattern
```
CLOSED → (fallidas > 5 en 1m) → OPEN
OPEN → (espera 60s) → HALF_OPEN
HALF_OPEN → (test exitoso) → CLOSED
         → (test falla) → OPEN

Si service está OPEN: rechaza requests inmediatamente
```

### Dead Letter Queue
```
Si retry falló 5 veces:
1. Move a DLQ (Dead Letter Queue)
2. Alert a admin
3. Admin revisa manualmente
4. Admin puede:
   - Retry manual
   - Mark como ignored
   - Investigate
5. Después 7 días, archive
```

## Logging de Errores

```javascript
// Cada error debe loguear:
{
  timestamp: ISO8601,
  error_id: UUID,           // para tracking
  error_type: "db_connection",
  severity: "critical",     // critical, high, medium, low
  attempt: 2,               // número de intento
  max_attempts: 5,
  message: "Connection refused to PostgreSQL",
  context: {
    user_id: UUID,
    company_id: UUID,
    operation: "validate_company",
    service: "validation_worker"
  },
  stack_trace: "...",
  next_action: "retry_in_10_seconds",
  recovery_possible: true
}
```

## Alerting Rules

```yaml
alerts:
  - name: "Critical Error Rate High"
    condition: "error_rate > 5% in 5min"
    severity: "critical"
    action: "page_oncall"
    
  - name: "API Rate Limit"
    condition: "google_maps_429_errors > 10"
    severity: "high"
    action: "email_team"
    
  - name: "DB Connection Pool Exhausted"
    condition: "db_pool_connections > 95"
    severity: "critical"
    action: "auto_scale + page"
    
  - name: "AFIP Service Down 2 Hours"
    condition: "afip_failures_consecutive > 120"
    severity: "medium"
    action: "email_ops"
```

## Monitoreo de Health

```
Cada minuto:
- ✅ DB connectivity
- ✅ Google Maps API status
- ✅ AFIP service status
- ✅ Redis queue healthy
- ✅ Memory usage < 80%
- ✅ CPU usage < 70%
- ✅ Error rate < 1%

Si algo falla: Alert según severidad
Dashboard: Mostra todos los health checks en real-time
```
