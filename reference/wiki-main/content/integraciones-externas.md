---
title: "Integraciones externas"
description: "Las integraciones externas son las conexiones entre tu aplicación y sistemas de terceros que permiten intercambiar datos y funcionalidades."
category: "Ecosistema"
order: 2
question: "¿Cómo se conecta con sistemas externos?"
related: ["apis-de-terceros", "webhooks", "integraciones"]
---

## Conectar tu app con el mundo

Una aplicación moderna rara vez trabaja sola. Necesita conectarse con servicios de pagos, proveedores de email, plataformas de analytics, CRMs y más. Cada una de esas conexiones es una **integración externa**: un puente entre tu sistema y el de un tercero. Mientras que las [APIs de terceros](/apis-de-terceros) son el mecanismo técnico, las integraciones externas son el concepto más amplio de cómo tu app se comunica y sincroniza con otros sistemas.

## OAuth: autenticación entre servicios

Cuando tu app necesita acceder a datos de otra plataforma en nombre del usuario (por ejemplo, leer sus contactos de Google o publicar en su cuenta de Twitter), se usa **OAuth**. En vez de pedirle al usuario su contraseña de Google (mala idea), OAuth te da un **token de acceso** temporal y con permisos limitados:

```
1. Your app redirects the user to Google:
   "Do you give MyApp permission to read your contacts?"

2. The user accepts and Google redirects back to your app
   with an authorization code.

3. Your backend exchanges that code for an access_token.

4. You use the access_token to make requests to the Google API:
   GET https://people.googleapis.com/v1/people/me/connections
   Authorization: Bearer ya29.a0AfH6...
```

El usuario nunca le dio su contraseña a tu app, y puede revocar el acceso cuando quiera desde la configuración de Google.

## Sincronización de datos

Muchas integraciones necesitan mantener datos sincronizados entre sistemas. Por ejemplo, si usás un CRM como HubSpot, querés que cuando un usuario se registre en tu app, automáticamente se cree un contacto en HubSpot. Hay dos estrategias principales:

- **Push (tiempo real)**: Cada vez que algo pasa en tu sistema, mandás los datos al otro. Podés usar [webhooks](/webhooks) o llamadas directas a la API.
- **Pull (por lotes)**: Un proceso periódico (cada hora, cada día) sincroniza los datos entre ambos sistemas.

La elección depende de qué tan frescos necesitás los datos. Para pagos, necesitás tiempo real. Para reportes, un sync diario puede alcanzar.

## Manejo de errores

Las integraciones externas son una de las partes más frágiles de una aplicación porque dependés de sistemas que no controlás. El servicio externo puede caerse, cambiar su API, o simplemente responder lento. Estrategias para manejar esto:

- **Reintentos con backoff exponencial**: Si un request falla, reintentás esperando cada vez un poco más (1 segundo, luego 2, luego 4, etc.) para darle tiempo al servicio de recuperarse.
- **Circuit breaker** (interruptor de circuito): Si un servicio falla muchas veces seguidas, dejás de llamarlo por un rato para no saturarlo (ni saturarte). Cuando pasa un tiempo, probás de nuevo.
- **Colas de mensajes**: En vez de llamar a la API directamente, ponés el trabajo en una cola y un worker lo procesa. Si falla, se reintenta automáticamente.
- **Fallbacks**: Si el servicio de email falla, guardás el email pendiente y lo mandás después.

```javascript
// lib/retry.js — utility for Next.js API routes
export async function callWithRetry(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// Usage in a Next.js API route (pages/api/sync-crm.js)
import { callWithRetry } from '../../lib/retry';

export default async function handler(req, res) {
  const data = await callWithRetry(() =>
    fetch('https://api.crm.com/contacts', {
      headers: { 'Authorization': `Bearer ${process.env.CRM_API_KEY}` }
    }).then(r => r.json())
  );

  res.status(200).json(data);
}
```

## Monitoreo de integraciones

No alcanza con conectar y olvidarte. Las integraciones necesitan **monitoreo constante** para detectar problemas antes de que afecten a tus usuarios. Lo mínimo que necesitás es:

- Alertas cuando una integración falla más de N veces seguidas.
- Logs de cada request y respuesta para poder debuguear.
- Un dashboard donde puedas ver el estado de salud de cada integración.

Servicios como Datadog, Sentry o incluso un sistema propio de health checks te ayudan con esto. Si tu app depende de [integraciones](/integraciones) críticas (como pagos), un fallo silencioso puede costarte plata y usuarios.
