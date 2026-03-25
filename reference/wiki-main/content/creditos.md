---
title: "Créditos"
description: "Un sistema de créditos permite que los usuarios compren unidades de consumo por adelantado y las gasten a medida que usan el servicio."
category: "Pagos"
icon: "credit-card"
order: 3
question: "¿Cómo funciona un sistema de créditos?"
related: ["pagos-unicos", "suscripciones", "base-de-datos"]
---

## ¿Qué es un sistema de créditos?

Un sistema de créditos es como tener una billetera virtual dentro de una aplicación. El usuario compra créditos (o tokens) por adelantado y después los va gastando cada vez que usa alguna funcionalidad del servicio. Pensá en cómo funcionan las APIs de OpenAI: pagás por tokens consumidos. O en los juegos móviles donde comprás monedas para desbloquear cosas. Es un modelo de cobro basado en el uso real, no en un monto fijo mensual.

## ¿Cómo se implementa?

La implementación tiene dos partes principales. Primero, la **carga de créditos**: el usuario hace un [pago único](/pagos-unicos) para comprar un paquete de créditos que se le acreditan en su cuenta. Segundo, el **consumo**: cada vez que el usuario hace algo que tiene costo (enviar un mensaje, generar una imagen, hacer una consulta), se le descuentan créditos. Todo esto se registra en tu [base de datos](/base-de-datos), donde cada usuario tiene un saldo.

```javascript
// lib/credits.js — shared logic for credit consumption
const user = {
  id: 'usr_123',
  email: 'maria@example.com',
  credits: 500, // current balance
};

export async function consumeCredits(userId, amount, description) {
  const user = await db.users.findById(userId);

  if (user.credits < amount) {
    throw new Error('Insufficient credits');
  }

  await db.users.update(userId, {
    credits: user.credits - amount,
  });

  // Record the transaction for history
  await db.transactions.create({
    userId,
    type: 'consumption',
    amount: -amount,
    description, // e.g.: "Image generation"
    date: new Date(),
  });
}

// pages/api/consume-credits.js (Next.js API Route)
import { consumeCredits } from '../../lib/credits';

export default async function handler(req, res) {
  const { userId, amount, description } = req.body;
  try {
    await consumeCredits(userId, amount, description);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
```

## Paquetes y top-ups

Lo más común es ofrecer **paquetes** de créditos con diferentes precios, donde comprar más sale proporcionalmente más barato. Por ejemplo: 100 créditos por $1000, 500 por $4000, 1000 por $7000. También podés implementar **top-ups automáticos** (recargas automáticas): cuando el saldo baja de cierto umbral, se compran créditos automáticamente para que el usuario nunca se quede sin servicio.

```
Credit packages:
  - Basic:   100 credits  -> $1000 ($10/credit)
  - Popular: 500 credits  -> $4000 ($8/credit)
  - Pro:     1000 credits -> $7000 ($7/credit)
```

## Créditos + suscripciones

Un patrón muy usado es combinar créditos con [suscripciones](/suscripciones). El usuario paga un plan mensual que le incluye una cantidad fija de créditos por mes. Si necesita más, puede comprar créditos adicionales. Esto te da lo mejor de ambos mundos: ingresos recurrentes predecibles y la flexibilidad del cobro por uso. Muchas plataformas de IA como ChatGPT usan este modelo exacto.

## Consideraciones importantes

Cuando diseñes un sistema de créditos, tené en cuenta algunas cosas clave:

- Los créditos tienen que tener un registro de transacciones claro (como un estado de cuenta bancario) para que el usuario pueda ver en qué los gastó.
- Tenés que decidir si los créditos vencen o no.
- Definí qué pasa con los créditos no usados si el usuario pide un reembolso.
- Guardar un historial detallado de cada movimiento en tu base de datos es fundamental para resolver disputas y generar la [facturación](/facturacion) correcta.
