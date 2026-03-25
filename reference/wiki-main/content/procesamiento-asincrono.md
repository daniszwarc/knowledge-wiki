---
title: "Procesamiento asíncrono"
description: "Un modelo de ejecución donde las tareas se inician sin esperar a que las anteriores terminen"
category: "Procesamiento"
order: 2
question: "¿Cómo hace la app varias cosas a la vez?"
related: ["procesamiento-sincrono", "colas-de-tareas", "workers"]
---

El **procesamiento asíncrono** permite que tu aplicación inicie una tarea y siga haciendo otras cosas sin quedarse esperando el resultado. Es como pedir comida por delivery: hacés el pedido, seguís con tu vida, y te avisan cuando la comida llegó. No te quedás parado en la puerta esperando.

## Por qué es necesario

En el [procesamiento síncrono](/procesamiento-sincrono), si una operación tarda 30 segundos, todo se bloquea durante ese tiempo. En una aplicación web, eso significa que el servidor no puede atender otros usuarios mientras procesa una tarea pesada. El procesamiento asíncrono resuelve esto: la tarea larga se ejecuta "en segundo plano" y el servidor queda libre para seguir respondiendo otras peticiones.

## Callbacks, Promises y Async/Await

En JavaScript, el procesamiento asíncrono evolucionó mucho a lo largo del tiempo. Veamos las tres formas principales:

```javascript
// 1. Callbacks (the oldest approach)
readFile('data.txt', function(error, content) {
  if (error) console.log('Error:', error);
  console.log(content);
});
console.log('This runs BEFORE the read finishes');

// 2. Promises (more readable)
readFile('data.txt')
  .then(content => console.log(content))
  .catch(error => console.log('Error:', error));

// 3. Async/Await (the modern approach, looks synchronous but isn't)
async function process() {
  try {
    const content = await readFile('data.txt');
    console.log(content);
  } catch (error) {
    console.log('Error:', error);
  }
}
```

La versión con `async/await` es la más usada hoy porque el código se lee de arriba hacia abajo, pero por debajo sigue siendo asíncrono: mientras espera la lectura del archivo, el programa puede hacer otras cosas.

## El Event Loop

JavaScript usa un mecanismo llamado **Event Loop** (bucle de eventos) para manejar la asincronía. Funciona así:

1. El código se ejecuta línea por línea en el **call stack** (la pila donde se van apilando las funciones que se están ejecutando)
2. Cuando encuentra una operación asíncrona (como leer un archivo o llamar a una API), la "despacha" a otro lado y sigue adelante
3. Cuando esa operación termina, su callback (la función que tiene que ejecutarse con el resultado) se pone en una **cola de espera**
4. El event loop revisa esa cola y ejecuta los callbacks pendientes cuando el call stack está vacío

Esto es lo que permite que JavaScript, siendo **single-threaded** (usa un solo hilo de ejecución, o sea, solo puede hacer una cosa a la vez en su hilo principal), pueda manejar miles de operaciones concurrentes sin bloquearse.

## Ejemplos del mundo real

El procesamiento asíncrono está en todos lados:

- **Subida de archivos**: el usuario sube una foto, la app responde "recibido" y la procesa después (redimensionar, comprimir) usando [workers](/workers)
- **Envío de emails**: cuando un usuario se registra, el email de bienvenida se encola en una [cola de tareas](/colas-de-tareas) y se envía en segundo plano
- **Consultas a APIs externas**: podés hacer varias llamadas a distintas [APIs](/api) al mismo tiempo en lugar de una por una
- **Generación de reportes**: el usuario pide un reporte pesado, se procesa en el fondo y se le notifica cuando está listo

La clave es entender cuándo algo puede esperar y cuándo el usuario necesita la respuesta ya. Si la necesita ya, usás [procesamiento síncrono](/procesamiento-sincrono). Si puede esperar, lo mandás a procesar de forma asíncrona.
