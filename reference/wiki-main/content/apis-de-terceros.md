---
title: "APIs de terceros"
description: "Las APIs de terceros son servicios externos que podés integrar en tu aplicación para sumar funcionalidades sin tener que desarrollarlas desde cero."
category: "Ecosistema"
icon: "puzzle"
order: 1
question: "¿Cómo se usan servicios de otros?"
related: ["api", "integraciones", "integraciones-externas"]
---

## No reinventes la rueda

Cuando estás construyendo una app, hay funcionalidades que no tiene sentido que desarrolles desde cero: procesar pagos, enviar emails, manejar mapas, autenticar con Google. Para eso existen las **APIs de terceros**: servicios creados por otras empresas que vos podés usar desde tu aplicación a través de su [API](/api). En vez de construir tu propio sistema de pagos (que llevaría meses y requiere certificaciones de seguridad), integrás Stripe o MercadoPago en una tarde.

## Cómo funcionan

Las APIs de terceros siguen el mismo principio que cualquier API: tu app hace [requests](/request-response) a sus endpoints y recibe respuestas. La diferencia es que el servidor no es tuyo, es de ellos. El flujo típico es:

1. **Te registrás** en la plataforma del servicio (Stripe, Twilio, OpenAI, etc.).
2. **Obtenés una API key**: Una clave secreta que identifica tu aplicación.
3. **Leés la documentación**: Cada API tiene docs que explican sus endpoints, parámetros y respuestas.
4. **Hacés requests** desde tu [backend](/servidor-backend) usando la API key.

```javascript
// pages/api/send-email.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'my-app@mydomain.com',
      to: req.body.to,
      subject: 'Welcome!',
      html: '<h1>Hello, thanks for signing up</h1>',
    }),
  });

  const data = await response.json();
  res.status(200).json(data);
}
```

## API keys y seguridad

La **API key** es como la contraseña de tu cuenta en ese servicio. Si alguien la obtiene, puede hacer requests en tu nombre (y generarte costos). Reglas básicas:

- **Nunca pongas API keys en el frontend**. El código del [cliente](/cliente-frontend) es visible para cualquiera. Las keys van en el backend o en variables de entorno.
- **Usá variables de entorno** (`.env`) para guardar las keys, y nunca las subas al repositorio de Git.
- **Rotá las keys** si sospechás que se filtraron.

```
# .env (this file should NEVER be pushed to Git)
STRIPE_SECRET_KEY=sk_live_abc123...
RESEND_API_KEY=re_987654...
OPENAI_API_KEY=sk-xyz789...
```

## Rate limits

Las APIs de terceros tienen **rate limits**: un límite de cuántos requests podés hacer en un período de tiempo. Por ejemplo, una API gratis podría dejarte hacer 100 requests por minuto. Si pasás el límite, te devuelve un error `429 Too Many Requests`. Es importante:

- Leer los límites en la documentación.
- Implementar **reintentos con backoff** (si falla, esperar un poco antes de reintentar, y cada vez esperar un poco más).
- Cachear respuestas cuando sea posible para no repetir requests innecesarios.

## APIs populares

Algunas APIs que vas a encontrar en casi cualquier proyecto:

| Servicio | Para qué | Costo |
|----------|----------|-------|
| **Stripe / MercadoPago** | Procesar pagos | Comisión por transacción |
| **Resend / SendGrid** | Enviar emails | Free tier + pago por volumen |
| **Twilio** | SMS y WhatsApp | Pago por mensaje |
| **OpenAI** | Inteligencia artificial | Pago por uso (tokens) |
| **Cloudinary** | Imágenes y video | Free tier + pago por uso |
| **Google Maps** | Mapas y geolocalización | Free tier + pago por uso |
| **Auth0 / Clerk** | [Autenticación](/autenticacion) | Free tier + pago por usuario |

La mayoría ofrecen un **free tier** (plan gratuito) generoso para que puedas desarrollar y probar sin gastar. Cuando tu app crezca, pasás a un plan pago. Esto se conecta directamente con el concepto de [integraciones externas](/integraciones-externas), donde profundizamos en cómo manejar estas conexiones de forma robusta.
