---
title: "Errores y excepciones"
description: "Situaciones inesperadas que ocurren durante la ejecución de un programa y cómo manejarlas."
category: "Fundamentos"
order: 7
question: "¿Qué pasa cuando algo sale mal en el código?"
related: ["logs", "monitoreo", "testing"]
---

## ¿Qué es un error?

Un error es cualquier situación donde tu programa no puede hacer lo que le pediste. Puede ser algo tan simple como escribir mal el nombre de una variable, o algo más sutil como intentar leer un dato que no existe. Lo importante no es evitar todos los errores (imposible), sino saber manejarlos para que tu app no se caiga sin explicación.

## Tipos de errores

No todos los errores son iguales. Entender la diferencia te ayuda a saber dónde buscar cuando algo falla:

- **Errores de sintaxis:** Escribiste código que el lenguaje no entiende. Son los más fáciles de detectar porque el programa ni siquiera arranca.
- **Errores de ejecución (runtime):** El código está bien escrito pero falla al correr. Por ejemplo, intentar acceder a una propiedad de `undefined`.
- **Errores de lógica:** El programa corre sin explotar, pero hace algo incorrecto. Son los más difíciles de encontrar porque no hay ningún mensaje de error.

```javascript
// Syntax error: missing closing parenthesis
console.log("hello"

// Runtime error: cannot read .name of undefined
const user = undefined;
console.log(user.name);

// Logic error: you wanted to add but subtracted
function calculateTotal(price, tax) {
  return price - tax; // should be price + tax
}
```

## Try/catch: atrapar errores

Cuando sabés que una operación puede fallar (una llamada a una API, una lectura de archivo, una conversión de datos), la envolvés en un bloque `try/catch`. Esto evita que el error rompa toda la aplicación:

```javascript
try {
  const response = await fetch("https://api.example.com/data");
  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error("Could not fetch the data:", error.message);
  // Here you can show a message to the user or retry
}
```

El código dentro de `try` se ejecuta normalmente. Si algo falla, el flujo salta al bloque `catch` donde podés manejar el problema.

## No silencies los errores

Uno de los errores más comunes de principiantes es atrapar el error y no hacer nada con él:

```javascript
// BAD: the error disappears and you never find out
try {
  await processPayment(order);
} catch (error) {
  // silence...
}

// GOOD: at least log it
try {
  await processPayment(order);
} catch (error) {
  logger.error("Payment failed", { orderId: order.id, error: error.message });
  throw error; // re-throw if you can't resolve the problem here
}
```

Si tragás los errores en silencio, después vas a tener [bugs](/bugs) imposibles de rastrear. Siempre registrá lo que pasó en los [logs](/logs) para poder investigar después.

## Errores en producción

En producción, los errores van a pasar. Lo importante es enterarte rápido. Herramientas de [monitoreo](/monitoreo) como Sentry o Datadog capturan errores automáticamente, te muestran el stack trace (la secuencia de funciones que llevaron al error) y te notifican al instante. Combiná esto con buenos [logs](/logs) y vas a poder diagnosticar cualquier problema en minutos en vez de horas.

El [testing](/testing) es tu primera línea de defensa: cuantos más casos cubras con tests, menos errores inesperados van a llegar a producción.
