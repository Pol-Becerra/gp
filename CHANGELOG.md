# Changelog (Historial de Cambios)

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Sin Lanzar]

### Añadido

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

### Corregido

- **UI**: Corregido error donde el botón "Guardar" en el modal de edición de categorías fallaba debido a campos no gestionados.
- **UI**: Corregido el comportamiento del selector de color para categorías sin un color predefinido.
