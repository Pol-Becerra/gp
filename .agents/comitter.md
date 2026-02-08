---
nombre: "Comitter"
descripción: Realiza commits y push en el repositorio de manera estructurada usando Conventional Commits con confirmación interactiva
---

# 🚀 Skill: Comitter

Esta skill define el estándar para realizar commits y push en el repositorio de **GuíaPymes**, siguiendo la especificación de [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Incluye flujo de trabajo interactivo que muestra el mensaje del commit y pregunta antes de ejecutar el push.

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

## 🔄 Flujo de Trabajo

### Paso 1: Verificar cambios
Antes de commitear, verifica el estado del repositorio:
```bash
git status
git diff
```

### Paso 2: Stage y Commit
```bash
git add <archivos>
git commit -m "<tipo>(<alcance>): <descripción>"
```

### Paso 3: Mostrar mensaje del commit
Después de crear el commit, muestra el mensaje generado:
```
Commit realizado: <hash> <mensaje>
```

### Paso 4: Preguntar por el push
Antes de ejecutar el push, preguntar al usuario:
> **Commit realizado:** `<hash>` - `<mensaje>`
>
> ¿Quieres que ejecute el push? (si/no)

### Paso 5: Ejecutar push (si confirma)
Si el usuario responde "si":
```bash
git push -u origin <rama>
```

## 📋 Checklist de Commit + Push

- [ ] Verificar archivos modificados
- [ ] Elegir tipo de commit apropiado
- [ ] Escribir mensaje descriptivo
- [ ] Realizar commit
- [ ] Mostrar mensaje confirmación
- [ ] Preguntar antes de push
- [ ] Ejecutar push (si aplica)

---
> [!TIP]
> Un historial de commits limpio facilita la depuración y la generación automática de changelogs.
