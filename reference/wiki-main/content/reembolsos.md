---
title: "Reembolsos"
description: "El proceso de devolver el dinero de una transacción al comprador."
category: "Pagos"
order: 6
question: "¿Cómo se devuelve el dinero de una compra?"
related: ["pasarelas-de-pago", "facturacion", "pagos-unicos"]
---

## Qué es un reembolso

Un reembolso es la devolución del dinero de una transacción al comprador original. Cuando un usuario pide que le devuelvan lo que pagó (porque el producto no era lo que esperaba, hubo un error, o simplemente tu política lo permite), tu sistema necesita procesar esa devolución a través de la [pasarela de pago](/pasarelas-de-pago) que usaste para cobrar.

## Reembolso total vs parcial

Existen dos tipos principales de reembolso:

- **Total**: se devuelve el 100% del monto de la transacción original. Es el caso más simple.
- **Parcial**: se devuelve solo una parte del monto. Útil cuando, por ejemplo, el usuario devuelve uno de varios productos de una misma compra.

Mirá que en ambos casos el reembolso siempre está asociado a un pago original. No podés reembolsar más de lo que se cobró.

## Ejemplo con la API de Stripe

```javascript
// pages/api/refund.js — Next.js API route to process refunds with Stripe
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentIntentId, amount } = req.body;

  // Full refund (no amount) or partial refund (with amount in cents)
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    ...(amount && { amount }), // e.g. 500 = $5.00
  });

  res.status(200).json({ refund });
}
```

## Manejo en tu base de datos

Cuando procesás un reembolso, no alcanza con llamar a la API de la pasarela. También tenés que actualizar tu base de datos para reflejar el nuevo estado:

```javascript
// pages/api/orders/[id]/refund.js — Refund + update order status
import Stripe from 'stripe';
import { getOrderById, updateOrder } from '../../../../lib/orders';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { amount } = req.body;

  const order = await getOrderById(id);

  // Call the payment gateway
  const refund = await stripe.refunds.create({
    payment_intent: order.paymentIntentId,
    amount: amount,
  });

  // Update the status in your DB
  await updateOrder(id, {
    status: amount === order.total ? 'refunded' : 'partial_refund',
    refundedAmount: (order.refundedAmount || 0) + amount,
  });

  res.status(200).json({ refund });
}
```

## Notas de crédito y facturación

Cuando hacés un reembolso, generalmente necesitás emitir una **nota de crédito** que anule o ajuste la [facturación](/facturacion) original. Esto es importante tanto para tu contabilidad como para el registro del usuario.

## Chargeback vs reembolso

No confundas un reembolso con un **chargeback** (contracargo). El reembolso lo iniciás vos voluntariamente. El chargeback lo inicia el comprador directamente con su banco, y generalmente viene con una penalización para el vendedor. Por eso es mejor tener una buena política de reembolsos: si le devolvés rápido al usuario, evitás que inicie un chargeback.

## Tiempos y consideraciones

Tené en cuenta que un reembolso no es instantáneo para el usuario. Aunque la API te confirme el refund en segundos, el dinero puede tardar entre 5 y 10 días hábiles en aparecer en la cuenta del comprador, dependiendo del banco. Comunicá esto claramente para evitar reclamos.

También es buena práctica definir una **política de reembolsos** clara (por ejemplo, "hasta 30 días después de la compra") y mostrarla antes de que el usuario complete un [pago único](/pagos-unicos).
