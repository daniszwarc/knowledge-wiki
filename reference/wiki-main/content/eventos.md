---
title: "Eventos"
description: "Señales que emite una aplicación cuando algo sucede, permitiendo que otras partes reaccionen"
category: "Tiempo real"
icon: "radio"
order: 1
question: "¿Qué es un evento en una aplicación?"
related: ["websockets", "webhooks", "triggers"]
---

Un **evento** es una señal de que algo pasó. Cuando un usuario hace clic en un botón, eso es un evento. Cuando llega un mensaje nuevo, eso es un evento. Cuando se completa una transacción de pago, eso también es un evento. La programación basada en eventos consiste en escribir código que **reaccione** a estas señales en lugar de ejecutarse secuencialmente.

## Eventos en el navegador (DOM)

Si hacés desarrollo frontend, ya trabajás con eventos todo el tiempo. El navegador emite eventos cuando el usuario interactúa con la página:

```jsx
// components/MyForm.js

export default function MyForm() {
  function handleClick(event) {
    console.log('They clicked!');
    console.log('Position X:', event.clientX);
    console.log('Position Y:', event.clientY);
  }

  function handleSubmit(event) {
    event.preventDefault(); // Prevent the page from reloading
    sendData();
  }

  return (
    <>
      {/* Listen for a click on a button */}
      <button onClick={handleClick}>Click me</button>

      {/* Listen for when a form is submitted */}
      <form onSubmit={handleSubmit}>
        <button type="submit">Send</button>
      </form>
    </>
  );
}
```

Algunos eventos del DOM más comunes: `click`, `submit`, `keydown`, `mouseover`, `scroll`, `load`, `resize`. No ejecutás estos eventos vos: el navegador los emite y tu código los escucha.

## El patrón Pub/Sub

Un patrón muy poderoso es **Pub/Sub** (Publish/Subscribe, o Publicar/Suscribir). Funciona como una radio: alguien transmite (publica) y los que están sintonizados (suscriptos) reciben el mensaje.

```javascript
// Simple event system using Node.js EventEmitter
import { EventEmitter } from 'events';

const eventBus = new EventEmitter();

// Subscribe to an event
eventBus.on('user:registered', (user) => {
  sendWelcomeEmail(user.email);
});

eventBus.on('user:registered', (user) => {
  createDefaultProfile(user.id);
});

// Publish the event (in another part of the code)
eventBus.emit('user:registered', { id: 1, email: 'ana@mail.com' });
// Both listeners are executed automatically
```

Lo interesante de Pub/Sub es que el código que publica el evento no sabe ni le importa quién lo está escuchando. Esto hace que las partes de tu aplicación estén **desacopladas**: podés agregar nuevos listeners sin tocar el código que emite el evento.

## Eventos en el servidor

En el backend, los eventos son fundamentales para manejar operaciones que tienen múltiples consecuencias. Cuando un usuario hace una compra, podrías necesitar:

1. Actualizar el stock en la [base de datos](/base-de-datos)
2. Enviar un email de confirmación
3. Notificar al vendedor
4. Actualizar las estadísticas

En vez de meter todo eso en una sola función gigante, emitís un evento `compra:realizada` y dejás que distintos módulos reaccionen de forma independiente.

## Eventos entre sistemas

Los eventos no se limitan a dentro de una aplicación. Los [WebSockets](/websockets) permiten emitir eventos en tiempo real entre el servidor y el navegador. Los webhooks permiten que servicios externos te avisen cuando algo pasa (por ejemplo, Stripe te notifica cuando un pago se completó). Todo se basa en el mismo concepto: algo pasó, alguien reacciona.
