---
title: "Webhooks"
description: "Un mecanismo donde un servidor envía automáticamente datos a otro sistema cuando ocurre un evento, sin que el otro tenga que preguntar."
category: "Comunicación"
order: 3
question: "¿Cómo avisa un sistema a otro que algo pasó?"
related: ["api", "eventos", "integraciones"]
---

## ¿Qué es un webhook?

Imaginate que estás esperando un paquete. Tenés dos opciones: llamar a la empresa de correo cada 5 minutos para preguntar si llegó (**pull**), o dejar tu teléfono y que ellos te avisen cuando esté listo (**push**). Un webhook es justamente eso: en vez de que tu sistema pregunte constantemente "¿pasó algo?", le decís al otro sistema "avisame a esta URL cuando pase algo". Es una forma de comunicación automática entre sistemas.

## Push vs Pull: ¿cuál es la diferencia?

En el modelo tradicional de [request/response](/request-response), tu app tiene que hacer pedidos activamente para obtener información. Esto se llama **polling** y tiene un problema: gastás recursos preguntando aunque no haya nada nuevo.

Con webhooks se invierte el flujo:

| Modelo | Cómo funciona | Ejemplo |
|--------|--------------|---------|
| **Pull (polling)** | Tu app pregunta cada X segundos | "¿Hay pagos nuevos? ¿Y ahora? ¿Y ahora?" |
| **Push (webhook)** | El otro sistema te avisa | "¡Ey, acaba de entrar un pago!" |

El webhook es mucho más eficiente porque solo se ejecuta cuando realmente pasa algo.

## Ejemplos del mundo real

Los webhooks están en todos lados. Algunos casos comunes:

- **Stripe**: Cuando un cliente paga, Stripe manda un webhook a tu servidor con los datos del pago. Así podés activar la suscripción sin tener que consultar todo el tiempo.
- **GitHub**: Cuando alguien hace un push a un repositorio, GitHub puede notificar a tu servidor de CI/CD para que arranque el build automáticamente.
- **MercadoPago**: Te avisa cuando un pago se aprueba, se rechaza o se devuelve.

En todos estos casos, vos configurás una URL en el panel del servicio y ellos mandan un POST a esa URL cuando ocurre el evento.

## ¿Cómo funciona técnicamente?

Cuando configurás un webhook, básicamente estás diciendo: "Mandame un POST a `https://mi-app.com/webhooks/stripe` cuando pase X evento". El servicio externo te envía un **payload** (los datos del evento) en formato JSON:

```json
{
  "event": "payment.completed",
  "data": {
    "id": "pay_123",
    "amount": 15000,
    "currency": "ARS",
    "customer_email": "juan@mail.com"
  },
  "timestamp": "2025-03-15T14:30:00Z"
}
```

Tu servidor recibe ese payload y lo procesa. Es importante **verificar** que el webhook realmente viene del servicio esperado (muchos usan firmas o secrets) y responder con un status **200** para confirmar que lo recibiste. Si no respondés 200, la mayoría de los servicios reintentan el envío.

## Consideraciones importantes

Al trabajar con webhooks, tené en cuenta que pueden llegar duplicados (si tu servidor tardó en responder y el servicio reintentó), así que tu lógica tiene que ser **idempotente** (que procesar el mismo evento dos veces no cause problemas, como cobrar doble). También es buena práctica guardar los webhooks recibidos en tu [base de datos](/base-de-datos) para poder debuguear si algo falla. Si te interesa conectar tu app con servicios externos de forma más amplia, mirá [Integraciones](/integraciones).
