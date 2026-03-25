---
title: "Iteración"
description: "Iterar es el proceso de mejorar un producto de manera incremental a través de ciclos cortos de construcción, medición y aprendizaje."
category: "Producto"
order: 2
question: "¿Cómo se mejora una app?"
related: ["mvp", "feedback-de-usuarios", "validacion"]
---

## Mejorar de a poco

Una **iteración** es un ciclo corto de trabajo donde hacés cambios en tu producto, los lanzás, medís el impacto y aprendés de los resultados. En vez de intentar construir la versión perfecta de entrada (spoiler: no existe), vas mejorando de a poco basándote en datos reales y [feedback de usuarios](/feedback-de-usuarios). Es como esculpir: no arrancás con el detalle de los ojos, arrancás con la forma general y vas refinando.

## El ciclo construir-medir-aprender

El corazón del desarrollo iterativo es un ciclo que se repite constantemente:

```
    ┌─────────────┐
    │    BUILD    │  → You develop a feature or change
    └──────┬──────┘
           ▼
    ┌─────────────┐
    │   MEASURE   │  → You collect data on how it's used
    └──────┬──────┘
           ▼
    ┌─────────────┐
    │    LEARN    │  → You analyze the data and decide what's next
    └──────┬──────┘
           │
           └──────────► Back to building
```

Cada vuelta de este ciclo es una iteración. La clave es que cada una sea **corta** (días o semanas, no meses) para que puedas corregir el rumbo rápido si algo no funciona.

## Iteración en la práctica

Supongamos que tenés una app de tareas y querés mejorar la retención. Una iteración podría verse así:

1. **Hipótesis**: "Si agregamos notificaciones de recordatorio, los usuarios van a volver más seguido."
2. **Construir**: Implementás notificaciones push básicas (sin opciones avanzadas, lo más simple que funcione).
3. **Medir**: Después de una semana, comparás la retención de usuarios con notificaciones vs. sin notificaciones.
4. **Aprender**: Si la retención subió, iterás sobre las notificaciones (agregar personalización, horarios, etc.). Si no subió, probás otra hipótesis.

El error más común es saltear el paso de medir. Si lanzás funcionalidades sin medir su impacto, estás adivinando en vez de iterando.

## Versionado y releases

Cada iteración se puede asociar a una **versión** del producto. El versionado semántico (SemVer) es un estándar muy usado:

```
v1.2.3
│ │ │
│ │ └─ PATCH: bug fixes
│ └─── MINOR: new features (backward compatible)
└───── MAJOR: big changes (may break things)
```

No hace falta que cada iteración sea un cambio de versión mayor. La mayoría son cambios menores o patches. Lo importante es que cada release sea estable y que puedas volver atrás si algo sale mal.

## Cuánto es suficiente

Un error común es iterar sin dirección: agregar funcionalidades porque sí, sin un objetivo claro. Cada iteración debería partir de una hipótesis concreta y tener métricas definidas para saber si funcionó. También es importante saber cuándo una funcionalidad ya está "suficientemente buena" y pasar a otra cosa. La [validación](/validacion) constante con usuarios te ayuda a priorizar qué mejorar primero y evitar perder tiempo en detalles que no mueven la aguja.
