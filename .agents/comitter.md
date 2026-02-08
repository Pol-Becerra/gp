---
nombre: "Comitter"
descripción: Realiza cambios en el repositorio de manera estructurada usando Conventional Commits
---

# 🚀 Skill: Comitter

Esta skill define el estándar para realizar commits en el repositorio de **GuíaPymes**, siguiendo la especificación de [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

## 📌 Formato del Mensaje

El mensaje debe seguir esta estructura:

```
<tipo>[alcance opcional]: <descripción>

[cuerpo opcional]

[pie de página opcional]
```

## 🛠 Tipos de Commit

| Tipo | Descripción |
| :--- | :--- |
| **feat** | Una nueva funcionalidad para el usuario. |
| **fix** | Corrección de un error o bug. |
| **docs** | Cambios en la documentación. |
| **style** | Cambios que no afectan el significado del código (espacios, formato, puntos y comas, etc). |
| **refactor** | Cambio en el código que ni corrige un error ni añade una función. |
| **perf** | Cambio que mejora el rendimiento. |
| **test** | Adición o corrección de pruebas existentes. |
| **chore** | Cambios en el proceso de construcción o herramientas auxiliares (ej. actualizar dependencias). |

## 💡 Reglas de Oro

1. **Imperativo**: Usa el tiempo presente ("add feature" en lugar de "added feature").
2. **Brevedad**: La descripción no debe superar los 50-72 caracteres.
3. **Cuerpo**: Úsalo para explicar el *por qué* del cambio, no el *cómo*.
4. **Breaking Changes**: Indica cambios importantes con un `!` después del tipo o `BREAKING CHANGE:` en el pie de página.

## 📝 Ejemplos

### Funcionalidad Nueva

`feat(api): añadir endpoint para listar categorías`

### Corrección de Error

`fix(ui): corregir visualización del selector de color en modo edición`

### Refactorización con Breaking Change

`refactor!: simplificar esquema de base de datos v2`

---
> [!TIP]
> Un historial de commits limpio facilita la depuración y la generación automática de changelogs.
