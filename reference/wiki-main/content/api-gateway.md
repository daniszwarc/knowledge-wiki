---
title: "API Gateway"
description: "Un punto de entrada único que gestiona todas las peticiones a los distintos servicios de una aplicación."
category: "Arquitectura"
icon: "layers"
order: 6
question: "¿Cómo se unifica el acceso a múltiples servicios?"
related: ["microservicios", "api", "load-balancer", "autenticacion"]
---

## ¿Qué es un API Gateway?

Un **API Gateway** es un servidor que actúa como punto de entrada único para todas las peticiones de los clientes hacia tus [microservicios](/microservicios). En vez de que el frontend tenga que saber la dirección de cada servicio y hablar con cada uno por separado, le habla a un solo lugar: el gateway. Este se encarga de redirigir cada petición al servicio correcto.

## ¿Por qué necesitás un gateway?

Sin un gateway, el cliente necesita conocer cada servicio:

```
Without API Gateway:                With API Gateway:

Client → Auth Service               Client → API Gateway → Auth Service
Client → Users Service                                   → Users Service
Client → Products Service                                → Products Service
Client → Orders Service                                  → Orders Service
```

Imaginá una app móvil que necesita datos de usuarios, productos y pedidos. Sin gateway, haría tres requests a tres URLs distintas. Con gateway, hace todo a través de `api.miapp.com` y el gateway resuelve el ruteo internamente.

## Responsabilidades del gateway

Un API Gateway no solo rutea peticiones. Suele encargarse de varias cosas más:

- **Ruteo**: dirige `/api/users/*` al servicio de usuarios, `/api/orders/*` al de pedidos.
- **Autenticación**: verifica el token de [autenticación](/autenticacion) una sola vez en el gateway, en vez de que cada servicio lo haga por separado.
- **Rate limiting**: limita la cantidad de requests por cliente para proteger los servicios.
- **Logging y métricas**: registra todas las peticiones en un punto centralizado.
- **Transformación**: puede combinar respuestas de varios servicios en una sola, o adaptar el formato.
- **SSL termination**: maneja la conexión segura (HTTPS) en el gateway y usa HTTP simple internamente entre servicios, simplificando la configuración.

```nginx
# Simplified routing example with nginx as gateway
server {
    listen 443 ssl;
    server_name api.myapp.com;

    location /api/users/ {
        proxy_pass http://users-service:3001;
    }

    location /api/orders/ {
        proxy_pass http://orders-service:3002;
    }

    location /api/products/ {
        proxy_pass http://products-service:3003;
    }
}
```

## Opciones populares

- **nginx / OpenResty**: liviano, rápido, muy usado como reverse proxy (un intermediario que recibe las peticiones y las reenvía al servicio correcto) y gateway.
- **Kong**: gateway open source basado en nginx, con plugins para auth, rate limiting, logging.
- **AWS API Gateway**: servicio managed de Amazon, ideal si ya estás en AWS.
- **Traefik**: se integra muy bien con contenedores y Kubernetes.
- **Express Gateway**: basado en Node.js, fácil de extender si tu stack es JavaScript.

## El patrón BFF (Backend for Frontend)

Un patrón interesante es el **BFF** (Backend for Frontend): en vez de tener un solo gateway genérico, tenés uno específico por tipo de cliente. Un BFF para la app móvil que devuelve respuestas livianas (con menos datos), otro para la web que incluye más información. Cada BFF conoce las necesidades de su cliente y adapta las respuestas de los [servicios](/servicios) internos.

El API Gateway es una pieza clave en una arquitectura de microservicios. Simplifica la vida del frontend, centraliza preocupaciones transversales como [autenticación](/autenticacion) y logging, y te da un punto de control sobre todo el tráfico que entra a tu sistema. Pero no abuses: mantené el gateway liviano y evitá meter lógica de negocio ahí. Su trabajo es dirigir tráfico, no procesarlo.
