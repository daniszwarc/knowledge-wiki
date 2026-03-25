---
title: "Servidores"
description: "Un servidor es una computadora que almacena y ejecuta aplicaciones para que los usuarios puedan acceder a ellas."
category: "Infraestructura"
order: 1
question: "¿Dónde vive una aplicación?"
related: ["deploy", "escalabilidad", "servidor-backend"]
---

## ¿Qué es un servidor?

Un servidor es, en esencia, una computadora que está siempre encendida y conectada a internet, esperando recibir pedidos y responderlos. Cuando abrís una página web, tu navegador le manda un pedido a un servidor y este le devuelve el HTML, CSS y JavaScript necesarios para mostrarla. El [servidor backend](/servidor-backend) es el que ejecuta la lógica de tu aplicación, pero acá nos enfocamos en la infraestructura: dónde y cómo corre esa máquina.

## Servidores físicos vs. virtuales

Hace años, tener un servidor significaba comprar una máquina física y ponerla en un data center. Hoy casi nadie hace eso para proyectos nuevos. Lo más común es usar **servidores virtuales**: máquinas que existen como software dentro de un servidor físico más grande. Un solo hardware puede correr docenas de servidores virtuales aislados entre sí.

- **VPS (Virtual Private Server):** Un servidor virtual con recursos dedicados. Proveedores como DigitalOcean, Linode o Hetzner te dan un VPS por pocos dólares al mes.
- **Instancias en la nube:** AWS (EC2), Google Cloud (Compute Engine) y Azure ofrecen servidores virtuales con configuración flexible.

## Cloud computing

Los **proveedores de nube** (AWS, Google Cloud, Azure) cambiaron completamente cómo pensamos en servidores. En vez de comprar y mantener hardware, alquilás capacidad de cómputo por hora o por segundo. Necesitás más potencia un viernes de Black Friday? Escalás (agregás más capacidad). Pasa el pico? Reducís. Esto se conecta directamente con [escalabilidad](/escalabilidad).

```
Traditional:  You buy a server → you configure it → you maintain it
Cloud:        You choose a configuration → you spin it up in minutes → you pay per use
```

## Serverless: ¿servidores sin servidores?

El modelo **serverless** no significa que no haya servidores; significa que vos no los administrás. Escribís funciones de código y el proveedor se encarga de ejecutarlas cuando llega un pedido. AWS Lambda, Vercel Functions y Cloudflare Workers son ejemplos. Es ideal para aplicaciones con tráfico variable porque no pagás cuando nadie está usando tu app.

## ¿Qué opción elegir?

La elección depende de tu proyecto y experiencia:

- **VPS:** Si querés control total y tu app tiene tráfico predecible. Buen balance entre costo y flexibilidad.
- **Plataformas gestionadas (Vercel, Railway, Fly.io):** Si querés hacer [deploy](/deploy) fácil sin preocuparte por configurar servidores. Ideal para empezar.
- **Serverless:** Si tu tráfico es muy variable o querés pagar estrictamente por uso.
- **Cloud grande (AWS/GCP/Azure):** Si necesitás una infraestructura compleja y tenés el equipo para administrarla.
