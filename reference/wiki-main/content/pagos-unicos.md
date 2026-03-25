---
title: "Pagos únicos"
description: "Un pago único es cuando el usuario paga una sola vez por un producto o servicio, sin compromisos recurrentes."
category: "Pagos"
order: 1
question: "¿Cómo cobra una app por única vez?"
related: ["suscripciones", "api", "autenticacion"]
---

## ¿Qué es un pago único?

Un pago único es exactamente lo que suena: el usuario paga una vez y listo. No hay cobros mensuales, no hay renovaciones automáticas. Pensá en cuando comprás una app en la tienda, un curso online o un producto físico. El usuario ingresa su tarjeta, se procesa el cobro y la transacción termina ahí. Es el modelo más simple de monetización que existe en el mundo del software.

## ¿Cómo funciona por detrás?

Cuando un usuario hace clic en "Pagar", tu aplicación no se comunica directamente con el banco. En su lugar, usa una **pasarela de pagos** (payment gateway) como [Stripe](https://stripe.com) o [MercadoPago](https://mercadopago.com.ar). Estas plataformas se encargan de toda la complejidad: validar la tarjeta, comunicarse con el banco, manejar la seguridad y devolverte una respuesta de si el pago fue exitoso o no. Tu app se comunica con la pasarela a través de su [API](/api), enviando los datos del monto y recibiendo una confirmación.

```
User -> Your App -> Payment Gateway -> Bank
                 <-   Confirmation  <-
```

## El flujo de checkout

El flujo típico de un pago único tiene estos pasos:

1. El usuario elige lo que quiere comprar.
2. Se muestra un formulario de pago (generalmente provisto por la pasarela).
3. El usuario ingresa los datos de su tarjeta.
4. Tu frontend envía esos datos a la pasarela (nunca a tu servidor directamente).
5. La pasarela te devuelve un token o confirmación.
6. Tu [servidor](/servidor-backend) registra la compra en la [base de datos](/base-de-datos).

```javascript
// pages/api/checkout.js (Next.js API Route)
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'ars',
        product_data: { name: 'React Course' },
        unit_amount: 15000, // in cents
      },
      quantity: 1,
    }],
    mode: 'payment', // "payment" = one-time payment
    success_url: 'https://yourapp.com/success',
    cancel_url: 'https://yourapp.com/cancelled',
  });

  res.json({ url: session.url });
}
```

## Seguridad en los pagos

Un punto clave: **nunca almacenes datos de tarjetas en tu servidor**. Las pasarelas de pago existen justamente para que no tengas que hacerlo. Ellas cumplen con un estándar llamado **PCI DSS** que regula cómo se manejan los datos financieros. Tu app solo necesita manejar tokens que representan la transacción. Además, siempre necesitás que el usuario esté correctamente identificado mediante un sistema de [autenticación](/autenticacion) para asociar la compra a su cuenta.

## ¿Cuándo conviene usar pagos únicos?

Los pagos únicos son ideales para productos digitales que se entregan una sola vez (ebooks, plantillas, licencias perpetuas) o para compras puntuales. Si tu modelo de negocio necesita cobros recurrentes, probablemente te convenga mirar cómo funcionan las [suscripciones](/suscripciones). Muchas apps combinan ambos modelos: pagos únicos para extras y suscripciones para el acceso continuo.
