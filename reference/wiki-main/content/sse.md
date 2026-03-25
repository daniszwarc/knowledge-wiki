---
title: "SSE (Server-Sent Events)"
description: "Un mecanismo para que el servidor envíe actualizaciones al cliente en tiempo real a través de HTTP."
category: "Comunicación"
order: 7
question: "¿Cómo puede el servidor enviar datos sin que se los pidan?"
related: ["websockets", "streaming", "eventos", "api"]
---

Los **Server-Sent Events (SSE)** son una tecnología del navegador que permite al servidor enviar datos al cliente de forma continua sobre una conexión HTTP estándar. A diferencia de los [WebSockets](/websockets), la comunicación es **unidireccional**: solo va del servidor al cliente. Si alguna vez usaste ChatGPT y viste cómo la respuesta aparece palabra por palabra, eso es SSE en acción.

## ¿Cómo funciona?

El cliente abre una conexión HTTP normal usando la API `EventSource` del navegador, y el servidor mantiene esa conexión abierta. Cada vez que el servidor tiene datos nuevos, los envía como un "evento" a través de esa misma conexión. Si la conexión se corta, el navegador la reconecta automáticamente.

```
SSE:
Client ──opens connection──→ Server
Client ←── event: breaking news
Client ←── event: user connected
Client ←── event: price update
// The connection stays open, the server keeps sending
```

## La API EventSource

Usar SSE desde el navegador es muy simple gracias a la API nativa `EventSource`:

```javascript
// Client (browser)
const source = new EventSource('/api/updates');

// Listen to all messages
source.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('New data:', data);
};

// Listen to events with a specific name
source.addEventListener('notification', (event) => {
  const notif = JSON.parse(event.data);
  showNotification(notif.title, notif.message);
});

// Handle errors and reconnection
source.onerror = (error) => {
  console.log('Connection error, reconnecting...');
};
```

Fijáte que no necesitás instalar ninguna librería. `EventSource` viene incorporado en todos los navegadores modernos.

## Servidor en Node.js

El servidor simplemente mantiene la conexión abierta y escribe [eventos](/eventos) cuando tiene datos nuevos:

```javascript
// pages/api/updates.js — Next.js API route for SSE
export default function handler(req, res) {
  // Required headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send a simple event
  res.write('data: {"message": "Connection established"}\n\n');

  // Send a named event
  res.write('event: notification\n');
  res.write('data: {"title": "Welcome", "message": "You are connected"}\n\n');

  // Send periodic updates
  const interval = setInterval(() => {
    const data = { time: new Date().toISOString(), value: Math.random() };
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }, 3000);

  // Clean up when the client disconnects
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
}
```

Cada mensaje sigue un formato simple: `data:` seguido del contenido y dos saltos de línea (`\n\n`) para marcar el fin del evento.

## Casos de uso ideales

- **Respuestas de IA en [streaming](/streaming)**: mostrar tokens a medida que el modelo genera texto
- **Notificaciones en tiempo real**: nuevos mensajes, alertas del sistema
- **Feeds en vivo**: actualizaciones de precios, resultados deportivos
- **Progreso de tareas**: mostrar el avance de una exportación o procesamiento

## SSE vs WebSockets: cuándo usar cada uno

| Aspecto | SSE | [WebSockets](/websockets) |
|---------|-----|-----------|
| Dirección | Servidor → Cliente | Bidireccional |
| Protocolo | HTTP estándar | Protocolo propio (ws://) |
| Reconexión | Automática | Manual |
| Formato | Texto | Texto y binario |
| Complejidad | Baja | Media-alta |
| Uso típico | Feeds, notificaciones, IA | Chat, colaboración, juegos |

Si solo necesitás que el servidor le mande datos al cliente, usá SSE. Es más simple, funciona sobre HTTP estándar, y el navegador maneja la reconexión por vos. Si necesitás comunicación en ambas direcciones, ahí sí necesitás [WebSockets](/websockets). Para la mayoría de los casos de [streaming](/streaming) del servidor al cliente, SSE es la opción más práctica.
