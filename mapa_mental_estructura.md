# Sistema de Skills y Agentes de IA

## 1. Arquitectura de Agentes

### Agente Orquestador

- **Manejo de subagentes**: Coordina la ejecución de múltiples agentes subordinados
- **Mantenimiento del contexto inicial**: Preserva el contexto global durante toda la ejecución

### Subagentes

- **Tareas en paralelo**: Ejecuta múltiples tareas simultáneamente para mayor eficiencia
- **Contexto independiente**: Cada subagente mantiene su propio contexto aislado
- **Devolución de resultados al Orquestador**: Retorna los resultados para agregación y síntesis

---

## 2. Archivos de Contexto (Agent MD)

### Propósito

- **Instrucciones para la IA**: Define cómo el agente debe comportarse y tomar decisiones
- **Cultura del proyecto**: Establece valores, principios y estándares del proyecto
- **Arquitectura y tecnologías**: Describe la pila tecnológica y las decisiones arquitectónicas

### Jerarquía

- **Agente Root (Director)**: Agente principal que supervisa y coordina toda la operación
- **Agentes sectorizados (UI, API, Audit)**: Agentes especializados por áreas específicas

### Buenas Prácticas

- **Tamaño razonable (250-500 líneas)**: Mantener archivos de contexto concisos y enfocados
- **Evitar exceso de contexto para prevenir alucinaciones**: Minimizar información irrelevante que confunda al modelo

---

## 3. Sistema de Skills

### Definición

- **Habilidades específicas (React, Python, etc.)**: Skills para tecnologías y lenguajes de programación específicos
- **Tareas repetitivas (Commits, PRs)**: Automatización de procesos recurrentes

### Estructura (Skill MD)

- **Metadatos (Autor, Versión, Licencia)**: Información sobre el origen y licencia del skill
- **Triggers (Cuándo ejecutar)**: Condiciones que activan la ejecución del skill
- **Scope (Ámbito de aplicación)**: Define el rango y límites de aplicación del skill
- **Recursos (Templates y ejemplos)**: Proporciona plantillas y ejemplos de uso

### Autoinvocación

- **Autoinvocación de skills**: Permite que los agentes invoquen skills automáticamente sin intervención manual
- **Sincronización (Skill Sync)**: Mantiene los skills sincronizados entre diferentes instancias
- **Setup para múltiples plataformas (Claude, Gemini, GPT)**: Configuración compatible con diferentes modelos de IA

---

## 4. Beneficios

- **Reducción de contexto innecesario**: Minimiza el token usage al compartimentalizar la información
- **Onboarding rápido para humanos**: Facilita la incorporación de nuevos miembros al equipo
- **Consistencia en contribuciones Open Source**: Garantiza estándares uniformes en proyectos colaborativos
- **Eficiencia en flujos de trabajo**: Optimiza procesos y reduce tiempos de ejecución

---

## Resumen Conceptual

Este sistema propone una arquitectura modular para trabajar con Agentes de IA donde:

1. Un **Agente Orquestador** coordina múltiples **Subagentes** especializados
2. Los agentes se guían mediante **Archivos de Contexto (Agent MD)** que definen su propósito, cultura y arquitectura
3. La reutilización de funcionalidades se logra mediante **Skills** autoinvocables y versionados
4. El sistema está optimizado para reducir contexto, mejorar consistencia y facilitar colaboración
