-- Initial Schema Migration for GuíaPymes
-- Version: 2.0
-- Description: Core tables, indexes, and constraints for PyMEs automation system
-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Enum types (if needed, though VARCHAR with check constraints is used in documentation)
-- 1. TABLA: data_google_maps
CREATE TABLE data_google_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(500) NOT NULL,
    address VARCHAR(1000),
    telefono VARCHAR(50),
    website VARCHAR(500),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    categoria_primaria VARCHAR(200),
    categorias_adicionales TEXT [],
    google_maps_id VARCHAR(200) UNIQUE,
    google_place_id VARCHAR(200),
    rating DECIMAL(3, 2),
    review_count INTEGER,
    photo_urls TEXT [],
    opening_hours JSONB,
    search_category VARCHAR(200),
    search_postal_code VARCHAR(10),
    search_timestamp TIMESTAMP,
    etiqueta VARCHAR(50),
    -- 'nuevo', 'procesado', 'duplicado', 'sucursal', 'validado'
    detected_duplicates UUID [],
    matched_entidad_id UUID,
    raw_info TEXT,
    google_maps_url TEXT,
    -- Will add FK later
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by VARCHAR(100)
);
-- 2. TABLA: usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(300) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(300),
    telefono VARCHAR(50),
    rol VARCHAR(50),
    -- 'super_admin', 'admin', 'gestor_cuentas', 'moderador'
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
-- 3. TABLA: entidades (NÚCLEO)
CREATE TABLE entidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_legal VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE,
    descripcion TEXT,
    razon_social VARCHAR(500),
    cuit VARCHAR(13) UNIQUE,
    tipo_entidad VARCHAR(50),
    -- 'comercio', 'servicio', 'franquicia', 'profesional'
    activa BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_verificacion TIMESTAMP,
    validation_score DECIMAL(3, 2),
    validacion_afip BOOLEAN,
    afip_estado VARCHAR(100),
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    descripcion_larga TEXT,
    created_by UUID REFERENCES usuarios(id),
    updated_by UUID REFERENCES usuarios(id),
    total_visitas INTEGER DEFAULT 0,
    total_contactos INTEGER DEFAULT 0
);
-- Add missing FK to data_google_maps
ALTER TABLE data_google_maps
ADD CONSTRAINT fk_matched_entidad FOREIGN KEY (matched_entidad_id) REFERENCES entidades(id);
-- 4. TABLA: solicitudes
CREATE TABLE solicitudes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_empresa VARCHAR(500) NOT NULL,
    descripcion TEXT,
    nombre_contacto VARCHAR(300),
    email_contacto VARCHAR(300) NOT NULL,
    telefono_contacto VARCHAR(50),
    direccion VARCHAR(1000),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    telefonos JSONB,
    emails JSONB,
    sitios_web TEXT [],
    redes_sociales JSONB,
    categorias UUID [],
    status VARCHAR(50),
    -- 'pendiente', 'contactado', 'validado', 'rechazado', 'duplicado'
    motivo_rechazo TEXT,
    entidad_id UUID REFERENCES entidades(id),
    merged_with_data_google_maps UUID REFERENCES data_google_maps(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validated_at TIMESTAMP,
    validated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 5. TABLA: direcciones
CREATE TABLE direcciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidad_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
    calle VARCHAR(500) NOT NULL,
    numero VARCHAR(50),
    piso VARCHAR(50),
    departamento VARCHAR(50),
    codigo_postal VARCHAR(10),
    localidad VARCHAR(200),
    provincia VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'Argentina',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    tipo_direccion VARCHAR(50),
    -- 'principal', 'sucursal', 'oficina', 'almacén'
    nombre_direccion VARCHAR(300),
    horario_atencion JSONB,
    validada BOOLEAN DEFAULT false,
    es_actual BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 6. TABLA: telefonos
CREATE TABLE telefonos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidad_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL,
    tipo_telefonico VARCHAR(50),
    codigo_pais VARCHAR(5) DEFAULT '+54',
    tipo_uso VARCHAR(100),
    horario_disponible JSONB,
    validado BOOLEAN DEFAULT false,
    es_principal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 7. TABLA: emails
CREATE TABLE emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidad_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
    email VARCHAR(300) NOT NULL,
    tipo_uso VARCHAR(100),
    validado BOOLEAN DEFAULT false,
    confirmado BOOLEAN DEFAULT false,
    es_principal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 8. TABLA: sitios_web
CREATE TABLE sitios_web (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidad_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    tipo_sitio VARCHAR(100),
    validado BOOLEAN DEFAULT false,
    es_principal BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 9. TABLA: redes_sociales
CREATE TABLE redes_sociales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidad_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
    plataforma VARCHAR(100) NOT NULL,
    usuario_o_url VARCHAR(500) NOT NULL,
    validada BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 10. TABLA: contactos
CREATE TABLE contactos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidad_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
    nombre VARCHAR(300) NOT NULL,
    apellido VARCHAR(300),
    puesto_cargo VARCHAR(200),
    departamento VARCHAR(200),
    descripcion TEXT,
    foto_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 11. TABLAS RELACIONALES: contacto_*
CREATE TABLE contacto_telefonos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contacto_id UUID NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL,
    tipo VARCHAR(50)
);
CREATE TABLE contacto_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contacto_id UUID NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
    email VARCHAR(300) NOT NULL
);
CREATE TABLE contacto_direcciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contacto_id UUID NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
    direccion VARCHAR(1000),
    tipo VARCHAR(50)
);
CREATE TABLE contacto_redes_sociales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contacto_id UUID NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
    plataforma VARCHAR(100),
    usuario_o_url VARCHAR(500)
);
CREATE TABLE contacto_sitios_web (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contacto_id UUID NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
    url VARCHAR(500)
);
-- 12. TABLA: categorias
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL UNIQUE,
    slug VARCHAR(200) UNIQUE,
    descripcion TEXT,
    icono_url VARCHAR(500),
    color_hex VARCHAR(7),
    parent_id UUID REFERENCES categorias(id),
    nivel_profundidad INTEGER DEFAULT 0,
    orden INTEGER DEFAULT 0,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 13. Entidades y Categorías (N:N)
CREATE TABLE entidad_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidad_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
    es_primaria BOOLEAN DEFAULT false,
    es_verificada BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 14. Data Google Maps y Categorías (N:N)
CREATE TABLE data_google_maps_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_google_maps_id UUID NOT NULL REFERENCES data_google_maps(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 15. TABLA: etiquetas
CREATE TABLE etiquetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    tipo VARCHAR(50),
    -- 'estado', 'segmentacion', 'marketing'
    color_hex VARCHAR(7),
    icono VARCHAR(100),
    aplicable_a TEXT [],
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Relaciones para etiquetas
CREATE TABLE entidad_etiquetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidad_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
    etiqueta_id UUID NOT NULL REFERENCES etiquetas(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE data_google_maps_etiquetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_google_maps_id UUID NOT NULL REFERENCES data_google_maps(id) ON DELETE CASCADE,
    etiqueta_id UUID NOT NULL REFERENCES etiquetas(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE contacto_etiquetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contacto_id UUID NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
    etiqueta_id UUID NOT NULL REFERENCES etiquetas(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 16. TABLA: audit_log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id),
    tabla_afectada VARCHAR(100),
    registro_id UUID,
    operacion VARCHAR(50),
    valores_anteriores JSONB,
    valores_nuevos JSONB,
    cambios_detectados JSONB,
    descripcion TEXT,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Indexes
CREATE INDEX idx_data_google_maps_status ON data_google_maps(etiqueta);
CREATE INDEX idx_data_google_maps_nombre ON data_google_maps(nombre);
CREATE INDEX idx_data_google_maps_location ON data_google_maps(latitude, longitude);
CREATE INDEX idx_data_google_maps_categoria ON data_google_maps(categoria_primaria);
CREATE INDEX idx_data_google_maps_postal ON data_google_maps(search_postal_code);
CREATE INDEX idx_data_google_maps_entidad ON data_google_maps(matched_entidad_id);
CREATE INDEX idx_solicitudes_status ON solicitudes(status);
CREATE INDEX idx_solicitudes_email ON solicitudes(email_contacto);
CREATE INDEX idx_solicitudes_entidad ON solicitudes(entidad_id);
CREATE INDEX idx_solicitudes_created ON solicitudes(created_at DESC);
CREATE INDEX idx_entidades_activa ON entidades(activa);
CREATE INDEX idx_entidades_slug ON entidades(slug);
CREATE INDEX idx_entidades_tipo ON entidades(tipo_entidad);
CREATE INDEX idx_entidades_validation ON entidades(validation_score DESC);
CREATE INDEX idx_entidades_cuit ON entidades(cuit)
WHERE cuit IS NOT NULL;
CREATE INDEX idx_direcciones_entidad ON direcciones(entidad_id);
CREATE INDEX idx_direcciones_postal ON direcciones(codigo_postal);
CREATE INDEX idx_direcciones_location ON direcciones(latitude, longitude);
CREATE INDEX idx_telefonos_entidad ON telefonos(entidad_id);
CREATE INDEX idx_telefonos_numero ON telefonos(numero);
CREATE INDEX idx_emails_entidad ON emails(entidad_id);
CREATE INDEX idx_emails_email ON emails(email);
CREATE INDEX idx_sitios_web_entidad ON sitios_web(entidad_id);
CREATE INDEX idx_sitios_web_url ON sitios_web(url);
CREATE INDEX idx_redes_sociales_entidad ON redes_sociales(entidad_id);
CREATE INDEX idx_redes_sociales_plataforma ON redes_sociales(plataforma);
CREATE INDEX idx_contactos_entidad ON contactos(entidad_id);
CREATE INDEX idx_contacto_telefonos_contacto ON contacto_telefonos(contacto_id);
CREATE INDEX idx_contacto_emails_contacto ON contacto_emails(contacto_id);
CREATE INDEX idx_contacto_direcciones_contacto ON contacto_direcciones(contacto_id);
CREATE INDEX idx_contacto_redes_contacto ON contacto_redes_sociales(contacto_id);
CREATE INDEX idx_contacto_webs_contacto ON contacto_sitios_web(contacto_id);
CREATE INDEX idx_categorias_parent ON categorias(parent_id);
CREATE INDEX idx_categorias_slug ON categorias(slug);
CREATE INDEX idx_categorias_activa ON categorias(activa);
CREATE INDEX idx_entidad_categorias_entidad ON entidad_categorias(entidad_id);
CREATE INDEX idx_entidad_categorias_categoria ON entidad_categorias(categoria_id);
CREATE UNIQUE INDEX idx_entidad_categorias_unique ON entidad_categorias(entidad_id, categoria_id);
CREATE INDEX idx_dgm_categorias_dgm ON data_google_maps_categorias(data_google_maps_id);
CREATE INDEX idx_dgm_categorias_categoria ON data_google_maps_categorias(categoria_id);
CREATE INDEX idx_entidad_etiquetas_entidad ON entidad_etiquetas(entidad_id);
CREATE INDEX idx_entidad_etiquetas_etiqueta ON entidad_etiquetas(etiqueta_id);
CREATE INDEX idx_dgm_etiquetas_dgm ON data_google_maps_etiquetas(data_google_maps_id);
CREATE INDEX idx_dgm_etiquetas_etiqueta ON data_google_maps_etiquetas(etiqueta_id);
CREATE INDEX idx_contacto_etiquetas_contacto ON contacto_etiquetas(contacto_id);
CREATE INDEX idx_contacto_etiquetas_etiqueta ON contacto_etiquetas(etiqueta_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_audit_log_usuario ON audit_log(usuario_id);
CREATE INDEX idx_audit_log_tabla ON audit_log(tabla_afectada);
CREATE INDEX idx_audit_log_registro ON audit_log(registro_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(created_at DESC);
-- Constraints
ALTER TABLE direcciones
ADD CONSTRAINT check_provincia CHECK (
        provincia IN (
            'Buenos Aires',
            'CABA',
            'Córdoba',
            'Santa Fe',
            'Mendoza',
            'Tucumán',
            'La Pampa',
            'Misiones',
            'Corrientes',
            'Entre Ríos',
            'Chaco',
            'Formosa',
            'Jujuy',
            'Salta',
            'Catamarca',
            'La Rioja',
            'San Juan',
            'San Luis',
            'Santiago del Estero',
            'Tierra del Fuego',
            'Neuquén',
            'Río Negro',
            'Chubut',
            'Santa Cruz'
        )
    );
ALTER TABLE data_google_maps
ADD CONSTRAINT check_coordinates CHECK (
        latitude >= -90
        AND latitude <= 90
        AND longitude >= -180
        AND longitude <= 180
    );
ALTER TABLE direcciones
ADD CONSTRAINT check_coordinates CHECK (
        latitude >= -90
        AND latitude <= 90
        AND longitude >= -180
        AND longitude <= 180
    );
ALTER TABLE emails
ADD CONSTRAINT check_email CHECK (
        email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
    );
ALTER TABLE entidades
ADD CONSTRAINT check_cuit CHECK (
        cuit IS NULL
        OR cuit ~ '^\d{11}$'
    );
ALTER TABLE entidades
ADD CONSTRAINT check_validation_score CHECK (
        validation_score >= 0
        AND validation_score <= 1
    );
-- Missing tasks table from Task Management service
CREATE TABLE tasks_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES entidades(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'Medium',
    status VARCHAR(50) DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_to UUID REFERENCES usuarios(id),
    updated_by UUID REFERENCES usuarios(id)
);
CREATE INDEX idx_tasks_tickets_status ON tasks_tickets(status);
CREATE INDEX idx_tasks_tickets_priority ON tasks_tickets(priority);
CREATE INDEX idx_tasks_tickets_entity ON tasks_tickets(entity_id);
CREATE INDEX idx_tasks_tickets_assigned ON tasks_tickets(assigned_to);