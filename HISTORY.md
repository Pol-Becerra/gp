ayúdame con el fichero de skill abierto,
quiero crear un marcdown que explique el
formato de los commits. Usa Conventional
Commits

# Project History

Registro de peticiones y acciones realizadas por el asistente Antigravity.

### [2026-02-07 19:40] - Implementación de Categorías y Nuevas Skills

**Petición del Usuario:**
> "Crea el crud de categorias", "en editar no funciona el boton de gguardar y no muestra el color", "crea dos nuevas skills que me permita crear un change log de cada uno de los comits y oyto que me guarde el hiistorial de lo que te voy pidiendo con un resumen de lo que vas haciendo"

**Acciones Realizadas:**

- Implementado CRUD completo de categorías (Backend Service, API Endpoints, Frontend Dashboard Page).
- Corregido bug en la actualización de categorías mediante filtrado de campos en el backend.
- Mejorada la inicialización de colores y manejo de errores en `CategoryDialog.tsx`.
- Creada skill `comitter.md` para estandarizar mensajes siguiendo Conventional Commits.
- Creada skill `changelog-generator.md` para gestión de cambios.
- Creada skill `request-tracker.md` para seguimiento de peticiones.
- Inicializados archivos `CHANGELOG.md` y `HISTORY.md` en la raíz del proyecto.

**Archivos Afectados:**

- [services/crm/categories.js](file:///home/pol/Escritorio/gp/services/crm/categories.js)
- [api/app.js](file:///home/pol/Escritorio/gp/api/app.js)
- [web/src/app/dashboard/categorias/page.tsx](file:///home/pol/Escritorio/gp/web/src/app/dashboard/categorias/page.tsx)
- [web/src/components/dashboard/CategoryDialog.tsx](file:///home/pol/Escritorio/gp/web/src/components/dashboard/CategoryDialog.tsx)
- [web/src/components/layout/Sidebar.tsx](file:///home/pol/Escritorio/gp/web/src/components/layout/Sidebar.tsx)
- [.agents/comitter.md](file:///home/pol/Escritorio/gp/.agents/comitter.md)
- [.agents/changelog-generator.md](file:///home/pol/Escritorio/gp/.agents/changelog-generator.md)
- [.agents/request-tracker.md](file:///home/pol/Escritorio/gp/.agents/request-tracker.md)
- [CHANGELOG.md](file:///home/pol/Escritorio/gp/CHANGELOG.md)
- [HISTORY.md](file:///home/pol/Escritorio/gp/HISTORY.md)
