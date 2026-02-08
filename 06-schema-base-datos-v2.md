# SCHEMA BASE DE DATOS - GUIAPYMES v2

## 🎯 Visión General del Schema

GuíaPymes es una **guía gratuita de empresas PyMEs verificadas**. El sistema maneja 3 flujos de ingesta de datos:

1. **Web Scraping**: Google Maps → `data_google_maps` (datos crudos)
2. **Ingesta Manual**: Admin/Gestor → `entidades` (directo validado)
3. **Formulario Público**: "Quiero sumar mi empresa" → `solicitudes` → `entidades` (con validación)

El núcleo es la tabla **`entidades`** que representa empresas únicas, con estructuras relacionales para sus múltiples sucursales, datos de contacto y categorías.

---

## 📊 DIAGRAMA DE RELACIONES

```
data_google_maps (cruda de Maps)
    ↓ (análisis de duplicados)
    ↓
solicitudes (formulario público "Quiero sumar...")
    ↓ (validación)
    ↓
entidades (NÚCLEO - empresa única)
    ├─ direcciones (1+ por entidad)
    ├─ telefonos (1+ por entidad)
    ├─ emails (1+ por entidad)
    ├─ sitios_web (1+ por entidad)
    ├─ redes_sociales (1+ por entidad)
    ├─ categorias (N:N con jerarquía)
    ├─ contactos (personas en la entidad)
    │   ├─ contacto_direcciones
    │   ├─ contacto_telefonos
    │   ├─ contacto_emails
    │   ├─ contacto_redes_sociales
    │   └─ contacto_sitios_web
    └─ etiquetas (N:N - estado, segmentación)

categorias (jerárquica con subcategorías)
```

---

## 📋 TABLAS DETALLADAS

### 1. TABLA: data_google_maps
**Propósito**: Almacenar datos crudos/sin procesar de Google Maps

```sql
CREATE TABLE data_google_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Datos básicos extraídos
    nombre VARCHAR(500) NOT NULL,
    address VARCHAR(1000),
    telefono VARCHAR(50),
    website VARCHAR(500),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Categorización
    categoria_primaria VARCHAR(200),
    categorias_adicionales TEXT[], -- array JSON
    
    -- Google Maps específico
    google_maps_id VARCHAR(200) UNIQUE,
    google_place_id VARCHAR(200),
    rating DECIMAL(3, 2),
    review_count INTEGER,
    photo_urls TEXT[],
    opening_hours JSONB,
    
    -- Búsqueda que generó este resultado
    search_category VARCHAR(200),
    search_postal_code VARCHAR(10),
    search_timestamp TIMESTAMP,
    
    -- Procesamiento
    etiqueta VARCHAR(50), -- 'nuevo', 'procesado', 'duplicado', 'sucursal', 'validado'
    detected_duplicates UUID[],
    matched_entidad_id UUID REFERENCES entidades(id),
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by VARCHAR(100)
);

CREATE INDEX idx_data_google_maps_status ON data_google_maps(etiqueta);
CREATE INDEX idx_data_google_maps_nombre ON data_google_maps(nombre);
CREATE INDEX idx_data_google_maps_location ON data_google_maps(latitude, longitude);
CREATE INDEX idx_data_google_maps_categoria ON data_google_maps(categoria_primaria);
CREATE INDEX idx_data_google_maps_postal ON data_google_maps(search_postal_code);
CREATE INDEX idx_data_google_maps_entidad ON data_google_maps(matched_entidad_id);
```

---

### 2. TABLA: solicitudes
**Propósito**: Formulario público "Quiero sumar mi empresa"

```sql
CREATE TABLE solicitudes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Datos del formulario
    nombre_empresa VARCHAR(500) NOT NULL,
    descripcion TEXT,
    
    -- Contacto del solicitante
    nombre_contacto VARCHAR(300),
    email_contacto VARCHAR(300) NOT NULL,
    telefono_contacto VARCHAR(50),
    
    -- Datos de la empresa
    direccion VARCHAR(1000),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    telefonos JSONB, -- array de teléfonos
    emails JSONB,
    sitios_web TEXT[],
    redes_sociales JSONB,
    
    -- Categorización
    categorias UUID[], -- array de UUIDs de categorías
    
    -- Estado de validación
    status VARCHAR(50), -- 'pendiente', 'contactado', 'validado', 'rechazado', 'duplicado'
    motivo_rechazo TEXT,
    
    -- Integración
    entidad_id UUID REFERENCES entidades(id),
    merged_with_data_google_maps UUID REFERENCES data_google_maps(id),
    
    -- Auditoría
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validated_at TIMESTAMP,
    validated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_solicitudes_status ON solicitudes(status);
CREATE INDEX idx_solicitudes_email ON solicitudes(email_contacto);
CREATE INDEX idx_solicitudes_entidad ON solicitudes(entidad_id);
CREATE INDEX idx_solicitudes_created ON solicitudes(created_at DESC);
```

---

### 3. TABLA: entidades (NÚCLEO)
**Propósito**: Representar una empresa única (puede tener múltiples sucursales, categorías, etc.)

```sql
CREATE TABLE entidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificación única
    nombre_legal VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE, -- para URLs
    descripcion TEXT,
    razon_social VARCHAR(500),
    cuit VARCHAR(13) UNIQUE,
    
    -- Clasificación
    tipo_entidad VARCHAR(50), -- 'comercio', 'servicio', 'franquicia', 'profesional'
    
    -- Presencia
    activa BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_verificacion TIMESTAMP,
    
    -- Validación
    validation_score DECIMAL(3, 2), -- 0-1.00 (0-100%)
    validacion_afip BOOLEAN,
    afip_estado VARCHAR(100),
    
    -- Información de portada
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    descripcion_larga TEXT,
    
    -- Auditoría
    created_by UUID REFERENCES usuarios(id),
    updated_by UUID REFERENCES usuarios(id),
    
    -- Estadísticas
    total_visitas INTEGER DEFAULT 0,
    total_contactos INTEGER DEFAULT 0
);

CREATE INDEX idx_entidades_activa ON entidades(activa);
CREATE INDEX idx_entidades_slug ON entidades(slug);
CREATE INDEX idx_entidades_tipo ON entidades(tipo_entidad);
CREATE INDEX idx_entidades_validation ON entidades(validation_score DESC);
CREATE INDEX idx_entidades_cuit ON entidades(cuit) WHERE cuit IS NOT NULL;
```

---

### 4. TABLA: direcciones
**Propósito**: Múltiples direcciones por entidad (sucursales, sedes)

```sql
CREATE TABLE direcciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidad_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
    
    -- Dirección
    calle VARCHAR(500) NOT NULL,
    numero VARCHAR(50),
    piso VARCHAR(50),
    departamento VARCHAR(50),
    codigo_postal VARCHAR(10),
    localidad VARCHAR(200),
    provincia VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'Argentina',
    
    -- Ubicación geográfica
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Clasificación
    tipo_direccion VARCHAR(50), -- 'principal', 'sucursal', 'oficina', 'almacén'
    nombre_direccion VARCHAR(300), -- ej: "Sucursal Centro", "Almacén La Plata"
    horario_atencion JSONB, -- { "lunes": "9:00-18:00", ... }
    
    -- Validación
    validada BOOLEAN DEFAULT false,
    es_actual BOOLEAN DEFAULT true,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_direcciones_entidad ON direcciones(entidad_id);
CREATE INDEX idx_direcciones_postal ON direcciones(codigo_postal);
CREATE INDEX idx_direcciones_location ON direcciones(latitude, longitude);
```

---

### 5. TABLA: telefonos
**Propósito**: Múltiples teléfonos por entidad

```sql
CREATE TABLE telefonos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidad_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
    
    -- Teléfono
    numero VARCHAR(50) NOT NULL,
    tipo_telefonico VARCHAR(50), -- 'fijo', 'móvil', 'whatsapp'
    codigo_pais VARCHAR(5) DEFAULT '+54',
    
    -- Clasificación
    tipo_uso VARCHAR(100), -- 'general', 'ventas', 'soporte', 'reclamos'
    horario_disponible JSONB,
    
    -- Estado
    validado BOOLEAN DEFAULT false,
    es_principal BOOLEAN DEFAULT false,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_telefonos_entidad ON telefonos(entidad_id);
CREATE INDEX idx_telefonos_numero ON telefonos(numero);
```

---

### 6. TABLA: emails
**Propósito**: Múltiples emails por entidad

```sql
CREATE TABLE emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidad_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
    
    -- Email
    email VARCHAR(300) NOT NULL,
    
    -- Clasificación
    tipo_uso VARCHAR(100), -- 'general', 'ventas', 'soporte', 'reclamos', 'admin'
    
    -- Estado
    validado BOOLEAN DEFAULT false,
    confirmado BOOLEAN DEFAULT false,
    es_principal BOOLEAN DEFAULT false,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_emails_entidad ON emails(entidad_id);
CREATE INDEX idx_emails_email ON emails(email);
```

---

### 7. TABLA: sitios_web
**Propósito**: Múltiples sitios web por entidad

```sql
CREATE TABLE sitios_web (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidad_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
    
    -- Web
    url VARCHAR(500) NOT NULL,
    
    -- Clasificación
    tipo_sitio VARCHAR(100), -- 'web_principal', 'ecommerce', 'blog', 'redes'
    
    -- Validación
    validado BOOLEAN DEFAULT false,
    es_principal BOOLEAN DEFAULT true,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sitios_web_entidad ON sitios_web(entidad_id);
CREATE INDEX idx_sitios_web_url ON sitios_web(url);
```

---

### 8. TABLA: redes_sociales
**Propósito**: Múltiples redes sociales por entidad

```sql
CREATE TABLE redes_sociales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidad_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
    
    -- Red social
    plataforma VARCHAR(100) NOT NULL, -- 'facebook', 'instagram', 'linkedin', 'tiktok', 'twitter'
    usuario_o_url VARCHAR(500) NOT NULL,
    
    -- Validación
    validada BOOLEAN DEFAULT false,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_redes_sociales_entidad ON redes_sociales(entidad_id);
CREATE INDEX idx_redes_sociales_plataforma ON redes_sociales(plataforma);
```

---

### 9. TABLA: contactos
**Propósito**: Personas/roles dentro de una entidad

```sql
CREATE TABLE contactos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidad_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
    
    -- Información personal
    nombre VARCHAR(300) NOT NULL,
    apellido VARCHAR(300),
    puesto_cargo VARCHAR(200),
    departamento VARCHAR(200),
    
    -- Descripción
    descripcion TEXT,
    foto_url VARCHAR(500),
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contactos_entidad ON contactos(entidad_id);
```

---

### 10. TABLAS RELACIONALES: contacto_*
**Propósito**: Datos de contacto asociados a personas

```sql
-- Teléfonos de contacto
CREATE TABLE contacto_telefonos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contacto_id UUID NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL,
    tipo VARCHAR(50) -- 'personal', 'laboral', 'whatsapp'
);

-- Emails de contacto
CREATE TABLE contacto_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contacto_id UUID NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
    email VARCHAR(300) NOT NULL
);

-- Direcciones de contacto
CREATE TABLE contacto_direcciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contacto_id UUID NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
    direccion VARCHAR(1000),
    tipo VARCHAR(50) -- 'personal', 'laboral'
);

-- Redes sociales de contacto
CREATE TABLE contacto_redes_sociales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contacto_id UUID NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
    plataforma VARCHAR(100),
    usuario_o_url VARCHAR(500)
);

-- Sitios web de contacto
CREATE TABLE contacto_sitios_web (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contacto_id UUID NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
    url VARCHAR(500)
);

CREATE INDEX idx_contacto_telefonos_contacto ON contacto_telefonos(contacto_id);
CREATE INDEX idx_contacto_emails_contacto ON contacto_emails(contacto_id);
CREATE INDEX idx_contacto_direcciones_contacto ON contacto_direcciones(contacto_id);
CREATE INDEX idx_contacto_redes_contacto ON contacto_redes_sociales(contacto_id);
CREATE INDEX idx_contacto_webs_contacto ON contacto_sitios_web(contacto_id);
```

---

### 11. TABLA: categorias (JERÁRQUICA)
**Propósito**: Categorías con subcategorías anidadas

```sql
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Categoría
    nombre VARCHAR(200) NOT NULL UNIQUE,
    slug VARCHAR(200) UNIQUE,
    descripcion TEXT,
    icono_url VARCHAR(500),
    color_hex VARCHAR(7),
    
    -- Jerarquía
    parent_id UUID REFERENCES categorias(id),
    nivel_profundidad INTEGER DEFAULT 0,
    orden INTEGER DEFAULT 0,
    
    -- Visibilidad
    activa BOOLEAN DEFAULT true,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categorias_parent ON categorias(parent_id);
CREATE INDEX idx_categorias_slug ON categorias(slug);
CREATE INDEX idx_categorias_activa ON categorias(activa);

-- Ejemplos de jerarquía:
-- Comercios
--   ├─ Almacenes
--   ├─ Ferreterías
--   └─ Tiendas de ropa
-- Servicios
--   ├─ Reparaciones
--   │  ├─ Electricidad
--   │  └─ Plomería
--   └─ Consultoría
```

---

### 12. TABLA: entidad_categorias (N:N)
**Propósito**: Relación entre entidades y categorías (1+ categorías por entidad)

```sql
CREATE TABLE entidad_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidad_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
    
    -- Información
    es_primaria BOOLEAN DEFAULT false, -- categoría principal
    es_verificada BOOLEAN DEFAULT false,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_entidad_categorias_entidad ON entidad_categorias(entidad_id);
CREATE INDEX idx_entidad_categorias_categoria ON entidad_categorias(categoria_id);
CREATE UNIQUE INDEX idx_entidad_categorias_unique ON entidad_categorias(entidad_id, categoria_id);
```

---

### 13. TABLA: data_google_maps_categorias (N:N)
**Propósito**: Relación entre datos de Google Maps y categorías

```sql
CREATE TABLE data_google_maps_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_google_maps_id UUID NOT NULL REFERENCES data_google_maps(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dgm_categorias_dgm ON data_google_maps_categorias(data_google_maps_id);
CREATE INDEX idx_dgm_categorias_categoria ON data_google_maps_categorias(categoria_id);
```

---

### 14. TABLA: etiquetas
**Propósito**: Etiquetas para segmentación, marketing, estados

```sql
CREATE TABLE etiquetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Definición
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    tipo VARCHAR(50), -- 'estado', 'segmentacion', 'marketing'
    color_hex VARCHAR(7),
    icono VARCHAR(100),
    
    -- Uso
    aplicable_a TEXT[], -- array: 'entidades', 'data_google_maps', 'contactos'
    
    -- Control
    activa BOOLEAN DEFAULT true,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ejemplos de etiquetas:
-- Estado: 'nuevo', 'validado', 'duplicado', 'pasado'
-- Segmentación: 'franquicia', 'pyme', 'grande', 'startup'
-- Marketing: 'destacado', 'premium', 'partner'
```

---

### 15. TABLA: relaciones N:N para Etiquetas

```sql
-- Entidades con etiquetas
CREATE TABLE entidad_etiquetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidad_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
    etiqueta_id UUID NOT NULL REFERENCES etiquetas(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Google Maps con etiquetas
CREATE TABLE data_google_maps_etiquetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_google_maps_id UUID NOT NULL REFERENCES data_google_maps(id) ON DELETE CASCADE,
    etiqueta_id UUID NOT NULL REFERENCES etiquetas(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contactos con etiquetas
CREATE TABLE contacto_etiquetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contacto_id UUID NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
    etiqueta_id UUID NOT NULL REFERENCES etiquetas(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_entidad_etiquetas_entidad ON entidad_etiquetas(entidad_id);
CREATE INDEX idx_entidad_etiquetas_etiqueta ON entidad_etiquetas(etiqueta_id);
CREATE INDEX idx_dgm_etiquetas_dgm ON data_google_maps_etiquetas(data_google_maps_id);
CREATE INDEX idx_dgm_etiquetas_etiqueta ON data_google_maps_etiquetas(etiqueta_id);
CREATE INDEX idx_contacto_etiquetas_contacto ON contacto_etiquetas(contacto_id);
CREATE INDEX idx_contacto_etiquetas_etiqueta ON contacto_etiquetas(etiqueta_id);
```

---

### 16. TABLA: usuarios
**Propósito**: Usuarios del sistema (admins, gestores)

```sql
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Credenciales
    email VARCHAR(300) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Información
    nombre_completo VARCHAR(300),
    telefono VARCHAR(50),
    
    -- Rol y permisos
    rol VARCHAR(50), -- 'super_admin', 'admin', 'gestor_cuentas', 'moderador'
    activo BOOLEAN DEFAULT true,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
```

---

### 17. TABLA: audit_log
**Propósito**: Auditoría de cambios

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Quién
    usuario_id UUID REFERENCES usuarios(id),
    
    -- Qué
    tabla_afectada VARCHAR(100),
    registro_id UUID,
    operacion VARCHAR(50), -- 'INSERT', 'UPDATE', 'DELETE', 'MERGE'
    
    -- Cambios
    valores_anteriores JSONB,
    valores_nuevos JSONB,
    cambios_detectados JSONB,
    
    -- Detalles
    descripcion TEXT,
    ip_address INET,
    
    -- Cuándo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_usuario ON audit_log(usuario_id);
CREATE INDEX idx_audit_log_tabla ON audit_log(tabla_afectada);
CREATE INDEX idx_audit_log_registro ON audit_log(registro_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(created_at DESC);
```

---

## 🔑 RELACIONES CLAVE

### Flujo de Datos:

```
1. EXTRACCIÓN (Google Maps):
   data_google_maps ← Puppeteer scraping
   
2. ANÁLISIS DE DUPLICADOS:
   data_google_maps.detected_duplicates
   data_google_maps.matched_entidad_id
   
3. UNIFICACIÓN:
   data_google_maps → entidades (merge)
   entidad_categorias ← categorias
   direcciones, telefonos, emails, etc.
   
4. REGISTRO PÚBLICO:
   solicitudes → entidades (validado)
   
5. DISPONIBILIDAD:
   entidades (activa=true) → Buscador público
```

### Cardinalidad:

```
entidad (1) ──── (N) direcciones
entidad (1) ──── (N) telefonos
entidad (1) ──── (N) emails
entidad (1) ──── (N) sitios_web
entidad (1) ──── (N) redes_sociales
entidad (1) ──── (N) contactos
entidad (N) ──── (N) categorias
entidad (1) ──── (N) etiquetas
entidad (N) ──── (N) solicitudes (origen)
entidad (N) ──── (N) data_google_maps (origen)

contacto (1) ──── (N) contacto_telefonos
contacto (1) ──── (N) contacto_emails
contacto (1) ──── (N) contacto_direcciones
contacto (1) ──── (N) contacto_redes_sociales
contacto (1) ──── (N) contacto_sitios_web
contacto (N) ──── (N) etiquetas

data_google_maps (N) ──── (N) categorias
data_google_maps (N) ──── (N) etiquetas

categorias (jerarquía) parent_id self-reference
```

---

## 🛡️ CONSTRAINTS Y VALIDACIONES

```sql
-- Integridad referencial
ALTER TABLE direcciones ADD CONSTRAINT check_provincia 
    CHECK (provincia IN (
        'Buenos Aires', 'CABA', 'Córdoba', 'Santa Fe', 
        'Mendoza', 'Tucumán', 'La Pampa', 'Misiones', 
        'Corrientes', 'Entre Ríos', 'Chaco', 'Formosa',
        'Jujuy', 'Salta', 'Catamarca', 'La Rioja',
        'San Juan', 'San Luis', 'Santiago del Estero',
        'Tierra del Fuego', 'Neuquén', 'Río Negro', 'Chubut', 'Santa Cruz'
    ));

-- Validación de coordenadas
ALTER TABLE data_google_maps ADD CONSTRAINT check_coordinates
    CHECK (latitude >= -90 AND latitude <= 90 AND longitude >= -180 AND longitude <= 180);
    
ALTER TABLE direcciones ADD CONSTRAINT check_coordinates
    CHECK (latitude >= -90 AND latitude <= 90 AND longitude >= -180 AND longitude <= 180);

-- Validación de emails
ALTER TABLE emails ADD CONSTRAINT check_email
    CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- Validación de CUIT (Argentina)
ALTER TABLE entidades ADD CONSTRAINT check_cuit
    CHECK (cuit IS NULL OR cuit ~ '^\d{11}$');

-- Validación de scores
ALTER TABLE entidades ADD CONSTRAINT check_validation_score
    CHECK (validation_score >= 0 AND validation_score <= 1);
```

---

## 📈 VISTAS ÚTILES

```sql
-- Vista: Entidades activas con datos completos
CREATE VIEW entidades_activas_completas AS
SELECT 
    e.*,
    COUNT(DISTINCT ec.categoria_id) as total_categorias,
    COUNT(DISTINCT d.id) as total_direcciones,
    COUNT(DISTINCT t.id) as total_telefonos,
    COUNT(DISTINCT c.id) as total_contactos
FROM entidades e
LEFT JOIN entidad_categorias ec ON e.id = ec.entidad_id
LEFT JOIN direcciones d ON e.id = d.entidad_id
LEFT JOIN telefonos t ON e.id = t.entidad_id
LEFT JOIN contactos c ON e.id = c.entidad_id
WHERE e.activa = true
GROUP BY e.id;

-- Vista: Data Google Maps sin procesar
CREATE VIEW data_google_maps_sin_procesar AS
SELECT *
FROM data_google_maps
WHERE etiqueta IN ('nuevo', 'procesado')
  AND matched_entidad_id IS NULL
ORDER BY created_at DESC;

-- Vista: Posibles duplicados detectados
CREATE VIEW posibles_duplicados AS
SELECT 
    id,
    nombre,
    categoria_primaria,
    detected_duplicates,
    array_length(detected_duplicates, 1) as cantidad_duplicados
FROM data_google_maps
WHERE detected_duplicates IS NOT NULL 
  AND array_length(detected_duplicates, 1) > 0
ORDER BY array_length(detected_duplicates, 1) DESC;
```

---

## 🎯 CASOS DE USO DEL SCHEMA

### Caso 1: Empresa con múltiples sucursales
```
Entidad: "Farmacia La Salud"
├─ Dirección 1: Av. Corrientes 1000, CABA (principal)
├─ Dirección 2: Mitre 500, La Plata (sucursal)
├─ Dirección 3: Rivadavia 200, Quilmes (sucursal)
├─ Teléfono 1: +54-11-4000-1111 (general)
├─ Teléfono 2: +54-11-3000-2222 (whatsapp)
├─ Email 1: contacto@farmaciasalud.com.ar
├─ Sitio Web: www.farmaciasalud.com.ar
├─ Redes: Instagram, Facebook, TikTok
├─ Contacto 1: Juan Pérez (Gerente)
│  └─ email: juan@farmaciasalud.com.ar
├─ Contacto 2: María García (Vendedora)
└─ Categorías: Comercio → Farmacias
```

### Caso 2: Deduplicación automática
```
Data Google Maps #1: "Farmacia La Salud - Centro"
Data Google Maps #2: "Farmacia La Salud"
Data Google Maps #3: "La Salud Farmacia"
  ↓ (análisis de duplicados)
  ↓ (75% similarity → "duplicado")
  ↓ (unificar)
Entidad única: "Farmacia La Salud" con 3 direcciones
```

### Caso 3: Solicitud pública
```
Formulario "Quiero sumar mi empresa":
  nombre: "Pizzería Don Luigi"
  email: pizzeria@donluigi.com
  categoría: "Comercio → Pizzería"
  ↓ (crea Solicitud con status=pendiente)
  ↓ (gestor valida)
  ↓ (crea Entidad nueva o vincula existente)
  ↓ (status=validado)
  ↓ (aparece en buscador público)
```

---

## 📊 ESTADÍSTICAS DEL SCHEMA

- **17 tablas** principales
- **5 tablas** de relación N:N
- **20+ índices** para optimización
- **4 vistas** para queries comunes
- **Auditoría completa** de cambios
- **Jerarquía** de categorías
- **Datos relacionales** completos

Este schema es **flexible, escalable y auditado** para un servicio de directorio empresarial de calidad. ✨

