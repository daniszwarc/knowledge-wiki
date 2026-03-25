---
title: "WebSockets"
description: "Un protocolo que mantiene una conexión abierta entre el cliente y el servidor para comunicación bidireccional en tiempo real"
category: "Tiempo real"
order: 2
question: "¿Cómo mantiene la app una conexión abierta?"
related: ["eventos", "streaming", "api"]
---

Los **WebSockets** son un protocolo de comunicación que permite mantener una conexión abierta y permanente entre el navegador y el servidor. A diferencia de HTTP, donde el cliente hace un pedido y el servidor responde (y ahí se cierra la conversación), con WebSockets la conexión queda abierta y ambos lados pueden enviarse mensajes en cualquier momento.

## El problema con HTTP

Con el modelo clásico de [request-response](/request-response) de HTTP, el servidor no puede mandarte datos si vos no los pediste primero. Pensalo así: es como mandar cartas por correo. Vos mandás una carta (request), esperás la respuesta (response), y si querés saber si hay novedades, tenés que mandar otra carta.

Para una app de chat, eso sería terrible. Tendrías que preguntar cada segundo: "¿Hay mensajes nuevos?" "¿Y ahora?" "¿Y ahora?". Esto se llama **polling** y es muy ineficiente.

```
Polling (HTTP):
Client: Any new messages?  → Server: No
Client: Any new messages?  → Server: No
Client: Any new messages?  → Server: Yes, here you go!
Client: Any new messages?  → Server: No
// Tons of unnecessary requests
```

## Cómo funcionan los WebSockets

Con WebSockets, el cliente y el servidor hacen un "apretón de manos" (handshake) inicial usando HTTP, y después la conexión se **upgradea** a WebSocket. A partir de ahí, la conexión queda abierta y cualquiera de los dos puede enviar mensajes cuando quiera.

```
WebSocket:
Client ←──open connection──→ Server
   │                              │
   │  "Hi, how are you?"    ───→  │
   │                              │
   │ ←── "Great! New message"     │
   │ ←── "Ana connected"          │
   │                              │
   │  "Typing..."            ───→ │
   │                              │
// The connection remains open
```

## Ejemplo con Socket.IO

**Socket.IO** es la librería más popular para trabajar con WebSockets en JavaScript. Simplifica mucho el manejo de la conexión y agrega funcionalidades como reconexión automática y salas (rooms).

```javascript
// Server (Node.js)
import { Server } from 'socket.io';

const io = new Server(3000);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Listen for an event from the client
  socket.on('new-message', (data) => {
    // Forward the message to all other users
    socket.broadcast.emit('new-message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
```

```javascript
// Client (browser)
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Send a message
socket.emit('new-message', {
  text: 'Hello everyone!',
  user: 'Carlos'
});

// Listen for messages from others
socket.on('new-message', (data) => {
  displayMessage(data.text, data.user);
});
```

## Casos de uso

Los WebSockets son ideales para cualquier funcionalidad donde necesitás actualizaciones **instantáneas**:

- **Chat en tiempo real**: mensajes que aparecen al instante
- **Colaboración en vivo**: como Google Docs, donde varios usuarios editan al mismo tiempo
- **Dashboards en vivo**: métricas y gráficos que se actualizan al instante
- **Juegos multijugador**: sincronizar las acciones de todos los jugadores
- **[Notificaciones](/notificaciones) push**: avisar al usuario de algo sin que refresque la página

No todo necesita WebSockets. Si los datos cambian cada varios minutos o el usuario puede refrescar la página, una [API](/api) HTTP clásica alcanza y sobra. Usá WebSockets cuando la latencia importa y necesitás actualizaciones instantáneas. Para enviar datos en una sola dirección (del servidor al cliente), también podés considerar [streaming](/streaming) con Server-Sent Events, que es más simple.
