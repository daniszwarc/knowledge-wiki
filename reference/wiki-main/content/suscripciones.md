---
title: "Suscripciones"
description: "Las suscripciones permiten cobrarle al usuario de forma recurrente, generalmente mes a mes, a cambio de acceso continuo a un servicio."
category: "Pagos"
order: 2
question: "¿Cómo cobra una app mes a mes?"
related: ["pagos-unicos", "creditos", "webhooks"]
---

## ¿Qué es una suscripción?

Una suscripción es un modelo de pago donde el usuario paga de forma periódica (mensual, anual, etc.) para mantener acceso a un servicio. Pensá en Netflix, Spotify o cualquier SaaS (Software as a Service, o sea software que se paga como servicio) que uses: pagás todos los meses y mientras tu suscripción esté activa, podés usar el producto. Es el modelo de monetización más popular en el software moderno porque genera ingresos predecibles y recurrentes.

## Planes y períodos de prueba

La mayoría de las apps con suscripciones ofrecen diferentes **planes** (free, básico, pro, enterprise) con distintos niveles de funcionalidad. Es muy común también ofrecer un **período de prueba** (trial) donde el usuario puede usar el plan pago gratis durante 7 o 14 días. La idea es que pruebe el producto antes de comprometerse. Cuando termina el trial, se le cobra automáticamente o se le degrada al plan gratuito.

```javascript
// Example: create a subscription with Stripe
const subscription = await stripe.subscriptions.create({
  customer: 'cus_abc123',
  items: [{ price: 'price_plan_pro_monthly' }],
  trial_period_days: 14, // 14 days free trial
  payment_behavior: 'default_incomplete',
  expand: ['latest_invoice.payment_intent'],
});
```

## ¿Cómo funciona el cobro recurrente?

Cuando un usuario se suscribe, la pasarela de pagos (como Stripe o MercadoPago) guarda los datos de pago y se encarga de cobrar automáticamente en cada ciclo. Tu aplicación no necesita hacer nada manualmente. Lo que sí necesitás es escuchar los eventos que la pasarela te manda a través de [webhooks](/webhooks) para saber si un pago fue exitoso, si falló, o si el usuario canceló. Basándote en esos eventos, actualizás el estado de la cuenta del usuario en tu sistema.

```
Payment gateway:
  - Day 1: Charges $5000 -> Webhook: "payment_succeeded"
  - Day 30: Charges $5000 -> Webhook: "payment_succeeded"
  - Day 60: Charge fails -> Webhook: "payment_failed"
  - Automatic retries...
```

## Cancelación y gestión

Un buen sistema de suscripciones tiene que manejar varias situaciones:

- El usuario quiere cancelar.
- Quiere cambiar de plan (upgrade/downgrade).
- Su tarjeta venció o el pago fue rechazado.

Generalmente cuando un usuario cancela, se le permite usar el servicio hasta el final del período ya pagado. Las pasarelas de pago manejan gran parte de esta lógica, pero vos tenés que reflejar esos cambios en tu [base de datos](/base-de-datos) y en la experiencia del usuario.

## Suscripciones vs. otros modelos

Las suscripciones son geniales para servicios que el usuario usa continuamente. Pero no son el único modelo. Si tu app tiene un consumo variable (por ejemplo, una API que se usa más algunos meses que otros), quizás te convenga un sistema de [créditos](/creditos). Y para productos que se compran una sola vez, los [pagos únicos](/pagos-unicos) son más apropiados. Muchas plataformas modernas combinan suscripciones con créditos: pagás un plan base y si necesitás más, comprás créditos adicionales.
