---
title: "Procesamiento síncrono"
description: "Un modelo de ejecución donde cada operación espera a que la anterior termine antes de continuar"
category: "Procesamiento"
order: 1
question: "¿Qué pasa cuando la app espera una respuesta?"
related: ["procesamiento-asincrono", "request-response", "api"]
---

El **procesamiento síncrono** es cuando tu aplicación ejecuta las tareas una por una, en orden, esperando a que cada una termine antes de pasar a la siguiente. Es como hacer fila en un banco: hasta que no terminás con el cajero, no avanzás al siguiente paso.

## Cómo funciona

En un flujo síncrono, el código se ejecuta línea por línea. Si una operación tarda (como consultar una [base de datos](/base-de-datos) o llamar a una [API](/api) externa), todo el programa se queda esperando esa respuesta. A esto se le llama **bloqueo** (blocking).

```javascript
// Example of synchronous flow (pseudocode)
const user = getUser(42);            // Waits ~50ms
const orders = getOrders(user);      // Waits ~100ms
const total = calculateTotal(orders); // Waits ~5ms
sendResponse(total);                  // Only now it responds

// Total time: ~155ms (all in series)
```

Cada línea tiene que esperar a que la anterior termine. Si `obtenerPedidos` tarda 100 milisegundos, todo el programa se queda parado esos 100 milisegundos.

## El ciclo request-response

El ejemplo más clásico de procesamiento síncrono en la web es el ciclo [request-response](/request-response): el cliente hace un pedido, el servidor lo procesa completamente, y devuelve la respuesta. El cliente queda esperando hasta que llega esa respuesta.

```
Client                     Server
   │                          │
   │── GET /api/products ───→ │
   │                          │ ← queries database
   │                          │ ← processes data
   │                          │ ← builds response
   │←── 200 OK (data) ───────│
   │                          │
```

Durante todo ese tiempo, la conexión queda abierta y el cliente espera. Si el servidor tarda mucho, el usuario ve un spinner o una pantalla en blanco.

## Cuándo es apropiado

El procesamiento síncrono es perfectamente válido para operaciones que:

- **Son rápidas** (menos de unos pocos segundos)
- **El usuario necesita el resultado inmediatamente** (como ver una lista de productos)
- **Son simples y secuenciales** (paso A, después paso B, después paso C)

Por ejemplo, obtener el perfil de un usuario, validar un formulario, o buscar productos en un catálogo son operaciones donde tiene sentido esperar la respuesta antes de continuar.

## Cuándo es un problema

El procesamiento síncrono se vuelve problemático cuando una operación tarda demasiado. Si un usuario sube un video y tu servidor intenta procesarlo de forma síncrona (convertirlo, generar thumbnails, etc.), el usuario tendría que esperar minutos sin poder hacer otra cosa. Para esos casos existe el [procesamiento asíncrono](/procesamiento-asincrono), que permite mandar la tarea a ejecutarse "en el fondo" y responderle al usuario inmediatamente.
