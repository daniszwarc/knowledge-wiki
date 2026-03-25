---
title: "Integraciones"
description: "El proceso de conectar tu aplicación con servicios y plataformas externas para aprovechar funcionalidades que ya existen."
category: "Comunicación"
order: 4
question: "¿Cómo se conecta una app con otras?"
related: ["api", "webhooks", "apis-de-terceros"]
---

## ¿Qué son las integraciones?

Cuando desarrollás una app, no necesitás construir todo desde cero. ¿Necesitás cobrar pagos? Usás Stripe o MercadoPago. ¿Mandar emails? Usás SendGrid o Resend. ¿Autenticación con Google? Usás su SDK. A eso le llamamos **integraciones**: conectar tu aplicación con servicios externos a través de sus [APIs](/api) para sumar funcionalidades sin tener que reinventar la rueda.

## SDKs y librerías: la forma fácil de integrarse

Muchos servicios ofrecen **SDKs** (Software Development Kits), que son librerías oficiales para tu lenguaje de programación. En vez de hacer requests HTTP a mano, usás funciones ya preparadas:

```javascript
// pages/api/send-email.js

// Without SDK: you make the request yourself
export default async function handler(req, res) {
  const response = await fetch('https://api.service.com/v1/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EMAIL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: 'user@mail.com',
      subject: 'Welcome',
      body: 'Hello, thanks for signing up!'
    })
  });

  const data = await response.json();
  res.status(200).json(data);
}

// With SDK: much simpler
import { EmailClient } from 'service-sdk';

const client = new EmailClient(process.env.EMAIL_API_KEY);
await client.send({
  to: 'user@mail.com',
  subject: 'Welcome',
  body: 'Hello, thanks for signing up!'
});
```

Los SDKs manejan por vos cosas como reintentos, manejo de errores y autenticación.

## API keys: tu identificación

Para usar la mayoría de los servicios externos necesitás una **API key** (clave de API). Es como una contraseña que identifica a tu aplicación. Hay algunas reglas de oro:

- **Nunca las subas al repositorio**. Usá variables de entorno (`.env`).
- Muchos servicios tienen keys de **test** y de **producción**. Usá las de test mientras desarrollás.
- Si una key se filtra, rotala inmediatamente desde el panel del servicio.

```bash
# In your .env file (never commit it)
STRIPE_SECRET_KEY=sk_test_abc123
SENDGRID_API_KEY=SG.xyz789
```

```javascript
// In your Next.js API route (pages/api/payment.js)
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
```

## Integraciones comunes

Estas son algunas de las integraciones más frecuentes en apps modernas:

| Categoría | Servicios populares | Para qué |
|-----------|-------------------|----------|
| **Pagos** | Stripe, MercadoPago | Cobrar a usuarios |
| **Email** | SendGrid, Resend, Mailgun | Enviar correos transaccionales |
| **Auth** | Auth0, Firebase Auth, Google OAuth | Login social, gestión de usuarios |
| **Storage** | AWS S3, Cloudinary | Subir y servir archivos |
| **Analytics** | Google Analytics, Mixpanel | Medir comportamiento de usuarios |
| **Notificaciones** | Firebase Cloud Messaging, OneSignal | Push notifications |

## Buenas prácticas

Cuando integrás un servicio externo, tenés que pensar en qué pasa si ese servicio falla o se cae. Algunas prácticas recomendadas:

- Manejá los errores con gracia (mostrá un mensaje amigable al usuario).
- Implementá reintentos para operaciones importantes.
- Usá [webhooks](/webhooks) en vez de polling (estar preguntando constantemente "hay algo nuevo?") cuando sea posible.
- Abstraé la integración detrás de una interfaz propia, así si el día de mañana querés cambiar de proveedor, solo modificás un archivo en vez de tocar toda tu app.
