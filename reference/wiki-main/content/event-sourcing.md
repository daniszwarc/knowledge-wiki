---
title: "Event sourcing"
description: "Un patrón donde cada cambio en la aplicación se registra como un evento inmutable."
category: "Arquitectura"
order: 7
question: "¿Cómo se registra todo lo que pasa en una app?"
related: ["eventos", "base-de-datos", "logs"]
---

## ¿Qué es event sourcing?

**Event sourcing** es un patrón de arquitectura donde, en vez de guardar el estado actual de las cosas en la [base de datos](/base-de-datos), guardás la secuencia de [eventos](/eventos) que llevaron a ese estado. En lugar de almacenar "el saldo de la cuenta es $50.000", almacenás todos los movimientos: "depósito de $100.000", "retiro de $30.000", "transferencia de $20.000". El estado actual se reconstruye reproduciendo los eventos en orden.

## La analogía de la cuenta bancaria

Pensá en tu extracto bancario. El banco no guarda solo tu saldo actual: guarda cada transacción que hiciste. Si querés saber tu saldo, sumás todos los depósitos y restás todos los retiros desde el inicio.

```
Event 1: AccountCreated      → balance: $0
Event 2: DepositMade         → +$100,000 → balance: $100,000
Event 3: WithdrawalMade      → -$30,000  → balance: $70,000
Event 4: TransferSent        → -$20,000  → balance: $50,000

Current state (calculated): balance = $50,000
```

La ventaja es que tenés un historial completo. Sabés exactamente cómo llegaste al estado actual, y podés reconstruir el estado en cualquier punto del pasado.

## El event log

El corazón de event sourcing es el **event log**: una lista ordenada e inmutable de eventos. Cada evento tiene un timestamp, un tipo, y los datos relevantes.

```javascript
// Example of events in an order system
const events = [
  { id: 1, type: 'OrderCreated', data: { orderId: 'abc', items: [...], total: 5000 }, timestamp: '2024-01-15T10:30:00Z' },
  { id: 2, type: 'PaymentReceived', data: { orderId: 'abc', amount: 5000 }, timestamp: '2024-01-15T10:31:00Z' },
  { id: 3, type: 'OrderShipped', data: { orderId: 'abc', trackingCode: 'XY123' }, timestamp: '2024-01-16T09:00:00Z' },
  { id: 4, type: 'OrderDelivered', data: { orderId: 'abc' }, timestamp: '2024-01-18T14:20:00Z' },
];
```

Los eventos son **inmutables**: una vez registrados, nunca se modifican ni se borran. Si necesitás corregir algo, agregás un nuevo evento compensatorio (como una nota de crédito en contabilidad).

## Reconstruir el estado

Para obtener el estado actual de una entidad, reproducís todos sus eventos en orden aplicando una **función reductora** (una función que toma los eventos uno por uno y va acumulando el resultado):

```javascript
function rebuildOrder(events) {
  return events.reduce((state, event) => {
    switch (event.type) {
      case 'OrderCreated':
        return { ...event.data, status: 'created' };
      case 'PaymentReceived':
        return { ...state, status: 'paid' };
      case 'OrderShipped':
        return { ...state, status: 'shipped', trackingCode: event.data.trackingCode };
      case 'OrderDelivered':
        return { ...state, status: 'delivered' };
      default:
        return state;
    }
  }, {});
}
```

## CQRS: separar lecturas y escrituras

Event sourcing se combina frecuentemente con **CQRS** (Command Query Responsibility Segregation), un patrón que separa el camino de las escrituras del camino de las lecturas. Usás el event log para registrar cambios y mantenés vistas materializadas (tablas pre-calculadas) optimizadas para las lecturas. Así no tenés que recalcular el estado desde cero cada vez que alguien hace una consulta.

## ¿Cuándo usar event sourcing?

No es para todo. Es especialmente útil cuando:

- Necesitás **auditoría completa** (finanzas, salud, compliance/cumplimiento normativo).
- Querés poder hacer **undo** o reconstruir el estado en un punto del pasado.
- Los [logs](/logs) de actividad son una parte central de tu negocio.
- Necesitás reproducir eventos para debugging o análisis.

La complejidad extra se justifica cuando el historial de cambios es tan importante como el estado actual. Si solo necesitás guardar datos y leerlos, una base de datos tradicional es más simple y suficiente.
