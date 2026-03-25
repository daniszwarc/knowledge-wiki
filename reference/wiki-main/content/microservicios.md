---
title: "Microservicios"
description: "Un patrón de arquitectura donde la aplicación se divide en servicios pequeños e independientes."
category: "Arquitectura"
order: 5
question: "¿Cómo se divide una app en servicios independientes?"
related: ["monolito", "servicios", "api", "contenedores"]
---

## ¿Qué son los microservicios?

Los **microservicios** son un patrón de arquitectura donde tu aplicación se divide en múltiples [servicios](/servicios) pequeños e independientes, cada uno responsable de una parte específica del negocio. En vez de tener un solo [monolito](/monolito) que hace todo, tenés un servicio de usuarios, otro de pagos, otro de notificaciones, etc. Cada servicio se desarrolla, despliega y escala de forma independiente.

## Monolito vs. microservicios

|  | Monolito | Microservicios |
|---|---|---|
| **Estructura** | Todo junto: Auth, Users, Products, Orders, Payments, Notifications | Cada módulo es un servicio separado: Auth Service, Users Service, Orders Service, etc. |
| **Deploys** | 1 solo deploy | N deploys independientes |
| **Base de datos** | 1 base de datos compartida | Cada servicio con su propia DB |
| **Escalabilidad** | Se escala todo junto | Se escala cada servicio por separado |

La diferencia fundamental es que en microservicios, cada servicio es un programa independiente con su propia base de datos. No comparten datos directamente: se comunican entre sí a través de [APIs](/api) o mensajes.

## Comunicación entre servicios

Los microservicios necesitan hablar entre ellos, y hay varias formas de hacerlo:

- **HTTP/REST**: el servicio A le hace un request HTTP al servicio B. Simple y directo, pero sincrónico.
- **gRPC**: similar a HTTP pero más eficiente, usa Protocol Buffers (un formato binario más compacto que JSON) en vez de JSON. Ideal para comunicación interna de alta frecuencia.
- **Colas de mensajes**: el servicio A publica un mensaje en una cola (RabbitMQ, Kafka, SQS) y el servicio B lo consume cuando puede. Es asincrónico y desacopla los servicios.

```javascript
// Orders service calls the Payments service via HTTP
const response = await fetch('http://payments-service:3001/api/charge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: order.id,
    amount: order.total,
    currency: 'ARS',
  }),
});
```

## Ventajas

- **Escalabilidad granular**: si el servicio de búsqueda recibe mucho tráfico, escalás solo ese servicio sin tocar el resto.
- **Independencia tecnológica**: cada servicio puede usar el lenguaje o la base de datos que más le convenga. El servicio de search puede usar Elasticsearch mientras que el de usuarios usa PostgreSQL.
- **Deploys independientes**: un equipo puede desplegar su servicio sin coordinar con otros equipos.
- **Resiliencia**: si un servicio se cae, los demás pueden seguir funcionando (si están bien diseñados).

## Desventajas

- **Complejidad operativa**: en vez de un deploy, tenés veinte. Necesitás orquestación (coordinar todos esos servicios), monitoreo, logging distribuido.
- **Sistemas distribuidos**: los problemas de red, latencia (el tiempo que tarda una respuesta) y consistencia de datos son reales y difíciles de manejar.
- **Debugging complicado**: un request puede pasar por cinco servicios antes de fallar.
- **Overhead de comunicación**: la comunicación por red es más lenta que una llamada a función dentro del mismo proceso.

## ¿Cuándo usar microservicios?

No empieces con microservicios. Empezá con un [monolito](/monolito) bien estructurado y migrá cuando el equipo crezca y los límites entre módulos estén claros. Los microservicios resuelven problemas de escala organizacional (muchos equipos trabajando en paralelo) tanto como problemas de escala técnica. Si tu equipo tiene menos de 10 personas, probablemente no los necesités.
