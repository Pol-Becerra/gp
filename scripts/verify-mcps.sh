#!/bin/bash

# Script de verificación de MCPs
# Uso: ./scripts/verify-mcps.sh

echo "🔍 Verificando configuración de MCPs..."
echo "=========================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar archivo .env
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} Archivo .env encontrado"
else
    echo -e "${RED}✗${NC} Archivo .env NO encontrado"
    echo "  → Copia .env.example a .env y configura las variables"
    exit 1
fi

# Verificar GITHUB_TOKEN
echo ""
echo "🔐 Verificando GitHub MCP..."
echo "-----------------------------"

if grep -q "GITHUB_TOKEN=ghp_" .env; then
    TOKEN=$(grep "GITHUB_TOKEN=" .env | cut -d'=' -f2)
    if [ ${#TOKEN} -gt 10 ]; then
        echo -e "${GREEN}✓${NC} GITHUB_TOKEN configurado (${#TOKEN} caracteres)"
        echo "  → Token parece válido (formato ghp_*)"
    else
        echo -e "${YELLOW}⚠${NC} GITHUB_TOKEN parece corto o inválido"
    fi
else
    echo -e "${RED}✗${NC} GITHUB_TOKEN no configurado"
    echo "  → Agrega GITHUB_TOKEN=ghp_tu_token_aqui en .env"
    echo "  → Genera token en: https://github.com/settings/tokens"
fi

# Verificar DATABASE_URL
echo ""
echo "🐘 Verificando PostgreSQL MCP..."
echo "--------------------------------"

if grep -q "DATABASE_URL=" .env; then
    DB_URL=$(grep "DATABASE_URL=" .env | cut -d'=' -f2)
    echo -e "${GREEN}✓${NC} DATABASE_URL configurado"
    
    # Extraer componentes
    if [[ $DB_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
        
        echo "  → Host: $DB_HOST"
        echo "  → Puerto: $DB_PORT"
        echo "  → Base de datos: $DB_NAME"
        echo "  → Usuario: $DB_USER"
        
        # Intentar conexión
        echo ""
        echo "  Probando conexión a PostgreSQL..."
        if command -v psql &> /dev/null; then
            PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1
            if [ $? -eq 0 ]; then
                echo -e "  ${GREEN}✓${NC} Conexión exitosa"
            else
                echo -e "  ${RED}✗${NC} No se puede conectar"
                echo "    → Verifica que PostgreSQL esté corriendo"
                echo "    → Verifica credenciales en .env"
            fi
        else
            echo -e "  ${YELLOW}⚠${NC} psql no instalado, no se puede verificar conexión"
        fi
    else
        echo -e "${YELLOW}⚠${NC} Formato de DATABASE_URL no reconocido"
        echo "  → Formato esperado: postgresql://user:pass@host:port/db"
    fi
else
    echo -e "${RED}✗${NC} DATABASE_URL no configurado"
    echo "  → Agrega DATABASE_URL en .env"
fi

# Verificar archivo MCP config
echo ""
echo "📁 Verificando archivos de configuración..."
echo "--------------------------------------------"

if [ -f ".mcp-config.json" ]; then
    echo -e "${GREEN}✓${NC} .mcp-config.json encontrado"
else
    echo -e "${RED}✗${NC} .mcp-config.json NO encontrado"
fi

if [ -f "MCP-SETUP.md" ]; then
    echo -e "${GREEN}✓${NC} MCP-SETUP.md encontrado (guía de configuración)"
else
    echo -e "${YELLOW}⚠${NC} MCP-SETUP.md no encontrado"
fi

# Resumen
echo ""
echo "=========================================="
echo "📊 Resumen de Configuración"
echo "=========================================="

# Contar verificaciones pasadas
PASSED=0
FAILED=0

if grep -q "GITHUB_TOKEN=ghp_" .env 2>/dev/null && [ ${#TOKEN} -gt 10 ]; then
    ((PASSED++))
else
    ((FAILED++))
fi

if grep -q "DATABASE_URL=" .env 2>/dev/null; then
    ((PASSED++))
else
    ((FAILED++))
fi

if [ -f ".mcp-config.json" ]; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo -e "Verificaciones exitosas: ${GREEN}$PASSED${NC}"
echo -e "Verificaciones fallidas: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Todos los MCPs están configurados correctamente!${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "  1. Los MCPs se activarán automáticamente al usar herramientas de GitHub/PostgreSQL"
    echo "  2. Consulta MCP-SETUP.md para ver comandos disponibles"
    echo "  3. Prueba ejecutar algunos comandos básicos"
else
    echo -e "${YELLOW}⚠️  Algunas configuraciones necesitan atención${NC}"
    echo ""
    echo "Para completar la configuración:"
    echo "  1. Lee MCP-SETUP.md"
    echo "  2. Configura las credenciales faltantes en .env"
    echo "  3. Ejecuta este script nuevamente"
fi

echo ""
