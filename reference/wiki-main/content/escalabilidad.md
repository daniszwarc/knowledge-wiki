---
title: "Escalabilidad"
description: "La escalabilidad es la capacidad de una aplicación para manejar más carga de trabajo sin perder rendimiento."
category: "Infraestructura"
order: 3
question: "¿Cómo crece una app?"
related: ["servidores", "cache", "base-de-datos"]
---

## ¿Qué es la escalabilidad?

La escalabilidad es la capacidad de tu aplicación de manejar más usuarios, más datos o más tráfico sin caerse ni volverse lenta. Cuando tu app tiene 100 usuarios todo anda perfecto, pero ¿qué pasa cuando tiene 100.000? Si la aplicación está bien diseñada para escalar, sigue funcionando. Si no, se cae o se vuelve inutilizable.

## Escalado vertical vs. horizontal

Hay dos formas fundamentales de escalar:

### Escalado vertical (scale up)
Le ponés más potencia a la misma máquina: más RAM, mejor procesador, más disco. Es como cambiarle el motor a un auto. Es simple pero tiene un límite físico (no podés ponerle infinita RAM a un [servidor](/servidores)) y si esa máquina se cae, se cae todo.

### Escalado horizontal (scale out)
Agregás más máquinas que compartan la carga. En vez de un auto con un motor gigante, tenés una flota de autos. Es más complejo de implementar pero mucho más flexible y resiliente.

```
Vertical:    [Large Server]  ← add more RAM/CPU

Horizontal:  [Server 1]  [Server 2]  [Server 3]
                    │             │             │
                    └─────────────┼─────────────┘
                                  │
                         [Load Balancer]
                                  │
                              Users
```

## Load balancers

Cuando tenés múltiples servidores, necesitás algo que distribuya el tráfico entre ellos. Eso es un **load balancer** (balanceador de carga). Recibe todos los pedidos de los usuarios y los reparte entre los servidores disponibles. Si un servidor se cae, el load balancer deja de mandarle tráfico. Herramientas como Nginx, HAProxy o los load balancers de los proveedores cloud cumplen esta función.

## Auto-scaling

El **auto-scaling** lleva la escalabilidad horizontal un paso más allá: el sistema detecta cuánta carga hay y agrega o quita servidores automáticamente. Si es de noche y hay poco tráfico, baja a 2 servidores. Si es la hora pico, sube a 10. Esto optimiza costos porque solo pagás por lo que usás. Los proveedores cloud como AWS tienen esto integrado.

## Cuellos de botella comunes

Escalar no es solo agregar servidores. Hay que identificar los **cuellos de botella** (bottlenecks):

- **Base de datos:** Suele ser el primer cuello de botella. Podés agregar 20 servidores de aplicación, pero si todos le pegan a la misma [base de datos](/base-de-datos) y esta no da abasto, no escalaste nada. Soluciones: réplicas de lectura (copias de la base solo para consultas), sharding (dividir los datos entre varias bases), [cache](/cache).
- **Operaciones costosas:** Procesos que tardan mucho bloquean recursos. Solución: moverlos a colas de tareas asíncronas.
- **Red:** La latencia entre servicios suma. Solución: acercar los servicios entre sí o usar CDNs para contenido estático.

Diseñar para escalar desde el principio es más fácil que intentar adaptar después una aplicación que no fue pensada para crecer.
