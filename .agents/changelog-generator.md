---
nombre: "Changelog Generator"
descripción: Genera y actualiza el archivo CHANGELOG.md basándose en los commits siguiendo el estándar Keep a Changelog.
---

# 📜 Skill: Changelog Generator

Esta skill proporciona las directrices para mantener un registro de cambios (`CHANGELOG.md`) claro y útil para los desarrolladores y usuarios finales, siguiendo los principios de [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## 📌 Estructura del Archivo

El archivo debe tener las siguientes secciones por versión:

- `Added`: Para nuevas funcionalidades.
- `Changed`: Para cambios en funcionalidades existentes.
- `Deprecated`: Para funcionalidades que pronto serán eliminadas.
- `Removed`: Para funcionalidades eliminadas.
- `Fixed`: Para cualquier corrección de errores.
- `Security`: En caso de vulnerabilidades.

## 🛠 Proceso de Actualización

1. **Recopilar Commits**: Listar los commits desde la última versión.
2. **Clasificar**: Agrupar los cambios según el tipo de Conventional Commit:
    - `feat` -> `Added`
    - `fix` -> `Fixed`
    - `refactor`/`perf` -> `Changed`
3. **Redactar**: Escribir descripciones orientadas al valor ("Añadida gestión de categorías") en lugar de detalles técnicos ("Actualizado app.js para incluir rutas").
4. **Fecha**: Incluir siempre la fecha de lanzamiento en formato `YYYY-MM-DD`.

## 📝 Ejemplo de Entrada

```markdown
## [1.1.0] - 2026-02-07
### Added
- CRUD completo de categorías en el panel de administración.
- Skill 'Comitter' para estandarizar mensajes de commit.

### Fixed
- Error en el guardado de categorías al editar.
- Visualización del color hexadecimal en el selector de la UI.
```

---
> [!IMPORTANT]
> Nunca uses los mensajes de commit directamente como entradas del changelog. Estos deben ser redactados para que sean legibles por humanos.
