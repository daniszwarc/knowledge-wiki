---
title: "Load balancer"
description: "Un componente que distribuye el tráfico entrante entre varios servidores para evitar sobrecarga."
category: "Infraestructura"
order: 7
question: "¿Cómo se reparte el tráfico entre servidores?"
related: ["servidores", "escalabilidad", "cdn"]
---

## ¿Qué es un load balancer?

Pensá en un load balancer como un policía de tránsito en una intersección muy transitada. En vez de que todos los autos vayan por la misma calle y se genere un embotellamiento, el policía los distribuye entre varias calles para que el tráfico fluya. Un **load balancer** (balanceador de carga) hace exactamente eso con las peticiones que llegan a tu aplicación: las reparte entre varios [servidores](/servidores) para que ninguno se sature.

## ¿Por qué necesitás uno?

Un solo servidor tiene límites: puede manejar cierta cantidad de peticiones por segundo, tiene una cantidad finita de memoria y CPU. Cuando tu aplicación crece y empezás a recibir más tráfico del que un servidor puede manejar, tenés dos opciones:

- **Escalar verticalmente**: ponerle más recursos al mismo servidor (más RAM, mejor CPU). Tiene un techo.
- **Escalar horizontalmente**: agregar más servidores y repartir la carga entre ellos. Mucho más flexible.

El load balancer es la pieza clave del escalado horizontal. Sin él, no tenés forma de distribuir las peticiones entre múltiples servidores.

```
Without load balancer:
Users ──────────→ Single server (overloaded)

With load balancer:
                ┌──→ Server 1
Users ───→ LB  ├──→ Server 2
                └──→ Server 3
```

## Algoritmos de distribución

El load balancer usa distintos algoritmos para decidir a qué servidor mandar cada petición:

| Algoritmo | Cómo funciona | Cuándo usarlo |
|-----------|--------------|---------------|
| **Round Robin** | Reparte en orden: 1, 2, 3, 1, 2, 3... | Servidores iguales, peticiones similares |
| **Least Connections** | Manda al servidor con menos conexiones activas | Peticiones con tiempos de respuesta variables |
| **IP Hash** | Siempre manda al mismo servidor según la IP del usuario | Cuando necesitás que un usuario vaya siempre al mismo servidor |
| **Weighted** | Asigna más tráfico a servidores más potentes | Servidores con distintas capacidades |

## Health checks

Un buen load balancer no solo reparte tráfico, también verifica que los servidores estén vivos. Hace **health checks** periódicos (por ejemplo, un GET a `/health` cada 10 segundos) y si un servidor no responde, deja de mandarle tráfico hasta que se recupere:

```nginx
# Nginx configuration as load balancer
upstream my_app {
    server 10.0.0.1:3000;
    server 10.0.0.2:3000;
    server 10.0.0.3:3000;
}

server {
    listen 80;

    location / {
        proxy_pass http://my_app;
        proxy_next_upstream error timeout;
    }
}
```

## Herramientas populares

- **Nginx**: extremadamente popular, puede funcionar como servidor web y load balancer al mismo tiempo
- **AWS ALB (Application Load Balancer)**: servicio administrado de Amazon, ideal si estás en AWS
- **HAProxy**: open source, muy eficiente y usado en aplicaciones de alto tráfico
- **Cloudflare Load Balancing**: integrado con su [CDN](/cdn), distribuye tráfico a nivel global

El load balancer es fundamental para la [escalabilidad](/escalabilidad) de cualquier aplicación seria. Mirá cómo los [servidores](/servidores) trabajan en conjunto para manejar millones de peticiones, y cómo una [CDN](/cdn) complementa al load balancer cacheando contenido estático más cerca de los usuarios.
