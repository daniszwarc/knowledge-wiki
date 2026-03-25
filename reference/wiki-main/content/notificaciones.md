---
title: "Notificaciones"
description: "Mecanismos que usa una aplicación para avisar al usuario que algo importante ocurrió"
category: "Tiempo real"
order: 4
question: "¿Cómo avisa la app algo en tiempo real?"
related: ["eventos", "websockets", "feedback"]
---

Las **notificaciones** son mensajes que tu aplicación envía al usuario para informarle que algo pasó: un pago se completó, alguien le mandó un mensaje, hay una oferta nueva, o se terminó de procesar ese reporte que pidió. Son una forma de mantener al usuario informado sin que tenga que estar mirando la pantalla todo el tiempo.

## Tipos de notificaciones

### Notificaciones in-app

Son las que aparecen dentro de la aplicación misma. La típica campanita con un número rojo que ves en redes sociales. Se implementan generalmente con [WebSockets](/websockets) para que aparezcan en tiempo real.

```javascript
// pages/api/socket.js (Next.js API Route - server side)
// The server sends the notification via WebSocket
io.emit('notification', {
  type: 'new-message',
  title: 'New message from Ana',
  text: 'Hi! Did you see the document I sent you?',
  read: false,
  timestamp: new Date()
});

// components/Notifications.jsx (client side)

import { useEffect } from 'react';
import { io } from 'socket.io-client';

export default function Notifications() {
  useEffect(() => {
    const socket = io();

    socket.on('notification', (notif) => {
      updateCounter();
      showToast(notif.title);
    });

    return () => socket.disconnect();
  }, []);
}
```

### Push notifications

Son las que aparecen en el celular o en el escritorio, incluso cuando no tenés la app abierta. En la web se implementan usando la **Push API** y **Service Workers** (scripts que corren en segundo plano en el navegador, incluso cuando la página está cerrada).

```javascript
// components/PushNotifications.jsx

import { useEffect } from 'react';

export default function PushNotifications({ vapidPublicKey }) {
  useEffect(() => {
    async function subscribeToPush() {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        // Register the service worker
        const registration = await navigator.serviceWorker.register('/sw.js');

        // Subscribe the user to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey
        });

        // Send the subscription to a Next.js API route
        await fetch('/api/push-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });
      }
    }

    subscribeToPush();
  }, [vapidPublicKey]);
}
```

### Notificaciones por email

El canal más clásico. Ideales para cosas que no son urgentes pero que el usuario necesita saber: confirmaciones de compra, resúmenes semanales, restablecimiento de contraseña. Generalmente se envían a través de [colas de tareas](/colas-de-tareas) para no bloquear el flujo principal.

### SMS y WhatsApp

Para notificaciones críticas: códigos de verificación, alertas de seguridad, confirmaciones de turnos médicos. Servicios como **Twilio** permiten enviar SMS y mensajes de WhatsApp desde tu aplicación.

## Arquitectura de un sistema de notificaciones

Un sistema de notificaciones bien diseñado tiene varios componentes:

```
Event occurs (e.g.: payment completed)
       │
       ▼
  Event system
       │
       ├──→ Channel: in-app (WebSocket)
       │
       ├──→ Channel: push notification
       │
       ├──→ Channel: email (task queue)
       │
       └──→ Channel: SMS (task queue)
```

El [evento](/eventos) dispara la notificación, y el sistema decide por qué canales enviarla según las preferencias del usuario. Algunos usuarios quieren recibir todo por email, otros prefieren solo push notifications.

## Buenas prácticas

- **No abuses**: demasiadas notificaciones hacen que el usuario las desactive todas. Enviá solo lo que realmente importa
- **Dejá que el usuario elija**: ofrecé configuración de preferencias por tipo y por canal
- **Agrupá**: si hay 20 mensajes nuevos, no mandes 20 notificaciones. Mandá una sola que diga "Tenés 20 mensajes nuevos"
- **Respetá los horarios**: no mandes push notifications a las 3 de la mañana (a menos que sea urgente)
- **Incluí acciones**: una buena notificación te deja actuar directamente desde ella ("Responder", "Ver pedido", "Marcar como leída")
