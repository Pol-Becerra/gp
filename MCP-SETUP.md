# Configuración de MCPs - GuíaPymes

Esta guía te ayudará a configurar los Model Context Protocols (MCPs) para GitHub y PostgreSQL.

## 📋 Qué son los MCPs

Los MCPs (Model Context Protocol) permiten que los agentes de IA interactúen directamente con herramientas externas como GitHub y bases de datos PostgreSQL.

## 🔧 MCPs Configurados

### 1. GitHub MCP
**Propósito**: Acceso a repositorios, commits, PRs, issues y actions

**Capacidades**:
- Leer archivos del repositorio
- Ver commits y historial
- Crear y gestionar issues
- Ver estado de CI/CD
- Crear pull requests

### 2. PostgreSQL MCP
**Propósito**: Consultas y operaciones en base de datos

**Capacidades**:
- Ejecutar queries SELECT
- Insertar y actualizar datos
- Ver esquema de tablas
- Crear migraciones
- Backup de datos

---

## 🚀 Guía de Configuración Paso a Paso

### Paso 1: GitHub MCP

#### 1.1 Generar Personal Access Token

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click en "Generate new token (classic)"
3. Configura los siguientes scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
   - ✅ `read:user` (Read user profile data)
   - ✅ `read:org` (Read org data) - opcional

4. Click en "Generate token"
5. **IMPORTANTE**: Copia el token inmediatamente (solo se muestra una vez)

#### 1.2 Configurar Token en el Proyecto

Edita el archivo `.env`:

```bash
# Reemplaza con tu token real
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

#### 1.3 Verificar Configuración

```bash
# El MCP se inicializará automáticamente cuando uses herramientas de GitHub
```

---

### Paso 2: PostgreSQL MCP

#### 2.1 Verificar PostgreSQL Instalado

```bash
# Verificar si PostgreSQL está corriendo
psql --version

# Verificar conexión
psql -h localhost -U tu_usuario -d guiapymes_db -c "SELECT version();"
```

#### 2.2 Configurar Usuario para MCP

Es recomendable crear un usuario específico para el MCP con permisos limitados:

```sql
-- Conectarse como superusuario
psql -h localhost -U postgres

-- Crear usuario para MCP
CREATE USER ai_agent WITH PASSWORD 'tu_password_seguro';

-- Dar permisos limitados
GRANT CONNECT ON DATABASE guiapymes_db TO ai_agent;
GRANT USAGE ON SCHEMA public TO ai_agent;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO ai_agent;

-- Permisos específicos (opcional)
-- GRANT DELETE ON TABLE companies TO ai_agent; -- Solo si es necesario

-- Revocar permisos peligrosos
REVOKE ALL ON TABLE users FROM ai_agent; -- Proteger tabla de usuarios
```

#### 2.3 Configurar URL de Conexión

Edita el archivo `.env`:

```bash
# Formato: postgresql://username:password@host:port/database
DATABASE_URL=postgresql://ai_agent:tu_password_seguro@localhost:5432/guiapymes_db
```

---

## 📁 Archivos de Configuración

### `.mcp-config.json`
Archivo de configuración de MCPs (ya creado):

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

### `.env`
Variables de entorno necesarias (actualizado):

```bash
# Database (usado por la app y MCP)
DATABASE_URL=postgresql://ai_agent:password@localhost:5432/guiapymes_db

# GitHub Token (solo MCP)
GITHUB_TOKEN=ghp_your_token_here
```

---

## ✅ Verificación

### Verificar GitHub MCP

Una vez configurado, puedes usar comandos como:
- `mcp_github_search_repositories` - Buscar repositorios
- `mcp_github_get_file_contents` - Leer archivos
- `mcp_github_create_issue` - Crear issues
- `mcp_github_list_commits` - Ver commits

### Verificar PostgreSQL MCP

Comandos disponibles:
- `mcp_postgres_query` - Ejecutar queries
- `mcp_postgres_get_schema` - Ver esquema de tablas
- `mcp_postgres_list_tables` - Listar tablas

---

## 🔒 Seguridad

### Buenas Prácticas

1. **GitHub Token**:
   - ✅ Usa tokens con scope mínimo necesario
   - ✅ Rota el token cada 90 días
   - ✅ Nunca commits el token al repositorio
   - ✅ Usa `.env` (ya en `.gitignore`)

2. **PostgreSQL**:
   - ✅ Crea usuario específico para MCP
   - ✅ Limita permisos (SELECT, INSERT, UPDATE)
   - ❌ NO des permisos DELETE sin aprobación
   - ❌ NO des acceso a tablas sensibles (users, passwords)

3. **Variables de Entorno**:
   - ✅ `.env` está en `.gitignore`
   - ✅ `.env.example` no tiene valores reales
   - ✅ Usa contraseñas fuertes

---

## 🐛 Solución de Problemas

### Error: "GITHUB_TOKEN no encontrado"
**Solución**: Verifica que el token esté en `.env` y que el archivo se cargue correctamente.

### Error: "No se puede conectar a PostgreSQL"
**Solución**:
```bash
# Verificar PostgreSQL está corriendo
sudo systemctl status postgresql

# Verificar puerto
netstat -plntu | grep 5432

# Probar conexión manual
psql -h localhost -U ai_agent -d guiapymes_db
```

### Error: "Permiso denegado en tabla X"
**Solución**: El usuario ai_agent necesita permisos adicionales:
```sql
GRANT SELECT ON TABLE nombre_tabla TO ai_agent;
```

---

## 📚 Recursos Adicionales

- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [PostgreSQL GRANT](https://www.postgresql.org/docs/current/sql-grant.html)
- [MCP Documentation](https://docs.anthropic.com/claude/docs/model-context-protocol)

---

**Estado**: Configuración base creada ✅  
**Próximo paso**: Configurar credenciales reales siguiendo esta guía
