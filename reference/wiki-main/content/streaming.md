---
title: "Streaming"
description: "Una técnica para enviar datos de forma continua sin esperar a que todo esté listo"
category: "Tiempo real"
order: 3
question: "¿Cómo se envían datos continuamente?"
related: ["websockets", "eventos", "procesamiento-asincrono"]
---

El **streaming** es una técnica donde los datos se envían y se procesan de forma continua, en "pedacitos" (chunks), en lugar de esperar a tener todo completo antes de empezar a transmitir. Es la diferencia entre descargar una película entera antes de verla vs. verla mientras se va descargando (como en Netflix).

## El modelo tradicional vs streaming

En el modelo clásico de [request-response](/request-response), el servidor arma la respuesta completa y la envía toda de una. Esto funciona bien para respuestas chicas, pero si estás generando un reporte de 10.000 filas o una respuesta de IA que tarda 20 segundos, el usuario se queda mirando una pantalla vacía hasta que todo esté listo.

```
Without streaming:
Client: Give me the report
Server: ...(processing for 10 seconds)...
Server: Here is the ENTIRE report (10MB at once)

With streaming:
Client: Give me the report
Server: Here are the first 100 rows...
Server: ...the next 100 rows...
Server: ...the next 100 rows...
Server: Done!
```

El usuario empieza a ver datos casi inmediatamente, lo cual mejora mucho la experiencia.

## Server-Sent Events (SSE)

**Server-Sent Events** es una tecnología del navegador que permite al servidor enviar datos al cliente de forma continua sobre una conexión HTTP normal. A diferencia de los [WebSockets](/websockets), la comunicación es **unidireccional**: solo del servidor al cliente.

```javascript
// pages/api/stream-news.js — Next.js API route for SSE
export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send an event every 5 seconds
  const interval = setInterval(() => {
    const newsItem = getLatestNews();
    res.write(`data: ${JSON.stringify(newsItem)}\n\n`);
  }, 5000);

  // Clean up when the client disconnects
  req.on('close', () => clearInterval(interval));
}
```

```javascript
// Client (browser)
const source = new EventSource('/api/stream-news');

source.onmessage = (event) => {
  const newsItem = JSON.parse(event.data);
  displayNews(newsItem);
};
```

SSE es más simple que WebSockets y es ideal cuando solo necesitás que el servidor le mande datos al cliente (feeds de noticias, actualizaciones de estado, respuestas de IA token por token).

## Chunked Transfer y respuestas parciales

HTTP soporta un modo llamado **chunked transfer encoding** donde la respuesta se envía en partes. Esto es lo que usan servicios como ChatGPT para mostrarte la respuesta palabra por palabra en lugar de esperar a que se genere toda.

```
HTTP/1.1 200 OK
Transfer-Encoding: chunked

Hello,
 how
 are you?
 Let me
 tell you...
```

Cada "chunk" llega y se muestra inmediatamente, dando la sensación de que la IA está "escribiendo" en tiempo real.

## Streaming de audio y video

Cuando mirás un video en YouTube o escuchás música en Spotify, estás usando streaming de multimedia. El navegador descarga pequeños segmentos del archivo y los reproduce mientras descarga los siguientes. Por eso podés empezar a ver un video al instante sin esperar a que se descargue completo.

Los protocolos (reglas de comunicación) más comunes para streaming multimedia son **HLS** (HTTP Live Streaming) y **DASH** (Dynamic Adaptive Streaming over HTTP). Ambos dividen el video en segmentos de pocos segundos y ajustan la calidad automáticamente según tu velocidad de internet.

## Cuándo usar qué

- **SSE**: datos del servidor al cliente, conexión simple, reconexión automática. Ideal para feeds y respuestas de IA
- **[WebSockets](/websockets)**: comunicación bidireccional, baja latencia. Ideal para chat y colaboración
- **Streaming multimedia**: protocolos especializados (HLS/DASH) para audio y video
- **HTTP normal**: cuando la respuesta es chica y rápida, no necesitás streaming
