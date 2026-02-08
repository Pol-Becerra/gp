---
nombre: "Request Tracker"
descripción: Mantiene un historial detallado de las peticiones del usuario y los resúmenes de las acciones realizadas por el asistente.
---

# 📅 Skill: Request Tracker

Esta skill asegura que cada interacción significativa quede registrada para auditoría y continuidad del proyecto, manteniendo un archivo `HISTORY.md` (o similar) en la raíz del proyecto.

## 📌 Formato del Registro

Cada interacción debe registrarse con la siguiente estructura:

```markdown
### [FECHA_Y_HORA] - [TÍTULO_BREVE]

**Petición del Usuario:**
> [Cita directa o resumen de la petición del usuario]

**Acciones Realizadas:**
- [Acción 1 (ej: Creado endpoint en backend)]
- [Acción 2 (ej: Refactorizado componente UI)]
- [Acción 3 (ej: Actualizada documentación)]

**Archivos Afectados:**
- [ruta/al/archivo1](file:///ruta/absoluta)
- [ruta/al/archivo2](file:///ruta/absoluta)
```

## 🛠 Directrices para el Resumen

1. **Contexto**: Incluye el porqué de los cambios si hubo correcciones o decisiones técnicas importantes.
2. **Basenames**: Usa nombres de archivo legibles con links reales.
3. **Estado**: Si una tarea quedó pendiente o requiere revisión del usuario, indícalo claramente.

---
> [!TIP]
> Este historial permite a otros desarrolladores (o a ti mismo en el futuro) entender el proceso de toma de decisiones sin tener que leer todo el chat.
