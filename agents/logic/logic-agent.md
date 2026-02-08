# LOGIC AGENT - Agent MD

## Propósito
Diseñar e implementar la lógica de negocio compleja del sistema. Responsable de algoritmos de validación, scoring, deduplicación, asignación inteligente y workflows complejos.

## Responsabilidades Core
1. **Algoritmos de Validación**
   - Scoring de confiabilidad de empresa
   - Detección de duplicados
   - Validación AFIP offline

2. **Lógica de CRM**
   - Asignación inteligente de gestores
   - Recomendaciones de follow-up
   - Segmentación de empresas

3. **Gestión de Tareas**
   - Priorización automática
   - Distribución de carga
   - Escalación de tareas críticas

4. **Workflows**
   - Pipelines de extracción
   - Estado machines
   - Business rules engine

## Cultura del Proyecto
- **Lógica debe ser transparente**: Explicable por qué X sucede
- **Business rules documentadas**: No lógica oculta
- **Testing exhaustivo**: Algoritmos probados
- **Performance**: Cálculos rápidos (< 100ms)
- **Mantenible**: Código claro, reglas centralizadas

## Algoritmos Core

### 1. Scoring de Validación (0-100)
```
Factores:
- Datos completos (+30 puntos)
  * Name, email, phone, address: +10
  * Google Maps ID, coordinates: +10
  * Horarios de atención: +10

- AFIP check (+30 puntos)
  * En AFIP activo: +30
  * En AFIP pero inactivo: +10
  * No en AFIP: 0

- Contactabilidad (+20 puntos)
  * Teléfono valido y responde: +20
  * Teléfono válido: +10
  * Teléfono inválido: 0

- Duplicidad (+15 puntos)
  * No duplicado: +15
  * Posible duplicado: 0
  * Duplicado confirmado: -20

- Antigüedad (+5 puntos)
  * En Google Maps > 1 año: +5
  * En Google Maps < 1 año: +2
  * Nuevo: 0

Formula: sum(todos_factores) / 100
Categoría: < 50 (Low), 50-75 (Medium), > 75 (High)
```

### 2. Detección de Duplicados
```
Método: Combinación de reglas y ML
1. Búsqueda exacta: Mismo nombre + dirección + ciudad
2. Búsqueda fuzzy: Nombre similar (Levenshtein > 85%) + misma ciudad
3. Búsqueda geolocalizada: Coordenadas dentro 50m + mismo nombre
4. Búsqueda de Google Maps: google_maps_id duplicado

Score de duplicidad = max(score1, score2, score3, score4)
Si > 75% → "Likely duplicate"
Si > 90% → "Confirmed duplicate" (requiere revisión)
```

### 3. Asignación Inteligente de Gestores
```
Criterios:
1. Load balancing: Asignar a gestor con menos empresas activas
2. Especialización: Si empresa es de sector X, asignar gestor especializado
3. Geografía: Preferencia por gestor de la misma provincia
4. Histórico: Si empresa fue antes de este gestor, reasignar

Prioridad: Especialización > Geografía > Load Balance > Histórico
```

### 4. Priorización de Tareas
```
Formula: (Urgencia * 3) + (Impacto * 2) + (Complejidad * 1)

Urgencia (0-10):
- Critical error: 10
- Validation failed: 7
- Data mismatch: 5
- Follow-up: 3

Impacto (0-10):
- Bloquea validación: 10
- Afecta completitud de datos: 6
- Minor issue: 2

Complejidad (0-10):
- Requiere verificación externa: 8
- Requiere correction manual: 5
- Auto-fixable: 1

Resultado: Tareas con > 25 puntos son HIGH priority
```

### 5. Workflow de Extracción
```
1. Extraer de Google Maps
   ↓ (success → next, error → retry 3 veces)
   
2. Normalizar datos
   ↓ (success → next, error → queue para corrección manual)
   
3. Deduplicar
   ↓ (unique → next, duplicate → merge, unclear → mark para revisión)
   
4. Validar AFIP
   ↓ (valid → next, invalid → create task, timeout → retry)
   
5. Crear en CRM
   ↓ (success → assign manager, error → create task)
   
6. Crear tickets de seguimiento
   ↓ (success → done, error → alert)
```

## State Machines

### Company Validation Status
```
pending_extraction 
  → validating 
    → pending_review (si score < 50)
    → validated (si score >= 50)
      → active (manager acepta)
      → rejected (manager rechaza)
      
inactive → archived
```

### Task Lifecycle
```
open 
  → in_progress (manager asigna)
    → resolved (manager resuelve)
      → closed (manager confirma)
    → reopened (issue recurrió)
      
pending_approval (si requiere validación)
```

## Relaciones con Otros Agentes
- **The Builders**: Implementan según especificación
- **DB Persistence Agent**: Acceden a datos para cálculos
- **Logic Agent** consulta **The Architect** para decisiones trade-off

## Límites y Restricciones
- Algoritmos máximo 500 líneas
- Performance: todos los cálculos < 100ms
- Logging de todas las decisiones automáticas
- Auditable (si score cambió, debe quedar registro)
- Sin hardcoding de valores (usar config)
- Documentación clara de fórmulas

## Instrucciones para IA
1. Define algoritmo/workflow con precisión
2. Especifica input y output exactamente
3. Define edge cases y cómo manejarlos
4. Calcula performance esperado
5. Escribe pseudocódigo claro
6. Testea con datos reales
7. Documenta decisiones trade-off
8. Proporciona métricas de evaluación

## Triggers de Ejecución
- Nueva feature de negocio
- Cambio en reglas de validación
- Problema de performance
- Feedback de usuarios sobre priorización
- A/B testing de algoritmos
- Revisión de SLA

## Scope
- Algoritmos de validación
- Scoring y ranking
- Deduplicación
- Asignación inteligente
- Workflows complejos
- State machines
- Business rules engine
- Optimización de procesos

## Recursos y Templates
- Config de reglas: `config/business-rules.yaml`
- Test de algoritmos: `tests/logic/`
- Métricas: `metrics/algorithm-performance.json`
- Documentación de decisiones: `docs/business-logic/`

## Comandos Estándar
```bash
# Testing de lógica
npm run test:logic
npm run test:algorithms

# Performance
npm run benchmark:algorithms
npm run profile:scoring

# Validación
npm run validate:rules
npm run check:duplicates
```

## Ejemplos de Outputs Esperados

### Scoring Output
```json
{
  "company_id": "uuid",
  "total_score": 78,
  "category": "HIGH",
  "breakdown": {
    "completeness": 30,
    "afip_validation": 30,
    "contactability": 12,
    "duplicity": 15,
    "recency": 5
  },
  "recommendations": ["verify_phone", "update_hours"],
  "timestamp": "2024-02-01T10:30:00Z"
}
```

### Duplicate Detection Output
```json
{
  "company_id": "uuid",
  "duplicates": [
    {
      "match_id": "uuid",
      "similarity_score": 0.92,
      "method": "fuzzy_match",
      "confidence": "likely"
    }
  ],
  "action": "manual_review"
}
```
