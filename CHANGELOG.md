# Changelog (Historial de Cambios)

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Sin Lanzar]

### Añadido

- **Backend**: Implementado `AuthService` y `UserService` para la gestión de autenticación y usuarios.
- **Seguridad**: Middleware de autenticación basado en JWT con control de acceso por roles (super_admin, admin, gestor).
- **API**: Nuevos endpoints para Login (`/api/auth/login`), sesión actual (`/api/auth/me`) y CRUD completo de usuarios (`/api/users`).
- **Frontend**: `AuthContext` para gestión global de estado de autenticación, persistencia de sesión y redirección automática.
- **Frontend**: Nueva página de inicio de sesión (`/login`) con diseño moderno y soporte para temas oscuros.
- **Frontend**: Panel de gestión de usuarios (`/dashboard/usuarios`) permitiendo administración completa de cuentas por parte de administradores.
- **Frontend**: Integración en Sidebar: visualización de perfil de usuario, botón de cierre de sesión y filtrado de menú por permisos.
- **Scripts**: Script `create-admin.js` para la creación inicial de usuarios administradores mediante CLI.
- **Backend**: Creado `CategoryService` en `services/crm/categories.js` para manejar operaciones de BD.
- **API**: Nuevos endpoints para gestión de categorías: `GET`, `POST`, `PUT`, `DELETE /api/categories`.
- **Frontend**: Página de dashboard para categorías (`/dashboard/categorias`) con soporte CRUD completo.
- **Frontend**: Componente interactivo `CategoryDialog` para crear/editar categorías.
- **Documentación**: Nuevas habilidades en `.agents/`: `comitter.md`, `changelog-generator.md` y `request-tracker.md`.
- **Base de Datos**: Procedimiento almacenado `upsert_google_maps_data()` para operaciones atómicas de inserción/actualización en la extracción de Google Maps.
- **Base de Datos**: Procedimiento almacenado `clean_data_google_maps()` para vaciar todos los registros de la tabla data_google_maps (utilidad de desarrollo).
- **API**: Nuevo endpoint `DELETE /api/raw-data/clean` para ejecutar la limpieza de la tabla.
- **Frontend**: Añadido botón "Limpiar DGM" en la página de administración del scraper con modal de confirmación para limpieza de datos de desarrollo.
- **Frontend**: Añadida columna visual de "Color" en el listado de categorías mostrando el color como círculo.
- **Frontend**: Mejorado el selector de color en el modal de categorías con color picker visual en lugar de campo de texto hexadecimal.

- **Extracción de Datos**: Refactorizado `services/data-extraction/index.js` para navegar directamente a la URL de cada negocio, eliminando condiciones de carrera y asegurando un 100% de precisión en los datos.
- **Frontend**: Añadido un resumen detallado de extracción al modal del scraper, incluyendo conteos de registros nuevos/actualizados y métricas de calidad (porcentaje de teléfono/web).
- **Frontend**: Implementada una cuenta regresiva de 5 segundos para el auto-cierre del modal del scraper tras una extracción exitosa.
- **API**: Actualizado `/api/scraper/run` para ser síncrono y devolver estadísticas detalladas de la extracción.
- **Base de Datos**: Corregido el procedimiento `upsert_google_maps_data()` para manejar el orden de parámetros y referencias a columnas ambiguas.
- **Scripts**: Actualizado `scripts/run-extraction.js` con mejoras en el parseo de argumentos, modo de depuración y registro de estadísticas.

- **Backend**: Ampliado `TaskService` en `services/task-management/index.js` para llamar procedimientos almacenados de tickets.
- **Backend**: Creado `AreaService` en `services/task-management/areas.js` para gestión de áreas de tickets.
- **Base de Datos**: Tabla `ticket_areas` para clasificar tickets (Instagram, Servidores, Backups, etc.) con 10 áreas predeterminadas.
- **Base de Datos**: Soporte para tickets anidados (`parent_id`) y áreas (`area_id`) en `tasks_tickets`.
- **Base de Datos**: Nuevos procedimientos almacenados para CRUD de tickets: `get_all_tickets()`, `get_ticket_by_id()`, `create_ticket()`, `update_ticket()`, `update_ticket_status()`, `delete_ticket()`, `get_tickets_stats()`, `get_sub_tickets()`.
- **Base de Datos**: Nuevos procedimientos almacenados para CRUD de áreas: `get_all_areas()`, `get_area_by_id()`, `create_area()`, `update_area()`, `delete_area()`.
- **Base de Datos**: Función `get_users_for_assignment()` para obtener usuarios disponibles para asignar tickets.
- **API**: Nuevos endpoints para gestión de tickets: `GET`, `POST`, `PUT`, `DELETE /api/tickets`, `PATCH /api/tickets/:id/status`, `GET /api/tickets/stats`, `GET /api/tickets/:id/sub-tickets`.
- **API**: Nuevos endpoints para gestión de áreas: `GET`, `POST`, `PUT`, `DELETE /api/areas`.
- **API**: Endpoint `GET /api/users/assignable` para listar usuarios disponibles.
- **Frontend**: Página de dashboard para tickets (`/dashboard/tareas`) con listado, filtros por estado/prioridad/área, tarjetas de estadísticas, crear/editar/eliminar tickets con modales interactivos.
- **Frontend**: Selector de área con botón "+" para crear nuevas áreas desde el modal de tickets.
- **Frontend**: Selector de usuario para asignar tickets y selector de ticket padre para sub-tickets.

### Corregido

- **UI**: Corregido error donde el botón "Guardar" en el modal de edición de categorías fallaba debido a campos no gestionados.
- **UI**: Corregido el comportamiento del selector de color para categorías sin un color predefinido.
