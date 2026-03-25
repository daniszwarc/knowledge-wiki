---
title: "Cache"
description: "Una capa de almacenamiento temporal que guarda datos frecuentemente usados para acelerar su acceso."
category: "Datos"
order: 3
question: "¿Cómo se acelera el acceso a los datos?"
related: ["base-de-datos", "cdn", "servidores"]
---

## ¿Qué es el cache?

Imaginate que tenés una biblioteca enorme (tu [base de datos](/base-de-datos)) y cada vez que alguien te pide un libro, tenés que ir hasta el fondo a buscarlo. ¿No sería más rápido tener los libros más pedidos en un estante al lado tuyo? Eso es exactamente lo que hace el **cache**: guarda copias de datos que se piden seguido en un lugar de acceso mucho más rápido. En vez de consultar la base de datos cada vez, primero revisás el cache.

## ¿Dónde se cachea?

El cache puede existir en varias capas de tu aplicación. Cada una sirve para un propósito distinto:

| Capa | Herramienta | Qué cachea | Ejemplo |
|------|------------|------------|---------|
| **Navegador** | Cache del browser | Archivos estáticos | CSS, JavaScript, imágenes |
| **CDN** | Cloudflare, CloudFront | Contenido estático y respuestas | Páginas, imágenes optimizadas |
| **Servidor** | Redis, Memcached | Resultados de queries, sesiones | Lista de productos más vendidos |
| **Base de datos** | Query cache interno | Resultados de consultas | Queries repetidas |

## Redis: el cache más popular

**Redis** es una base de datos en memoria que se usa muchísimo como cache. Es extremadamente rápida porque guarda todo en RAM (la memoria temporal de la computadora, mucho más veloz que el disco duro) en vez de en disco:

```javascript
// lib/redis.js
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);
export default redis;

// pages/api/products/[id].js
import redis from '../../../lib/redis';
import db from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  // 1. Look up in cache
  const cached = await redis.get(`product:${id}`);
  if (cached) {
    console.log('Cache hit!');
    return res.status(200).json(JSON.parse(cached));
  }

  // 2. If not in cache, look up in the database
  console.log('Cache miss, querying DB...');
  const product = await db.query(
    'SELECT * FROM products WHERE id = $1', [id]
  );

  // 3. Store in cache for next time (expires in 5 minutes)
  await redis.set(`product:${id}`, JSON.stringify(product), 'EX', 300);

  res.status(200).json(product);
}
```

El patrón es simple: primero buscás en el cache (**cache hit**). Si no está, vas a la fuente original (**cache miss**), traés el dato y lo guardás en el cache con un tiempo de expiración.

## Cache del navegador y CDN

En el frontend, el navegador cachea automáticamente archivos estáticos usando **headers HTTP**:

```http
Cache-Control: max-age=31536000, immutable
```

Esto le dice al navegador: "Este archivo no va a cambiar por un año, no lo vuelvas a pedir". Para esto es clave usar **hashes en los nombres** de archivo (como `app.a3f2b1.js`), así cuando cambia el código, cambia el nombre y el navegador sabe que tiene que bajarlo de nuevo.

Las **CDN** (Content Delivery Networks) cachean tu contenido en servidores distribuidos por el mundo. Cuando un usuario de Argentina pide tu página, la recibe desde un servidor cercano en vez de ir hasta uno en Estados Unidos. Esto reduce la latencia enormemente.

## El problema más difícil: cache invalidation

Hay un chiste famoso en programación: "Solo hay dos cosas difíciles en ciencias de la computación: nombrar cosas y la invalidación de cache". El problema es: ¿cómo sabés cuándo el dato cacheado ya no es válido?

- **TTL (Time To Live)**: El dato expira después de X tiempo. Simple, pero puede servir datos desactualizados.
- **Invalidación manual**: Cuando actualizás un dato, borrás su entrada del cache. Más preciso, pero más complejo.
- **Write-through**: Cada vez que escribís en la base, también actualizás el cache.

```javascript
// pages/api/products/[id].js (PUT handler)
import redis from '../../../lib/redis';
import db from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    await db.query('UPDATE products SET name = $1 WHERE id = $2', [req.body.name, id]);

    // Delete from cache so the next read fetches fresh data
    await redis.del(`product:${id}`);

    return res.status(200).json({ success: true });
  }
}
```

El cache es una herramienta poderosa para mejorar el rendimiento, pero usalo con criterio. Cacheá datos que se leen mucho más de lo que se escriben. Para datos que cambian constantemente, el cache puede generar más problemas que soluciones. Si querés entender cómo organizar datos para que las búsquedas sean rápidas incluso sin cache, mirá [Indexación](/indexacion).
