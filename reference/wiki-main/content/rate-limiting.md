---
title: "Rate limiting"
description: "Un mecanismo para limitar la cantidad de peticiones que un cliente puede hacer en un período de tiempo."
category: "Procesamiento"
order: 6
question: "¿Cómo se evita que alguien abuse de una API?"
related: ["api", "cache", "monitoreo"]
---

El **rate limiting** (limitación de tasa) es un mecanismo que controla cuántas peticiones puede hacer un cliente a tu [API](/api) en un período de tiempo determinado. Si un usuario o bot supera el límite, el servidor rechaza las peticiones extra con un error hasta que se "renueve" su cuota. Es como el cartel de "máximo 2 unidades por persona" en un supermercado: protege el recurso para que alcance para todos.

## Por qué es necesario

Sin rate limiting, tu API está expuesta a:

- **Abuso**: un bot que hace miles de peticiones por segundo, saturando tu servidor
- **Ataques de fuerza bruta**: intentar miles de contraseñas en el endpoint de login
- **Costos descontrolados**: si tu API llama a servicios externos que cobran por petición, un abuso te puede generar una factura enorme
- **Degradación del servicio**: un solo cliente acaparando todos los recursos, haciendo que el resto de los usuarios tengan una experiencia lenta

## Algoritmos comunes

Hay varias formas de implementar rate limiting. Las más usadas:

- **Ventana fija (fixed window)**: permitís X peticiones en un período fijo (ej: 100 peticiones por minuto). Simple pero tiene un problema: en el límite entre dos ventanas, alguien podría hacer 200 peticiones en 2 segundos.
- **Ventana deslizante (sliding window)**: como la ventana fija, pero el período se "desliza" con cada petición. Más preciso, más justo.
- **Token bucket (balde de fichas)**: imaginá un balde que se llena con fichas a un ritmo constante. Cada petición consume una ficha. Si el balde está vacío, se rechaza la petición. Pero si se acumularon fichas sin usar, permite pequeños "picos" de tráfico.

## HTTP 429: Too Many Requests

Cuando un cliente supera el límite, el servidor responde con status **429**. Es buena práctica incluir headers que informen al cliente sobre su cuota:

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1709312400
Retry-After: 30
```

Estos headers le dicen al cliente: "Tu límite es 100 peticiones, te quedan 0, y se reinicia en 30 segundos".

## Implementación en Next.js

En Next.js, podés implementar rate limiting en tus API routes. Acá hay un ejemplo simple usando un Map en memoria:

```javascript
// lib/rate-limit.js — Simple rate limiter for Next.js API routes
const rateLimitMap = new Map();

export default function rateLimit({ windowMs = 15 * 60 * 1000, max = 100 }) {
  return (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, { count: 1, startTime: now });
      return true; // allowed
    }

    const record = rateLimitMap.get(ip);

    if (now - record.startTime > windowMs) {
      // Window expired, reset
      rateLimitMap.set(ip, { count: 1, startTime: now });
      return true;
    }

    record.count++;
    if (record.count > max) {
      res.status(429).json({ error: 'Too many requests. Try again in a few minutes.' });
      return false; // blocked
    }

    return true; // allowed
  };
}

// pages/api/login.js — API route with stricter rate limiting
import rateLimit from '../../lib/rate-limit';

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

export default function handler(req, res) {
  if (!limiter(req, res)) return; // blocked by rate limiter

  // Login logic here...
  res.status(200).json({ message: 'Login successful' });
}
```

## Rate limiting distribuido con Redis

El ejemplo anterior funciona bien con un solo servidor, pero si tenés varios servidores (algo común al [escalar](/escalabilidad)), cada uno tendría su propio contador. Un usuario podría hacer 100 peticiones a cada servidor. Para resolver esto, usás un almacén compartido como Redis:

```javascript
// lib/rate-limit-redis.js — Distributed rate limiting with Redis
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export default function rateLimitRedis({ windowMs = 15 * 60 * 1000, max = 100 }) {
  return async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const key = `rate-limit:${ip}`;

    const current = await redis.incr(key);
    if (current === 1) {
      await redis.pexpire(key, windowMs);
    }

    if (current > max) {
      res.status(429).json({ error: 'Too many requests.' });
      return false;
    }
    return true;
  };
}
```

Así todos los servidores comparten el mismo contador. El rate limiting es una de esas cosas que conviene tener configuradas desde el principio. Si querés detectar cuándo tus límites se están alcanzando, combinalo con [monitoreo](/monitoreo). Y si muchas peticiones piden lo mismo, un buen [cache](/cache) puede reducir la carga antes de que el rate limiting entre en juego.
