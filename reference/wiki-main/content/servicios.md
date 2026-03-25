---
title: "Servicios"
description: "Los microservicios son una arquitectura donde la aplicación se divide en servicios pequeños e independientes que se comunican entre sí."
category: "Arquitectura"
order: 2
question: "¿Qué son los microservicios?"
related: ["monolito", "api", "escalabilidad"]
---

## ¿Qué son los microservicios?

Los **microservicios** (o simplemente "servicios") son una forma de construir software donde, en lugar de tener todo en un [monolito](/monolito), dividís la aplicación en piezas independientes. Cada servicio se encarga de una cosa específica: uno maneja usuarios, otro maneja pagos, otro maneja notificaciones. Cada servicio tiene su propio código, su propia [base de datos](/base-de-datos) y se puede desplegar de forma independiente.

## ¿Cómo se comunican los servicios?

Si cada servicio es independiente, necesitan una forma de hablar entre sí. Las más comunes son:

- **APIs REST**: un servicio llama al otro usando [requests HTTP](/request-response), como si fuera un cliente cualquiera consultando una [API](/api).
- **Mensajería asíncrona**: un servicio publica un mensaje en una cola (como RabbitMQ o Kafka) y otro servicio lo consume cuando puede. Esto desacopla los servicios (no dependen directamente uno del otro) y es más resistente a fallos.
- **gRPC**: un protocolo más eficiente que REST, ideal para comunicación interna entre servicios donde la velocidad importa.

```text
Example microservices architecture:

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Users      │     │   Orders     │     │   Payments   │
│   Service    │────▶│   Service    │────▶│   Service    │
│  (Node.js)   │     │  (Python)    │     │  (Go)        │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
   ┌───▼───┐           ┌───▼───┐           ┌───▼───┐
   │  DB   │           │  DB   │           │  DB   │
   │ Users │           │Orders │           │Payments│
   └───────┘           └───────┘           └───────┘
```

## Ventajas de los microservicios

- **Escalabilidad granular**: si el servicio de pagos necesita más capacidad, escalás solo ese servicio sin tocar el resto.
- **Independencia de equipos**: cada equipo puede trabajar en su servicio sin pisar al otro. Pueden usar distintos lenguajes y tecnologías.
- **Deploys independientes**: podés actualizar un servicio sin redespliegar toda la app.
- **Resiliencia**: si un servicio se cae, los demás pueden seguir funcionando (si están bien diseñados).

## Los trade-offs (lo que nadie te cuenta al principio)

Los microservicios resuelven algunos problemas pero crean otros:

- **Complejidad operacional**: en lugar de un deploy tenés diez. Necesitás orquestación, monitoreo, logging centralizado.
- **Comunicación en red**: los llamados entre servicios pueden fallar, ser lentos o llegar desordenados. Tenés que manejar reintentos, timeouts y errores.
- **Consistencia de datos**: si cada servicio tiene su base de datos, mantener los datos sincronizados es un desafío importante.
- **Debugging difícil**: un bug puede involucrar a tres servicios y hay que rastrear el flujo a través de todos ellos.

## ¿Cuándo conviene usar microservicios?

La regla general es: empezá con un [monolito](/monolito) y migrá a servicios cuando el dolor lo justifique. Los microservicios tienen sentido cuando:

- Tu equipo creció lo suficiente como para que trabajar en el mismo código base sea un cuello de botella.
- Necesitás escalar partes específicas de la app de forma independiente.
- Distintas partes tienen requisitos técnicos muy diferentes.

Si sos un equipo de 3 personas, probablemente no necesitás microservicios. Si sos un equipo de 30, probablemente sí.
