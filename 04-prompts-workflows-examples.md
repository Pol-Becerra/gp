# PROMPTS MAESTROS Y WORKFLOWS

## PROMPT MAESTRO: The Architect (Orquestador Principal)

```
Eres THE ARCHITECT, el agente orquestador principal de GuíaPymes.

CONTEXTO:
- Sistema: Automatización de extracción, validación e ingesta de PyMEs argentinas
- Stack: Next.js + Express.js + PostgreSQL + Docker
- Modelos IA: Claude (Antigravity) + GPT-4 + Ollama
- Ambiente: VPS Contabo con Dokploy

RESPONSABILIDADES:
1. Diseñar arquitectura técnica
2. Desglosar features en tareas específicas
3. Coordinar trabajo de The Builders
4. Validar entregas contra especificación
5. Documentar decisiones arquitectónicas

VALORES:
- Excelencia técnica sin perfeccionismo paralizante
- Automatización máxima de todo proceso
- Modularidad y reutilización
- Pragmatismo: entrega > perfección
- Documentación clara y justificada

CUANDO RECIBAS UN REQUEST:
1. Analiza completamente el requerimiento
2. Diseña solución que respete arquitectura existente
3. Desglosa en tareas claras con criterios de aceptación
4. Asigna a agentes especializados (Builders, DB, QA, etc)
5. Define interdependencias y orden de ejecución
6. Estima tiempo y complejidad
7. Documenta en ADR (Architecture Decision Record)
8. Coordina ejecución paralela donde sea posible

LÍMITES:
- Máximo 350 líneas por especificación
- No ejecutes código, solo diseña
- Requiere aprobación para cambios en patrones core
- Respeta estándares de código definidos

RELACIONES:
- The Builders: Te reportan entregables, tú asignas tareas
- DB Agent: Consultas sobre schema, solicitas migraciones
- QA Agent: Valida tus diseños técnicamente
- Logic Agent: Colaboran en algoritmos complejos
```

---

## PROMPT MAESTRO: The Builders (Implementación)

```
Eres THE BUILDERS, equipo de agentes implementadores.

CONTEXTO:
- Implementan especificaciones del Architect
- Stack: Next.js/React, Express.js, PostgreSQL, Docker
- Objetivo: Código limpio, testeable, documentado
- Deadline: Respetar estimaciones del Architect

TIPOS DE BUILDERS:
1. Backend Builder: Express.js, APIs, lógica
2. Frontend Builder: Next.js, React, componentes
3. Logic Builder: Algoritmos, reglas de negocio
4. Integration Builder: Conectores, ETL

CUANDO RECIBAS ESPECIFICACIÓN DEL ARCHITECT:
1. Lee y entiende completamente
2. Plantea preguntas si algo es ambiguo
3. Desglosá en pasos de implementación
4. Escribe código limpio y legible
5. Incluye tests (mínimo 80% coverage)
6. Documenta funciones públicas
7. Reporta estimación real vs planificada
8. Entrega código listo para producción

ESTÁNDARES:
- Máximo 100 líneas por función
- Máximo 300 líneas por archivo
- Sin warnings en linter
- Tests pasan 100%
- Code review antes de merge
- Documentación actualizada

CRITERIOS DE ACEPTACIÓN (SIEMPRE CUMPLIR):
- ✅ Compila/ejecuta sin errores
- ✅ Tests pasan
- ✅ Coverage > 80%
- ✅ Code review OK
- ✅ Docs completas
- ✅ Performance aceptable
- ✅ Sin vulnerabilidades

MANEJO DE BLOQUEADORES:
1. Reporta claramente al Architect
2. Sugiere alternativas
3. No bloquees a otros builders
4. Paraleliza lo que puedas
```

---

## PROMPT MAESTRO: DB Persistence Agent

```
Eres el DB PERSISTENCE AGENT, especialista en PostgreSQL.

CONTEXTO:
- Base de datos central: PostgreSQL 15+
- Caché: Redis para performance
- Datos críticos: Empresas, validaciones, tareas, usuarios
- Requisito: 99.9% uptime, integridad ACID

RESPONSABILIDADES:
1. Diseñar schemas eficientes
2. Crear migraciones reversibles
3. Optimizar queries
4. Asegurar integridad de datos
5. Performance tuning

CUANDO RECIBAS REQUEST:
1. Analiza requisitos de datos
2. Diseña schema normalizado
3. Crea índices estratégicos
4. Escribe migración con rollback
5. Testea en ambiente similar a prod
6. Proporciona queries de ejemplo
7. Documenta cambios

OBLIGATORIO:
- Todas las migraciones son versionadas
- Rollback siempre posible
- No DELETE sin backup
- Queries < 1000ms en producción
- Auditoría en tablas críticas
- Documentación del schema

LÍMITES:
- Max query time: 1000ms
- Max batch: 10,000 rows
- No transactions > 5 minutos
- No direct prod changes
```

---

## WORKFLOW 1: Extracción de Nuevas PyMEs

```
TRIGGER: Daily batch o manual request

PARTICIPANTES:
1. Browser Agent (extrae datos)
2. Integration Agent (valida fuentes)
3. Logic Agent (deduplicación)
4. DB Agent (almacena)
5. QA Agent (verifica integridad)

PASOS:

1️⃣ EXTRACCIÓN (Browser Agent)
   - Búsqueda en Google Maps por categoría + provincia
   - Extrae: nombre, dirección, teléfono, horarios, foto
   - Rate limiting: 2-3s entre requests
   - Output: JSON de empresas sin procesar

2️⃣ NORMALIZACIÓN (Integration Agent)
   - Limpia datos: trim, lowercase, estandariza formatos
   - Valida: email format, phone format, coordinates validas
   - Geocodificación: convierte addresses a coordinates si falta
   - Output: Datos normalizados

3️⃣ DEDUPLICACIÓN (Logic Agent - Paralela)
   - Compara contra DB existente
   - Métodos: exact name, fuzzy match, geolocation
   - Score: 0-100 (> 90% = probable duplicado)
   - Output: Lista de duplicados, nuevas empresas, ambiguas

4️⃣ VALIDACIÓN (Logic Agent - Paralela)
   - Scoring de confiabilidad (0-100)
   - AFIP check (offline)
   - Phone verification (intento de llamada)
   - Output: Score + flags de problemas

5️⃣ INGESTA A BD (DB Agent)
   - Insert empresas nuevas en tabla companies
   - Insert validation_logs
   - Manejo de errores: rollback si duplicate key

6️⃣ CREACIÓN DE TAREAS (Logic Agent)
   - Si score < 50: Crear ticket "pending_validation"
   - Si duplicado ambiguo: Crear ticket "duplicate_review"
   - Asignación inteligente a managers
   - Output: Tickets creados

7️⃣ NOTIFICACIÓN (Integration Agent)
   - Email a managers con empresas asignadas
   - Dashboard actualizado en tiempo real
   - Alert si errores críticos

8️⃣ VALIDACIÓN QA (QA Agent)
   - Verifica integridad de datos en BD
   - Valida que todas las empresas tienen validation_log
   - Comprueba scores están en rango 0-100
   - Report de cualquier anomalía

MÉTRICAS A REPORTE:
- Total extraído: X
- Duplicados encontrados: Y
- Score promedio: Z
- Errors: N
- Duration: M segundos

TIEMPO ESTIMADO: 30-45 minutos para 5,000 empresas
```

---

## WORKFLOW 2: Validación y Revisión Manual

```
TRIGGER: Empresa con score < 50 o manager click en task

PARTICIPANTES:
1. Account Manager (revisa datos)
2. UI/UX Agent (proporciona interfaz)
3. DB Agent (guarda cambios)
4. QA Agent (verifica cambios)

PASOS:

1️⃣ CARGA DE DATOS (Backend)
   - Query: SELECT * FROM companies WHERE id = ?
   - También: validation_logs, tasks relacionados

2️⃣ VISUALIZACIÓN (Frontend - UI/UX)
   - Form con datos originales (left side)
   - Datos extraídos (right side) para comparación
   - Botones: Aceptar, Rechazar, Editar

3️⃣ EDICIÓN (Manager + Frontend)
   - Manager puede editar: nombre, dirección, teléfono, horarios
   - Preview de cambios en real-time
   - Validación en frontend antes de enviar

4️⃣ GUARDADO (Backend + DB Agent)
   - Validation: datos están en formato correcto
   - INSERT en audit_log
   - UPDATE companies SET status = 'active'
   - Trigger: crear task de follow-up si teléfono cambió

5️⃣ NOTIFICACIÓN (Integration Agent)
   - Email al manager confirmando
   - Dashboard actualiza en tiempo real

6️⃣ VALIDACIÓN (QA Agent)
   - Verifica que cambios se guardaron
   - Valida integridad de datos
   - Alert si falla

TIEMPO ESTIMADO: 2-5 minutos por empresa
```

---

## WORKFLOW 3: Asignación Inteligente de Managers

```
TRIGGER: Empresa validada pero sin manager asignado

PARTICIPANTES:
1. Logic Agent (algoritmo de asignación)
2. DB Agent (guarda asignación)
3. Integration Agent (notifica)

PASOS:

1️⃣ RECOPILACIÓN DE DATOS (Logic Agent)
   - Company: categoría, provincia, validation_score
   - Available managers: carga, especialización, provincia

2️⃣ CÁLCULO DE SCORES (Logic Agent)
   - Especialización: match de categoría (+30 pts)
   - Geografía: misma provincia (+20 pts)
   - Load balance: menor carga (+25 pts)
   - Histórico: si es reincidente (+10 pts)
   - Total: suma ponderada

3️⃣ SELECCIÓN (Logic Agent)
   - Manager con highest score gana
   - Tie breaker: menor carga actual
   - Validation: manager tiene capacidad (< max_load)

4️⃣ ASIGNACIÓN (DB Agent)
   - UPDATE companies SET manager_id = ? WHERE id = ?
   - INSERT en audit_log

5️⃣ NOTIFICACIÓN (Integration Agent)
   - Email al manager: "Nueva empresa asignada"
   - Incluye: nombre, categoría, location, validatio_score
   - Link directo a empresa en app

6️⃣ VERIFICACIÓN (QA Agent)
   - Valida que empresa tiene manager asignado
   - Valida no está assignada a 2 managers

TIEMPO ESTIMADO: < 1 segundo por empresa
```

---

## WORKFLOW 4: Gestión de Tareas (Tickets)

```
TRIGGER: Empresa entra en validación o falla, manager action

PARTICIPANTES:
1. Logic Agent (priorización)
2. DB Agent (CRUD)
3. Integration Agent (notificaciones)
4. UI/UX (interfaz)

PASOS:

1️⃣ CREACIÓN AUTOMÁTICA (Logic Agent - varios triggers)
   - Validation falló: "Review validation"
   - Duplicado ambiguo: "Resolve duplicate"
   - Phone invalid: "Verify phone"
   - Score bajo: "Improve data quality"

2️⃣ PRIORIZACIÓN (Logic Agent)
   - Fórmula: (Urgencia * 3) + (Impacto * 2) + (Complejidad * 1)
   - Resultado: CRITICAL (> 25), HIGH, MEDIUM, LOW

3️⃣ ASIGNACIÓN (Logic Agent)
   - Manager responsable de la empresa
   - Fallback: Round-robin si no hay asignado

4️⃣ NOTIFICACIÓN (Integration Agent)
   - Email: "Nuevo ticket asignado"
   - Slack (opcional): notification

5️⃣ DASHBOARD (UI/UX + Backend)
   - Kanban board: OPEN → IN_PROGRESS → RESOLVED → CLOSED
   - Manager puede:
     * Comentar (audit trail)
     * Cambiar estado
     * Reasignar
     * Marcar como resuelto

6️⃣ RESOLUCIÓN (Manager + DB Agent)
   - Manager hace cambios necesarios
   - Marca ticket como "resolved"
   - Opcionalmente comenta razón

7️⃣ CIERRE (Manager)
   - Verifica que ticket esté resuelto
   - Cierra ticket: "closed"

8️⃣ AUDITORÍA (QA Agent)
   - Verifica ticket tiene activity trail
   - Valida transiciones de estado correctas

ESTADOS:
OPEN → (manager asigna) → IN_PROGRESS
     → (manager resuelve) → RESOLVED
     → (manager confirma) → CLOSED
     → (problema recurrió) → REOPENED

SLA POR PRIORIDAD:
- CRITICAL: 4 horas
- HIGH: 24 horas
- MEDIUM: 48 horas
- LOW: 5 días
```

---

## EJEMPLO DE EJECUCIÓN: Full Day Batch

```
09:00 AM - INICIO BATCH DIARIO
├─ The Architect: verifica todos los agentes healthy
├─ Arquitectura: sin cambios pendientes
└─ Start signal: BATCH_START enviado

09:05 AM - EXTRACCIÓN PARALELA (30 min)
├─ Browser Agent: extrae 5,000 empresas de Google Maps
│  ├─ Comercios (1,500)
│  ├─ Servicios (2,000)
│  ├─ Profesionales (1,000)
│  └─ Franquicias (500)
├─ Progress: logs en tiempo real
└─ Output: raw_data.json (5,000 empresas sin procesar)

09:35 AM - NORMALIZACIÓN + DEDUPLICACIÓN (paralela, 15 min)
├─ Integration Agent: Normaliza 5,000 registros
│  ├─ Limpia formatting
│  ├─ Valida emails y phones
│  └─ Geocodifica direcciones faltantes
├─ Logic Agent: Detecta duplicados (paralela)
│  ├─ 200 duplicados exactos encontrados
│  ├─ 150 duplicados fuzzy encontrados
│  ├─ 30 duplicados ambigos para revisión
│  └─ 4,620 empresas nuevas confirmadas
└─ Output: cleaned_data.json, duplicates.json, ambiguous.json

09:50 AM - VALIDACIÓN (15 min, paralela)
├─ Logic Agent: Scoring de todas las empresas
│  ├─ High score (76-100): 3,100 empresas
│  ├─ Medium score (50-75): 1,200 empresas
│  ├─ Low score (< 50): 320 empresas
│  └─ AFIP checks: 4,400 validadas exitosamente
├─ Phone verification (100 intentos paralelos):
│  ├─ Válidos: 3,800
│  ├─ Inválidos: 400
│  └─ Timeout: 420
└─ Output: validation_results.json

10:05 AM - INGESTA A BD + CREACIÓN TAREAS (10 min, paralela)
├─ DB Agent: Inserta en companies
│  ├─ 4,620 empresas nuevas insertadas
│  └─ Duplicates merged: 200
├─ DB Agent: Inserta validation_logs
│  └─ 4,820 registros
├─ Logic Agent: Crea tickets
│  ├─ 320 tickets "pending_validation" (score < 50)
│  ├─ 30 tickets "duplicate_review"
│  ├─ 420 tickets "verify_phone"
│  └─ Total: 770 tickets
├─ Logic Agent: Asigna managers
│  └─ Distribution automática basada en especialización + load
└─ Output: companies.json, validation_logs.json, tasks.json

10:15 AM - NOTIFICACIÓN (5 min)
├─ Integration Agent: Envía emails a 50 managers
│  └─ "Tienes 15 nuevas empresas asignadas"
├─ Slack: Notificación a team
│  └─ "Batch completado: 4,820 empresas ingresadas"
└─ Dashboard: Actualiza en tiempo real

10:20 AM - VALIDACIÓN QA (5 min)
├─ QA Agent: Verifica integridad
│  ├─ Todas las empresas en DB: ✅
│  ├─ Validation logs completos: ✅
│  ├─ Tasks creados correctamente: ✅
│  ├─ Managers asignados: ✅
│  └─ No errors: ✅
├─ Smoke tests:
│  ├─ API /companies/count retorna 4,820: ✅
│  ├─ Dashboard carga sin errores: ✅
│  └─ Search functionality funciona: ✅
└─ Report: 
   📊 BATCH EXITOSO
   • Empresas ingresadas: 4,820
   • Duplicados manejados: 200
   • Tickets creados: 770
   • Managers notificados: 50
   • Duration: 75 minutos
   • Errors: 0

10:25 AM - FIN
└─ The Architect: Confirma batch completado, ready para siguiente ciclo
```

---

## COMANDO QUICK REFERENCE

```bash
# Iniciar batch manual
curl -X POST https://api.guiapymes.com/admin/batch \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "full_extraction",
    "categories": ["comercios", "servicios"],
    "provinces": ["Buenos Aires", "CABA"]
  }'

# Ver estado del batch
curl https://api.guiapymes.com/admin/batch/status

# Forzar validación de empresa
curl -X POST https://api.guiapymes.com/admin/validate \
  -d '{"company_id": "uuid"}'

# Ver logs en tiempo real
docker logs -f guiapymes-backend

# Ver métricas
curl https://api.guiapymes.com/metrics/prometheus

# Rollback de migración
npm run migrate:down --target 20240201_initial_schema
```
