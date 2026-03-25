---
title: "Pasarelas de pago"
description: "Servicios que procesan transacciones de pago de forma segura entre compradores y vendedores."
category: "Pagos"
order: 5
question: "¿Cómo se procesan pagos en una aplicación?"
related: ["pagos-unicos", "suscripciones", "webhooks"]
---

## Qué es una pasarela de pago

Una pasarela de pago es un servicio intermediario que procesa transacciones financieras entre tu aplicación y los bancos. Pensá en ella como el "puente" que conecta al comprador con el vendedor de forma segura, sin que vos tengas que manejar datos sensibles como números de tarjeta directamente.

Cuando un usuario hace una compra en tu app, la pasarela se encarga de validar la tarjeta, comunicarse con el banco emisor, y devolverte una respuesta indicando si el pago fue aprobado o rechazado.

## Cómo funciona el flujo de pago

El flujo típico de un pago sigue estos pasos:

1. **El cliente** ingresa sus datos de pago en tu aplicación.
2. **Tu servidor** envía esos datos (o un token seguro) a la pasarela de pago.
3. **La pasarela** se comunica con el banco emisor de la tarjeta.
4. **El banco** aprueba o rechaza la transacción.
5. **La pasarela** te devuelve la respuesta, y vos actualizás el estado en tu sistema.

Este flujo es el mismo tanto para [pagos únicos](/pagos-unicos) como para [suscripciones](/suscripciones) recurrentes.

## Opciones populares

Las pasarelas más usadas en el desarrollo web son:

- **Stripe**: muy popular a nivel global, con excelente documentación y SDKs para múltiples lenguajes.
- **MercadoPago**: la opción más usada en Latinoamérica, con soporte para medios de pago locales.
- **PayPal**: ampliamente conocido, ideal para pagos internacionales.

Cada una tiene sus propias APIs y flujos, pero el concepto general es el mismo.

## PCI Compliance

Cuando manejás pagos, existe un estándar de seguridad llamado **PCI DSS** (Payment Card Industry Data Security Standard). Cumplir con PCI es obligatorio si procesás datos de tarjetas. La buena noticia es que pasarelas como Stripe te simplifican esto: en lugar de enviar el número de tarjeta a tu servidor, usás su SDK del lado del cliente para generar un **token** seguro, y ese token es lo que enviás a tu backend.

## Ejemplo de integración con Stripe

```javascript
// pages/api/create-payment.js (Next.js API Route)
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const { amount, currency = 'usd' } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount, // in cents (1000 = $10.00)
    currency: currency,
    payment_method_types: ['card'],
  });

  res.json({ clientSecret: paymentIntent.client_secret });
}
```

```javascript
// components/CheckoutForm.jsx

import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

export default function CheckoutForm({ clientSecret }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      }
    );

    if (error) {
      setError(error.message);
    } else if (paymentIntent.status === 'succeeded') {
      console.log('Payment successful');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      {error && <p>{error}</p>}
      <button type="submit">Pay</button>
    </form>
  );
}
```

## Claves de test vs producción

Todas las pasarelas te dan dos juegos de claves: **test** y **live**. Las claves de test (como `pk_test_...` y `sk_test_...` en Stripe) te permiten simular pagos sin mover dinero real. Nunca subas claves de producción a tu repositorio; usalas siempre como variables de entorno.

Cuando tu pasarela confirma un pago, normalmente te notifica a través de [webhooks](/webhooks) para que puedas actualizar el estado de la orden en tu base de datos de forma confiable.
