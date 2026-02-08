# FLUJOS DE DATOS - GUIAPYMES v2

## 🎯 Visión General

GuíaPymes opera con **3 fuentes de ingesta de datos** que convergen en **entidades** (empresa única):

1. **Scraping de Google Maps** → `data_google_maps` (datos crudos)
2. **Ingesta Manual** → `entidades` directamente (validado)
3. **Formulario Público** → `solicitudes` → `entidades` (con validación)

---

## 📊 FLUJO 1: Extracción de Google Maps

```
┌─────────────────────────────────────────────────────────────┐
│ FLUJO 1: WEB SCRAPING GOOGLE MAPS (Puppeteer)              │
└─────────────────────────────────────────────────────────────┘

INICIO: Browser Agent ejecuta búsqueda
  ↓
1️⃣ SEARCH PARAMS
  └─ Categoría: ej "Comercios"
  └─ Código Postal: ej "1425" (CABA)
  └─ Máximo: 100 resultados por búsqueda

  ↓
2️⃣ PUPPETEER SCRAPING
  └─ Abre Google Maps
  └─ Ingresa búsqueda: "[Categoría] en [Código Postal]"
  └─ Espera carga de resultados
  └─ Scroll para cargar más

  ↓
3️⃣ EXTRACCIÓN DE DATOS (por cada resultado)
  ├─ Nombre
  ├─ Dirección completa
  ├─ Teléfono(s)
  ├─ Website
  ├─ Google Maps ID + Place ID
  ├─ Rating + cantidad reviews
  ├─ Fotos
  ├─ Horarios de atención
  └─ Coordenadas (lat, lon)

  ↓
4️⃣ ALMACENAMIENTO EN data_google_maps
  └─ Tabla: data_google_maps
  └─ Etiqueta: 'nuevo'
  └─ search_category: categoría búsqueda
  └─ search_postal_code: código postal búsqueda
  └─ Estado: SIN PROCESAR aún

  ↓
5️⃣ ANÁLISIS DE DUPLICADOS (Logic Agent)
  ├─ Búsqueda en data_google_maps existente
  ├─ Búsqueda en entidades existentes
  ├─ Métodos:
  │  ├─ Exact match: nombre exacto + dirección
  │  ├─ Fuzzy match: nombre similar (Levenshtein > 85%)
  │  ├─ Geolocation: coordenadas < 50m + mismo nombre
  │  └─ Google Maps: google_maps_id duplicado
  ├─ Score: 0-100
  └─ Si > 90% → "Likely duplicate"
  └─ Si > 75% → "Possible duplicate" → Revisión manual

  ↓
6️⃣ CLASIFICACIÓN
  ├─ Duplicado comprobado → etiqueta: 'duplicado'
  ├─ Sucursal detectada → etiqueta: 'sucursal'
  ├─ Nuevo registro → etiqueta: 'nuevo'
  └─ detected_duplicates: array de UUIDs

  ↓
7️⃣ VALIDACIÓN PRELIMINAR (Logic Agent)
  ├─ Scoring de confiabilidad (0-100)
  │  ├─ Datos completos (+30)
  │  ├─ AFIP validation (+30)
  │  ├─ Contactabilidad (+20)
  │  ├─ Sin duplicado (+15)
  │  └─ Antigüedad (+5)
  ├─ AFIP check (offline): ¿Está activa?
  ├─ Phone verify: ¿Teléfono válido?
  └─ Website reachability: ¿Sitio funciona?

  ↓
8️⃣ CREACIÓN DE CATEGORIZACIÓN
  └─ Relacionar con categorías jerárquicas
  └─ tabla: data_google_maps_categorias

  ↓
9️⃣ ESTADO FINAL
  └─ matched_entidad_id: NULL (aún no unificada)
  └─ etiqueta: 'nuevo', 'duplicado' o 'sucursal'
  └─ processed_at: NULL (espera procesamiento)
  └─ processed_by: NULL

  ↓
FIN: Data Google Maps lista para procesamiento manual o automático
```

---

## 📊 FLUJO 2: Procesamiento de Data Google Maps

```
┌─────────────────────────────────────────────────────────────┐
│ FLUJO 2: PROCESAMIENTO Y UNIFICACIÓN DE DATA_GOOGLE_MAPS   │
└─────────────────────────────────────────────────────────────┘

INICIO: Gestor Backend revisa data_google_maps sin procesar
  ↓
1️⃣ LISTADO DE REGISTROS DUPLICADOS
  ├─ Vista: posibles_duplicados
  ├─ Filtros:
  │  ├─ detected_duplicates IS NOT NULL
  │  ├─ array_length > 0
  │  └─ matched_entidad_id IS NULL
  └─ Ordenados por cantidad de duplicados DESC

  ↓
2️⃣ REVISIÓN MANUAL DE CANDIDATOS
  ├─ Mostrar registro principal
  ├─ Mostrar posibles duplicados en panel
  ├─ Acciones:
  │  ├─ UNIFICAR: Crear entidad única
  │  ├─ SUCURSAL: Agregar como sucursal a entidad existente
  │  ├─ RECHAZAR: No es duplicado
  │  └─ REVISAR DESPUÉS: Dejar pendiente

  ├─ Interfaz:
  │  ├─ Panel izquierdo: Registro principal
  │  ├─ Panel derecho: Posibles duplicados
  │  ├─ Botón: "Unificar" / "Es sucursal" / "No es duplicado"
  │  └─ Comentario (opcional): Razón de la decisión

  ↓
3️⃣ ACCIÓN: UNIFICAR
  └─ Crear entidad nueva:
     ├─ nombre_legal: usar variante más completa
     ├─ descripcion: compilar datos de todos
     ├─ cuit: si existe en alguno
     ├─ tipo_entidad: detectable por categoría
     └─ activa: true

  ├─ Crear direcciones (1+ por sucursal encontrada)
  │  ├─ dirección 1 (principal)
  │  ├─ dirección 2 (sucursal si > 50m)
  │  └─ etc.

  ├─ Crear teléfonos (deduplicar)
  │  └─ Si mismo número en múltiples registros: crear 1

  ├─ Crear emails (deduplicar)
  ├─ Crear sitios_web (deduplicar)
  ├─ Crear redes_sociales (deduplicar)

  ├─ Asignar categorías:
  │  └─ tabla: entidad_categorias
  │  └─ Usar jerarquía de categorias

  ├─ Actualizar data_google_maps:
  │  ├─ matched_entidad_id: [ID entidad nueva]
  │  ├─ etiqueta: 'validado'
  │  └─ processed_at: NOW()

  ├─ Etiqueta de estado:
  │  └─ tabla: entidad_etiquetas
  │  └─ etiqueta: 'validado'

  └─ Registrar en audit_log

  ↓
4️⃣ ACCIÓN: ES SUCURSAL
  └─ Si matched_entidad_id apunta a entidad existente:
     ├─ Crear dirección nueva:
     │  ├─ entidad_id: [ID entidad existente]
     │  ├─ dirección: datos de data_google_maps
     │  └─ tipo_direccion: 'sucursal'
     ├─ Agregar teléfonos nuevos (si no existen)
     ├─ Agregar categorías (si no existen)
     ├─ Actualizar data_google_maps:
     │  ├─ matched_entidad_id: [ID entidad existente]
     │  ├─ etiqueta: 'sucursal'
     │  └─ processed_at: NOW()
     └─ Registrar en audit_log

  ↓
5️⃣ ACCIÓN: NO ES DUPLICADO
  └─ Crear entidad NUEVA de todas formas:
     └─ (es un registro legítimo que parecía duplicado)

  ↓
FIN: data_google_maps procesada → entidades creadas/actualizadas
```

---

## 📊 FLUJO 3: Solicitud Pública (Formulario "Quiero sumar mi empresa")

```
┌─────────────────────────────────────────────────────────────┐
│ FLUJO 3: FORMULARIO PÚBLICO "QUIERO SUMAR MI EMPRESA"      │
└─────────────────────────────────────────────────────────────┘

INICIO: Usuario completa formulario en sitio público
  ↓
1️⃣ CAPTURA DE DATOS
  ├─ SOLICITANTE:
  │  ├─ Nombre
  │  ├─ Email (validado)
  │  ├─ Teléfono
  │  └─ Relación con empresa (dueño, empleado, etc)
  │
  └─ EMPRESA:
     ├─ Nombre
     ├─ Descripción breve
     ├─ Dirección
     ├─ Teléfono(s)
     ├─ Email(s)
     ├─ Sitio web
     ├─ Redes sociales
     └─ Categoría(s) (select jerárquico)

  ↓
2️⃣ VALIDACIÓN FRONTEND
  ├─ Email válido (regex)
  ├─ Teléfono formato Argentina
  ├─ Nombre > 3 caracteres
  ├─ Categoría seleccionada
  └─ Honeypot: campo invisible (spam detection)

  ↓
3️⃣ ALMACENAMIENTO EN solicitudes
  └─ Crear registro con:
     ├─ status: 'pendiente'
     ├─ created_at: NOW()
     ├─ ip_address: IP del solicitante
     ├─ user_agent: navegador
     ├─ validated_at: NULL
     ├─ validated_by: NULL
     └─ entidad_id: NULL (aún no vinculada)

  ↓
4️⃣ NOTIFICACIÓN INICIAL
  └─ Email al solicitante:
     ├─ Agradecimiento por solicitud
     ├─ ID de solicitud (para tracking)
     ├─ "Revisaremos tu solicitud en 48h"
     └─ Link: seguimiento de solicitud

  ↓
5️⃣ ANÁLISIS Y BÚSQUEDA DE COINCIDENCIAS
  ├─ ¿Existe entidad con mismo nombre?
  │  └─ Si > 85% fuzzy match → sugerir
  │
  ├─ ¿Existe en data_google_maps?
  │  └─ merged_with_data_google_maps: [ID data_google_maps]
  │
  └─ Crear "Solicitud de revisión" para gestor

  ↓
6️⃣ REVISIÓN POR GESTOR
  ├─ Gestor ve solicitud pendiente
  │  └─ Panel: "Solicitudes sin revisar"
  │
  ├─ Gestor valida:
  │  ├─ ¿Es empresa real?
  │  ├─ ¿Datos son coherentes?
  │  ├─ ¿No es SPAM?
  │  └─ ¿Parecida a entidad existente?
  │
  ├─ OPCIÓN A: Vincular a entidad existente
  │  ├─ entidad_id: [ID entidad]
  │  ├─ status: 'validado'
  │  ├─ Agregar datos nuevos de solicitud a entidad
  │  └─ Notificar: "Tu empresa ya estaba en nuestro sistema"
  │
  ├─ OPCIÓN B: Crear entidad nueva
  │  ├─ Crear registro en entidades con datos de solicitud
  │  ├─ entidad_id: [ID entidad nueva]
  │  ├─ status: 'validado'
  │  ├─ Crear direcciones, teléfonos, emails, etc
  │  └─ Notificar: "¡Tu empresa se agregó exitosamente!"
  │
  └─ OPCIÓN C: Rechazar
     ├─ status: 'rechazado'
     ├─ motivo_rechazo: razón
     └─ Notificar: "No pudimos validar tu solicitud porque..."

  ↓
7️⃣ PUBLICACIÓN
  ├─ Si status = 'validado':
  │  ├─ entidades.activa = true
  │  ├─ Aparece en buscador público
  │  ├─ Publica fecha de agregación
  │  └─ Gestor puede dar acceso a "Panel de empresa"
  │
  └─ Si status = 'rechazado':
     └─ NO aparece en buscador

  ↓
FIN: Empresa validada y publicada (o rechazada)
```

---

## 📊 FLUJO 4: Ingesta Manual (Admin/Gestor)

```
┌─────────────────────────────────────────────────────────────┐
│ FLUJO 4: INGESTA MANUAL POR ADMIN/GESTOR                   │
└─────────────────────────────────────────────────────────────┘

INICIO: Admin/Gestor en panel administrativo
  ↓
1️⃣ CREAR ENTIDAD NUEVA
  └─ Formulario: "Nueva Empresa"
     ├─ Nombre legal
     ├─ CUIT (opcional)
     ├─ Tipo entidad
     ├─ Descripción
     └─ Dirección principal (mínimo)

  ↓
2️⃣ CREAR REGISTRO EN entidades
  └─ created_by: [ID usuario logueado]
  └─ activa: false (por defecto, hasta completar datos)

  ↓
3️⃣ AGREGAR DATOS ASOCIADOS (en orden)
  ├─ Dirección(es):
  │  ├─ Principal (requerida)
  │  └─ Sucursales (opcional, +)
  │
  ├─ Teléfono(s):
  │  ├─ Número
  │  ├─ Tipo (fijo, móvil, whatsapp)
  │  └─ Tipo de uso (general, ventas, etc)
  │
  ├─ Email(s):
  │  ├─ Email
  │  └─ Tipo de uso
  │
  ├─ Sitio(s) web:
  │  ├─ URL
  │  └─ Tipo (principal, ecommerce, etc)
  │
  ├─ Red(es) social(es):
  │  ├─ Plataforma
  │  └─ Usuario/URL
  │
  ├─ Categoría(s):
  │  ├─ Seleccionar de jerarquía
  │  ├─ Puede ser múltiple
  │  └─ Una como primaria
  │
  └─ Contacto(s) [OPCIONAL]:
     ├─ Nombre, puesto, departamento
     ├─ Emails del contacto
     ├─ Teléfonos del contacto
     └─ Etc.

  ↓
4️⃣ VALIDACIÓN
  ├─ AFIP check: ¿CUIT existe?
  ├─ Phone verify: ¿Teléfono funciona?
  ├─ Website check: ¿URL es accesible?
  └─ Scoring automático

  ↓
5️⃣ PUBLICACIÓN
  ├─ Admin marca entidades.activa = true
  ├─ Etiqueta: 'validado'
  ├─ Aparece en buscador público
  └─ Registro en audit_log

  ↓
FIN: Empresa disponible en buscador público
```

---

## 📊 FLUJO 5: Búsqueda Pública

```
┌─────────────────────────────────────────────────────────────┐
│ FLUJO 5: BÚSQUEDA PÚBLICA EN BUSCADOR                       │
└─────────────────────────────────────────────────────────────┘

USUARIO: Accede a guiapymes.com.ar
  ↓
1️⃣ INTERFAZ DE BÚSQUEDA
  ├─ Campo de búsqueda: texto libre
  ├─ Filtro 1: Categoría (select jerárquico)
  ├─ Filtro 2: Código postal o localidad
  ├─ Filtro 3: Rating mínimo (opcional)
  └─ Botón: Buscar

  ↓
2️⃣ QUERY A BD
  └─ SELECT * FROM entidades
     WHERE activa = true
     AND (nombre_legal ILIKE '%búsqueda%' OR descripcion ILIKE '%búsqueda%')
     AND (categoría IN categoria_ids IF seleccionada)
     AND (postal_code IN code IF seleccionada)
     AND (validation_score >= rating_min IF seleccionado)
     ORDER BY validation_score DESC, total_visitas DESC

  ↓
3️⃣ RESULTADOS
  ├─ Por cada entidad encontrada:
  │  ├─ Logo (si existe)
  │  ├─ Nombre
  │  ├─ Rating + cantidad reviews
  │  ├─ Dirección principal + otras sucursales (count)
  │  ├─ Categoría primaria
  │  ├─ "Contactar" / "Ver más detalles"
  │  └─ Botón para contacto
  │
  └─ Paginación: 10-20 por página

  ↓
4️⃣ VER DETALLE DE EMPRESA
  ├─ Nombre, descripción larga
  ├─ Logo, banner
  ├─ Todas las direcciones (mapa con pins)
  ├─ Todos los teléfonos
  ├─ Todos los emails
  ├─ Sitios web
  ├─ Redes sociales (iconos clicables)
  ├─ Categorías (enlaces)
  ├─ Reviews/Rating
  ├─ Información de contacto principal
  │
  └─ Formulario de contacto:
     ├─ Usuario registrado (si)
     └─ O solicita datos de contacto + email

  ↓
5️⃣ CONTACTO
  ├─ Usuario completa datos (si no registrado)
  │  ├─ Nombre
  │  ├─ Email
  │  ├─ Teléfono
  │  └─ Mensaje
  │
  ├─ Sistema registra en tabla `contactos_empresa`:
  │  ├─ entidad_id
  │  ├─ usuario_id (o anónimo)
  │  ├─ datos del contactante
  │  └─ created_at
  │
  ├─ Incrementa contador: entidades.total_contactos++
  │
  └─ Email a empresa:
     ├─ Datos del interesado
     ├─ Mensaje
     └─ Link para responder (si quiere)

  ↓
FIN: Usuario contactó empresa, empresa recibió notificación
```

---

## 🔄 ESTADÍSTICAS Y MÉTRICAS

### Por Entidad:
- `total_visitas`: Contador de búsquedas/visitas que mostraron esta empresa
- `total_contactos`: Contador de contactos recibidos mediante plataforma
- `validation_score`: 0-1.00 (0-100%)
- `activa`: Boolean

### Por Solicitud:
- `status`: pendiente → contactado → validado → publicada
- `time_to_validation`: Días desde creación hasta validación
- `motivo_rechazo`: Si aplica

### Por Data Google Maps:
- `etiqueta`: nuevo, procesado, duplicado, sucursal, validado
- `detected_duplicates`: Cantidad de posibles coincidencias
- `conversion_rate`: % que se convirtieron en entidades

---

## 🎯 CASOS DE USO EXTREMO

### Caso 1: Franquicia Nacional
```
Franquicia: "Pizza Hut Argentina"
├─ Entidad única en BD
├─ 25 sucursales en diferentes provincias
├─ Cada sucursal tiene:
│  ├─ Dirección única
│  ├─ Teléfono único
│  └─ Horario único
├─ Empresa tiene:
│  ├─ Email central (contacto)
│  ├─ Website nacional
│  └─ Redes sociales corporativas
└─ Aparecer en búsqueda múltiples veces (por localidad)
```

### Caso 2: Profesional Independiente
```
Persona: "Juan Pérez - Contador"
├─ Entidad: Contador "Juan Pérez"
├─ Dirección: Oficina en centro
├─ Contacto: el mismo Juan
└─ Categoría: Profesionales → Contadores
```

### Caso 3: Pyme con Múltiples Servicios
```
Empresa: "Reparaciones Martín"
├─ Servicios: Electricidad, Plomería, Gas
├─ Categorías:
│  ├─ Servicios → Reparaciones → Electricidad
│  ├─ Servicios → Reparaciones → Plomería
│  └─ Servicios → Reparaciones → Gas
├─ Equipo de 3 personas:
│  ├─ Martín (dueño, electricista)
│  ├─ Carlos (plomero)
│  └─ Luis (gasista)
└─ Buscar empresa:
   ├─ Por nombre "Reparaciones Martín"
   ├─ Por categoría "Electricidad"
   ├─ Por categoría "Plomería"
   ├─ Por categoría "Gas"
   └─ Aparece en todas las búsquedas
```

Este es el sistema completo de GuíaPymes v2. ✨

