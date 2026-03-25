---
title: "Monolito"
description: "Un monolito es una arquitectura de software donde toda la aplicación vive en un único código base y se despliega como una sola unidad."
category: "Arquitectura"
order: 1
question: "¿Qué es un monolito?"
related: ["servicios", "modularidad", "escalabilidad"]
---

## ¿Qué es una arquitectura monolítica?

Un **monolito** es una aplicación donde todo el código vive junto en un solo proyecto y se despliega como una sola unidad. La [autenticación](/autenticacion), la lógica de negocio, el acceso a la [base de datos](/base-de-datos), las [APIs](/api), todo está en el mismo código base. Cuando hacés deploy, desplegás todo junto. Es la forma más natural y directa de construir una app, y probablemente la primera arquitectura que vas a usar.

## Ventajas del monolito

El monolito tiene mala fama en la industria, pero en realidad tiene muchas ventajas, especialmente para equipos chicos y proyectos en etapa temprana:

- **Simplicidad**: todo está en un lugar, es fácil de entender y navegar.
- **Fácil de desarrollar**: no necesitás manejar comunicación entre [servicios](/servicios) ni configurar múltiples deploys.
- **Fácil de testear**: podés correr [tests](/testing) de integración sin levantar varios servicios.
- **Fácil de debuggear**: cuando algo falla, el stack trace te lleva directo al problema porque todo está en el mismo proceso.

```
Typical monolith structure:

my-app/
├── src/
│   ├── auth/           # Authentication
│   ├── users/          # Users module
│   ├── products/       # Products module
│   ├── orders/         # Orders module
│   ├── payments/       # Payments module
│   └── notifications/  # Notifications
├── database/
│   └── migrations/
├── tests/
└── package.json
```

## Desventajas del monolito

A medida que el proyecto y el equipo crecen, el monolito puede convertirse en un problema:

- **Escala todo o nada**: si el módulo de pagos necesita más recursos, tenés que escalar toda la app, no solo esa parte.
- **Deploys riesgosos**: un cambio en un módulo puede romper otro. Cada deploy despliega todo junto.
- **Acoplamiento**: con el tiempo, los módulos tienden a entremezclarse y se vuelve difícil hacer cambios sin efectos secundarios.
- **Equipos pisándose**: si muchos desarrolladores trabajan en el mismo código base, los conflictos de merge son frecuentes.

## ¿Cuándo usar un monolito?

La respuesta corta: casi siempre al principio. Si estás arrancando un proyecto, un monolito bien organizado es la mejor opción. Es más rápido de construir, más fácil de mantener y te permite iterar rápido. El error más común es querer empezar con [microservicios](/microservicios) cuando todavía no sabés bien qué va a hacer tu producto. La complejidad extra no se justifica.

## Del monolito a los microservicios

Si tu monolito crece mucho, podés ir migrando partes a [servicios](/servicios) independientes de forma gradual. Esto se conoce como el patrón "Strangler Fig": vas extrayendo funcionalidades del monolito a servicios separados, uno a la vez, sin reescribir todo de cero. La clave es tener buena [modularidad](/modularidad) dentro del monolito para que esa migración sea posible. Un monolito bien estructurado es mucho más fácil de descomponer que uno donde todo está mezclado.
