---
title: "Facturación"
description: "La facturación es el proceso de generar comprobantes de pago (facturas) que documentan las transacciones entre tu app y los usuarios."
category: "Pagos"
order: 4
question: "¿Cómo se generan facturas?"
related: ["pagos-unicos", "suscripciones", "integraciones"]
---

## ¿Qué es la facturación en una app?

La facturación es el proceso de generar documentos formales (facturas) que detallan qué se cobró, cuánto, a quién y cuándo. No es solo una formalidad: en la mayoría de los países es un **requisito legal**. Si tu app cobra por [pagos únicos](/pagos-unicos) o [suscripciones](/suscripciones), necesitás emitir comprobantes válidos. Además, tus usuarios (especialmente empresas) necesitan esas facturas para su contabilidad.

## Ciclos de facturación

Un ciclo de facturación define cada cuánto se genera una factura. Para pagos únicos es simple: se genera una factura por cada compra. Para suscripciones, generalmente se genera una factura al inicio de cada período (mensual, anual, etc.). Las pasarelas de pago como Stripe pueden generar estas facturas automáticamente, pero si operás en Argentina u otros países de Latinoamérica, probablemente necesites generar factura electrónica a través del sistema tributario local (como AFIP en Argentina).

```
Monthly billing cycle:
  March 1  -> Invoice #001 - Pro Plan - $5000
  April 1  -> Invoice #002 - Pro Plan - $5000
  May 1    -> Invoice #003 - Pro Plan - $5000
```

## Impuestos y cálculos

Uno de los aspectos más complicados de la facturación es el manejo de **impuestos**. Dependiendo del país, tenés que calcular IVA, retenciones, percepciones y otros tributos. El precio que le mostrás al usuario puede ser con impuestos incluidos o sin ellos, y eso cambia según la región. Muchas pasarelas de pago ofrecen herramientas para calcular impuestos automáticamente (como Stripe Tax), pero para mercados específicos como Argentina, probablemente necesites [integraciones](/integraciones) con servicios locales.

```javascript
// lib/invoice.js — utility used in Next.js API routes
export function calculateInvoice(subtotal, vatRate = 0.21) {
  const vat = subtotal * vatRate;
  const total = subtotal + vat;

  return {
    subtotal,             // $5000
    vat,                  // $1050
    total,                // $6050
    vatRate: '21%',
    currency: 'ARS',
  };
}
```

## Generación automática de facturas

En un sistema bien armado, las facturas se generan automáticamente cuando ocurre un cobro. El flujo típico es:

1. La pasarela de pagos cobra.
2. Te avisa por [webhook](/webhooks) que el pago fue exitoso.
3. Tu servidor genera la factura con todos los datos (emisor, receptor, montos, impuestos, fecha) y la almacena.
4. Se la enviás al usuario por email o la dejás disponible en un panel dentro de tu app.

Herramientas como Stripe Billing o servicios de facturación electrónica te simplifican mucho este proceso.

## Requisitos legales

Cada país tiene sus propias reglas sobre facturación. En Argentina, por ejemplo, necesitás emitir facturas electrónicas a través de AFIP y clasificarlas como A, B o C según el tipo de cliente. En otros países de la región hay sistemas similares.

Es importante que investigues los requisitos de tu mercado desde el principio, porque adaptarlo después es mucho más costoso. Muchas startups arrancan usando servicios de facturación de terceros que se encargan de cumplir con la normativa local, y es una buena estrategia para no reinventar la rueda.
