---
title: "CDN"
description: "Una red de servidores distribuidos que acelera la entrega de archivos a usuarios en todo el mundo"
category: "Archivos"
order: 3
question: "¿Cómo se entregan archivos rápido en todo el mundo?"
related: ["almacenamiento-de-archivos", "cache", "servidores"]
---

Un **CDN** (Content Delivery Network, o Red de Distribución de Contenido) es un grupo de [servidores](/servidores) repartidos por todo el mundo que guardan copias de tus archivos para entregarlos más rápido a los usuarios. En lugar de que todos los pedidos vayan a un único servidor en, digamos, Virginia (EE.UU.), el CDN hace que un usuario en Buenos Aires reciba los archivos desde un servidor en São Paulo, que está mucho más cerca.

## El problema que resuelve

Imaginá que tu aplicación tiene el servidor principal en Estados Unidos. Cuando un usuario en Argentina pide una imagen, esa petición tiene que viajar miles de kilómetros, ida y vuelta. Eso agrega **latencia** (demora). Para una imagen no se nota tanto, pero cuando tu página tiene decenas de archivos (CSS, JavaScript, imágenes, fuentes), esos milisegundos se suman y la experiencia se vuelve lenta.

El CDN resuelve esto poniendo copias de tus archivos en **servidores edge** (de borde) ubicados en muchas ciudades del mundo. La primera vez que alguien pide un archivo, el CDN lo busca en tu [almacenamiento](/almacenamiento-de-archivos) original (el **origen**), lo guarda en su caché, y a partir de ahí lo sirve desde el servidor más cercano al usuario.

## Cómo funciona

```
Without CDN:
User (Buenos Aires) ──────────────────→ Server (Virginia)
                     ~150ms latency

With CDN:
User (Buenos Aires) ───→ Edge Server (São Paulo) ···→ Server (Virginia)
                     ~20ms              only if the file is not cached
```

El CDN funciona como un [caché](/cache) distribuido geográficamente. La primera petición puede ser un poco más lenta (porque el edge server tiene que buscar el archivo en el origen), pero todas las peticiones siguientes desde esa región son ultra rápidas.

## CDNs populares

- **Cloudflare**: uno de los más usados, con un plan gratuito muy generoso. Además de CDN, ofrece protección contra ataques DDoS (cuando miles de computadoras atacan tu servidor al mismo tiempo para tirarlo abajo)
- **Amazon CloudFront**: se integra directamente con S3 y otros servicios de AWS
- **Fastly**: conocido por su velocidad y capacidad de invalidar caché casi al instante
- **Vercel Edge Network**: si usás Vercel para deployar tu app, ya tenés CDN incluido

## Qué conviene servir por CDN

No todo necesita pasar por un CDN. Es especialmente útil para contenido **estático** que no cambia frecuentemente:

- Imágenes, videos y archivos de audio
- Archivos CSS y JavaScript
- Fuentes tipográficas
- PDFs y documentos públicos

Para contenido dinámico (respuestas de una [API](/api) que cambian según el usuario), generalmente no se usa CDN, aunque algunos CDNs modernos permiten cachear incluso respuestas de API con reglas específicas.

## Configuración básica

Para usar un CDN, generalmente configurás un **dominio** que apunte al CDN en lugar de directamente a tu [almacenamiento de archivos](/almacenamiento-de-archivos). En vez de que tus imágenes se carguen desde `mi-bucket.s3.amazonaws.com`, las cargás desde `assets.mi-app.com`, que pasa por el CDN.
