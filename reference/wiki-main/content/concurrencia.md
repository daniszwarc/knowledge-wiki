---
title: "Concurrencia"
description: "La capacidad de un programa de manejar múltiples tareas al mismo tiempo."
category: "Procesamiento"
order: 8
question: "¿Cómo se hacen varias cosas a la vez?"
related: ["procesamiento-asincrono", "workers", "escalabilidad"]
---

La **concurrencia** es la capacidad de un programa de manejar múltiples tareas al mismo tiempo. No significa necesariamente que se ejecuten en el mismo instante exacto, sino que el programa puede avanzar en varias cosas sin esperar a que una termine para empezar otra. Pensá en un mozo que atiende varias mesas: no se sienta a esperar a que una mesa termine de comer para ir a tomar el pedido de otra.

## Concurrencia vs paralelismo

Estos dos conceptos se confunden mucho, pero son distintos:

- **Concurrencia**: manejar múltiples tareas alternando entre ellas. Un solo mozo atendiendo 5 mesas.
- **Paralelismo**: ejecutar múltiples tareas literalmente al mismo tiempo. Cinco mozos, cada uno con su mesa.

```
Concurrency (1 thread, alternating):
Task A: ██░░██░░██
Task B: ░░██░░██░░

Parallelism (2 threads, simultaneous):
Thread 1 → Task A: ██████████
Thread 2 → Task B: ██████████
```

Node.js es un gran ejemplo de concurrencia sin paralelismo: tiene un solo hilo que ejecuta código, pero puede manejar miles de conexiones simultáneas gracias al **event loop** (un mecanismo que organiza y despacha tareas pendientes). ¿Cómo? Porque la mayoría del tiempo las tareas están esperando (una respuesta de la base de datos, un archivo que se lee del disco, una API externa que contesta). Mientras una tarea espera, Node atiende otra.

## El event loop de Node.js

El event loop es el corazón de la concurrencia en Node.js. Funciona así:

1. Recibe una petición
2. Si la operación es rápida (cálculos en memoria), la ejecuta al instante
3. Si la operación es lenta (I/O: leer un archivo, consultar una base de datos), la delega y sigue con la siguiente petición
4. Cuando la operación lenta termina, ejecuta el callback o resuelve la Promise

Esto hace que Node sea ideal para tareas **I/O bound** (las que pasan la mayor parte del tiempo esperando datos de afuera) pero no tan bueno para tareas **CPU bound** (cálculos pesados que necesitan mucho procesador y bloquean el hilo).

## Promise.all: concurrencia en la práctica

La forma más directa de aprovechar la concurrencia en JavaScript es con `Promise.all`. En vez de hacer peticiones una tras otra, las hacés todas a la vez:

```javascript
// ❌ Sequential: takes the sum of all requests (~3 seconds)
const users = await fetch('/api/users');          // 1s
const products = await fetch('/api/products');    // 1s
const orders = await fetch('/api/orders');        // 1s

// ✅ Concurrent: takes as long as the slowest one (~1 second)
const [users, products, orders] = await Promise.all([
  fetch('/api/users'),
  fetch('/api/products'),
  fetch('/api/orders'),
]);
```

De 3 segundos a 1 segundo, solo por lanzar las peticiones en paralelo. La diferencia es enorme en páginas que necesitan datos de múltiples fuentes.

## Race conditions: el peligro de la concurrencia

Cuando varias operaciones concurrentes acceden al mismo recurso, pueden pisarse entre sí. Esto se llama **race condition**:

```javascript
// Danger: two requests read the same balance at the same time
let balance = await getBalance(account); // Both read: $100

// Both subtract $30 thinking the balance is $100
await updateBalance(account, balance - 30); // Ends up $70 instead of $40
```

La solución pasa por usar mecanismos de **locking** (bloqueo, como poner un candado para que solo una operación acceda al recurso a la vez), transacciones en la base de datos, o diseñar las operaciones de forma **atómica** (que se ejecuten completas o no se ejecuten, sin que nada las interrumpa a mitad de camino).

## Cuándo la concurrencia ayuda

La concurrencia es tu aliada cuando las tareas son **I/O bound**: peticiones HTTP, consultas a bases de datos, lectura de archivos. Si necesitás hacer cálculos pesados de CPU, necesitás [workers](/workers) o paralelismo real. Para entender más sobre cómo gestionar operaciones que toman tiempo, mirá [procesamiento asíncrono](/procesamiento-asincrono). Y si tu app necesita manejar cada vez más carga concurrente, vas a necesitar pensar en [escalabilidad](/escalabilidad).
