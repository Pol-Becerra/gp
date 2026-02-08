# SKILLS LIBRARY - GuíaPymes

## Estructura General de Skills

Cada skill sigue este formato:

```markdown
# SKILL: [Nombre]

## Metadatos
- Autor: [Agente responsable]
- Versión: 1.0.0
- Licencia: MIT
- Última actualización: YYYY-MM-DD

## Propósito
Descripción breve

## Triggers
Cuándo ejecutar

## Scope (Ámbito de Aplicación)
Dónde y cuándo aplicar

## Input
Parámetros esperados

## Output
Resultado esperado

## Recursos y Templates
Referencias útiles
```

---

## SKILL 1: Google Maps Data Extractor

### Metadatos
- **Autor**: Integration Agent, Browser Agent
- **Versión**: 1.0.0
- **Licencia**: MIT
- **Última actualización**: 2024-02-01
- **Status**: Activo

### Propósito
Extraer datos de empresas de Google Maps de manera ética y eficiente. Automatiza búsqueda, extracción y normalización de datos.

### Triggers
- Inicio de batch de extracción
- Solicitud manual de extracción por categoría
- Actualización de watchlist de categorías
- Daily batch automático

### Scope
- Aplicable a: Comercios, Servicios, Profesionales, Franquicias
- Países: Argentina
- Volumen: Hasta 10,000 registros por batch
- Frecuencia: Diaria, semanal o manual

### Input
```json
{
  "search_params": {
    "categories": ["string"],
    "cities": ["string"],
    "provinces": ["string"],
    "coordinates": {
      "latitude": "float",
      "longitude": "float",
      "radius_km": "integer"
    }
  },
  "config": {
    "batch_size": 100,
    "delay_ms": 3000,
    "skip_duplicates": true
  }
}
```

### Output
```json
{
  "extracted_companies": [
    {
      "google_maps_id": "string",
      "name": "string",
      "address": "string",
      "phone": "string",
      "website": "string",
      "rating": "float",
      "review_count": "integer",
      "latitude": "float",
      "longitude": "float",
      "opening_hours": "object",
      "categories": ["string"],
      "photos": ["url"],
      "extracted_at": "timestamp"
    }
  ],
  "statistics": {
    "total_extracted": "integer",
    "duplicates_found": "integer",
    "errors": "integer",
    "duration_seconds": "integer"
  }
}
```

### Recursos
- Script base: `skills/google-maps-extractor/extractor.js`
- Selectores: `skills/google-maps-extractor/selectors.json`
- Proxy config: `skills/google-maps-extractor/proxies.yaml`

---

## SKILL 2: Company Validation Scorer

### Metadatos
- **Autor**: Logic Agent
- **Versión**: 2.1.0
- **Licencia**: MIT
- **Última actualización**: 2024-02-01
- **Status**: Activo

### Propósito
Calcular score de validación de empresa basado en múltiples criterios. Determina confiabilidad y si puede ser ingresada al sistema.

### Triggers
- Nueva empresa extraída
- Datos de empresa actualizados
- Validación manual solicitada
- Re-validación mensual

### Scope
- Aplicable a: Todas las empresas en pipeline
- Output: Score 0-100, categoría, recomendaciones
- Frecuencia: Inmediata en ingesta, mensual en revisión

### Input
```json
{
  "company": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "address": "string",
    "city": "string",
    "province": "string",
    "coordinates": {"lat": "float", "lng": "float"},
    "google_maps_rating": "float",
    "categories": ["string"],
    "created_at": "timestamp"
  },
  "external_checks": {
    "afip_status": "string", // active, inactive, not_found
    "phone_valid": "boolean",
    "website_reachable": "boolean"
  }
}
```

### Output
```json
{
  "company_id": "uuid",
  "score": 78,
  "category": "HIGH", // LOW < 50, MEDIUM 50-75, HIGH > 75
  "breakdown": {
    "completeness": 30,
    "afip_validation": 30,
    "contactability": 12,
    "duplicity": 15,
    "recency": 5
  },
  "flags": [
    {
      "type": "warning",
      "message": "Teléfono no validado",
      "severity": "medium"
    }
  ],
  "recommendations": [
    "verify_phone",
    "update_website",
    "confirm_hours"
  ],
  "timestamp": "timestamp"
}
```

### Recursos
- Lógica de scoring: `skills/validation-scorer/scorer.js`
- Pesos de criterios: `skills/validation-scorer/weights.yaml`
- Histórico de scores: `data/scoring-history.json`

---

## SKILL 3: Duplicate Detection

### Metadatos
- **Autor**: Logic Agent
- **Versión**: 1.5.0
- **Licencia**: MIT
- **Última actualización**: 2024-02-01
- **Status**: Activo

### Propósito
Detectar empresas duplicadas con alta precisión. Usa múltiples métodos para encontrar registros repetidos.

### Triggers
- Nueva empresa ingresada
- Bulk import de empresas
- Daily duplicate scan
- Manual search por duplicados

### Scope
- Búsqueda: Contra todas las empresas existentes
- Métodos: Exact match, fuzzy match, geolocation match
- Accuracy: > 95% para matches verdaderos

### Input
```json
{
  "company": {
    "name": "string",
    "address": "string",
    "city": "string",
    "phone": "string",
    "google_maps_id": "string",
    "coordinates": {"lat": "float", "lng": "float"}
  },
  "sensitivity": "strict" // strict, moderate, relaxed
}
```

### Output
```json
{
  "company_id": "uuid",
  "duplicates": [
    {
      "match_id": "uuid",
      "match_name": "string",
      "similarity_score": 0.92,
      "methods": ["fuzzy_name", "geo_proximity"],
      "confidence": "likely" // confirmed, likely, possible
    }
  ],
  "action": "manual_review", // auto_merge, manual_review, flag_only
  "timestamp": "timestamp"
}
```

### Recursos
- Algoritmo de matching: `skills/duplicate-detection/matching.js`
- Levenshtein implementation: `skills/duplicate-detection/levenshtein.js`
- Test data: `skills/duplicate-detection/test-cases.json`

---

## SKILL 4: Intelligent Manager Assignment

### Metadatos
- **Autor**: Logic Agent
- **Versión**: 1.0.0
- **Licencia**: MIT
- **Última actualización**: 2024-02-01
- **Status**: Activo

### Propósito
Asignar automáticamente empresas a gestores de cuentas basado en múltiples criterios inteligentes.

### Triggers
- Empresa validada y lista para asignar
- Cambio en disponibilidad de manager
- Manual reassignment request
- Quarterly load rebalancing

### Scope
- Usuarios: Gestores de cuentas nivel
- Criterios: Especialización, geografía, carga, histórico
- Algoritmo: Scoring ponderado

### Input
```json
{
  "company": {
    "id": "uuid",
    "category": "string",
    "province": "string",
    "city": "string",
    "validation_score": 75
  },
  "available_managers": [
    {
      "id": "uuid",
      "name": "string",
      "specialties": ["string"],
      "province": "string",
      "current_load": 45,
      "max_load": 100,
      "success_rate": 0.92
    }
  ]
}
```

### Output
```json
{
  "company_id": "uuid",
  "assigned_manager": {
    "id": "uuid",
    "name": "string",
    "assignment_score": 85
  },
  "scoring_breakdown": {
    "specialization_match": 30,
    "geographic_proximity": 20,
    "load_balance": 25,
    "historical_success": 10
  },
  "rationale": "string",
  "timestamp": "timestamp"
}
```

### Recursos
- Algoritmo de asignación: `skills/assignment/algorithm.js`
- Manager profiles: `data/managers.json`
- Assignment history: `data/assignment-history.json`

---

## SKILL 5: Task Prioritization Engine

### Metadatos
- **Autor**: Logic Agent
- **Versión**: 1.2.0
- **Licencia**: MIT
- **Última actualización**: 2024-02-01
- **Status**: Activo

### Propósito
Priorizar automáticamente tickets y tareas basado en urgencia, impacto y complejidad.

### Triggers
- Nueva tarea creada
- Cambio en estado de empresa
- Daily prioritization review
- Manual escalation

### Scope
- Tipos de tareas: Validation, follow-up, correction, escalation
- Rango de prioridad: CRITICAL, HIGH, MEDIUM, LOW
- Análisis: Real-time

### Input
```json
{
  "task": {
    "id": "uuid",
    "type": "validation", // validation, follow-up, correction, escalation
    "company_id": "uuid",
    "description": "string",
    "created_at": "timestamp"
  },
  "context": {
    "company_validation_score": 45,
    "manager_current_load": 12,
    "days_since_last_contact": 7,
    "previous_task_count": 3
  }
}
```

### Output
```json
{
  "task_id": "uuid",
  "priority": "HIGH", // CRITICAL, HIGH, MEDIUM, LOW
  "urgency_score": 8,
  "impact_score": 6,
  "complexity_score": 4,
  "total_score": 38,
  "reasoning": "string",
  "suggested_sla_hours": 24,
  "timestamp": "timestamp"
}
```

### Recursos
- Engine de prioritización: `skills/prioritization/engine.js`
- Pesos de criterios: `skills/prioritization/weights.yaml`
- SLA policies: `skills/prioritization/sla-policies.json`

---

## SKILL 6: AFIP Offline Validation

### Metadatos
- **Autor**: Integration Agent, Logic Agent
- **Versión**: 1.0.0
- **Licencia**: MIT
- **Última actualización**: 2024-02-01
- **Status**: Activo

### Propósito
Validar empresas contra AFIP (Administración Federal de Ingresos Públicos) de Argentina sin requiere conexión en tiempo real.

### Triggers
- Validación de empresa nueva
- Revalidación mensual
- Manual validation request

### Scope
- Base de datos: AFIP actualizada mensualmente
- Validación: CUIT, nombre, estado contribuyente
- Fallback: Cache de resultados previos

### Input
```json
{
  "company": {
    "name": "string",
    "cuit": "string", // formato: XX-XXXXXXXX-X o sin formato
    "city": "string"
  }
}
```

### Output
```json
{
  "company_id": "uuid",
  "cuit": "string",
  "afip_status": "active", // active, inactive, suspended, not_found
  "official_name": "string",
  "activity_description": "string",
  "is_taxpayer": "boolean",
  "confidence": 0.98,
  "checked_at": "timestamp",
  "data_source": "local_cache" // local_cache, last_online
}
```

### Recursos
- AFIP data loader: `skills/afip-validation/loader.js`
- Query engine: `skills/afip-validation/query.js`
- Data file: `data/afip-companies.json.gz`

---

## SKILL 7: Email Notifier

### Metadatos
- **Autor**: Integration Agent
- **Versión**: 1.0.0
- **Licencia**: MIT
- **Última actualización**: 2024-02-01
- **Status**: Activo

### Propósito
Enviar notificaciones por email a usuarios y managers. Maneja templates, scheduling y tracking.

### Triggers
- Task asignada
- Validación completada
- Alerta crítica
- Daily digest
- Manual notification

### Scope
- Recipients: Admins, managers, ocasionalmente empresas
- Tipos: Alerts, assignments, digests, reports
- Frecuencia: Instant o scheduled

### Input
```json
{
  "notification": {
    "type": "task_assigned", // task_assigned, validation_complete, alert, digest
    "recipient": {
      "id": "uuid",
      "email": "string",
      "name": "string"
    },
    "data": {
      "task_id": "uuid",
      "company_name": "string"
    }
  }
}
```

### Output
```json
{
  "notification_id": "uuid",
  "status": "sent", // pending, sent, failed, bounced
  "recipient": "string",
  "sent_at": "timestamp",
  "template": "string",
  "error": "null or string"
}
```

### Recursos
- Template de emails: `templates/emails/`
- SMTP config: `config/email.env`
- Email service: `services/email-service.js`

