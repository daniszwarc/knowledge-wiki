---
title: "Workers"
description: "Procesos que se ejecutan en segundo plano para realizar tareas sin afectar la experiencia del usuario"
category: "Procesamiento"
order: 4
question: "¿Quién ejecuta las tareas en segundo plano?"
related: ["colas-de-tareas", "procesamiento-asincrono", "servidores"]
---

Un **worker** (trabajador) es un proceso que se ejecuta en segundo plano, separado de tu servidor web principal, dedicado a procesar tareas que no necesitan una respuesta inmediata al usuario. Pensá en los workers como empleados de cocina en un restaurante: el mozo (tu servidor web) toma el pedido y lo pasa a la cocina, donde los cocineros (workers) preparan el plato sin que el cliente tenga que pararse a mirar.

## Cómo funcionan

Un worker es básicamente un programa que está constantemente escuchando una [cola de tareas](/colas-de-tareas). Cuando aparece una tarea nueva, el worker la toma, la ejecuta, y cuando termina, busca la siguiente. Si no hay tareas, se queda esperando.

```
Web server (serves users)           Workers (process tasks)
┌─────────────────────────┐         ┌───────────────────┐
│ Receives HTTP requests  │         │ Worker 1          │
│ Responds quickly        │ ──queue─│ → processes image │
│ Enqueues heavy tasks    │         │                   │
└─────────────────────────┘         │ Worker 2          │
                                    │ → sends email     │
                                    │                   │
                                    │ Worker 3          │
                                    │ → generates report│
                                    └───────────────────┘
```

Lo importante es que el servidor web y los workers son procesos **separados**. Incluso pueden correr en [servidores](/servidores) distintos. El servidor web se ocupa exclusivamente de recibir peticiones y responder rápido, mientras los workers hacen el trabajo pesado.

## Ejemplo concreto

Supongamos que tu app permite exportar datos a un CSV. Sin workers, el usuario hace clic en "Exportar" y tiene que esperar 30 segundos mirando un spinner. Con workers:

```javascript
// pages/api/export.js — Next.js API route (responds to the user)
import queue from '../../lib/queue';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Enqueue the task and respond immediately
  await queue.add('generate-csv', {
    userId: req.user.id,
    filters: req.body.filters,
  });

  res.json({ message: 'Your export is being processed. We will notify you when it is ready.' });
}

// worker.js — Separate Node.js process (runs outside Next.js)
queue.process('generate-csv', async (task) => {
  const data = await getData(task.filters);
  const file = await generateCSV(data);
  await saveFile(file);
  await notifyUser(task.userId, 'Your CSV is ready to download');
});
```

El usuario ve un mensaje instantáneo y puede seguir usando la app. Cuando el CSV está listo, recibe una [notificación](/notificaciones).

## Escalando workers

Una de las mayores ventajas de los workers es que podés escalarlos independientemente del servidor web. Si tenés muchas tareas acumuladas en la cola, simplemente levantás más workers. Si la cola está vacía, podés reducir la cantidad de workers para ahorrar recursos.

- **Pocos usuarios subiendo archivos**: 1 worker alcanza
- **Black Friday con miles de pedidos**: levantás 20 workers temporalmente
- **Tarea pesada de madrugada**: 1 worker trabaja tranquilo mientras todos duermen

## Tipos de workers

Podés tener workers especializados que solo procesan cierto tipo de tareas, o workers genéricos que procesan cualquier cosa:

- **Workers de email**: solo procesan el envío de emails
- **Workers de multimedia**: procesan imágenes, video, audio
- **Workers genéricos**: toman cualquier tarea de la [cola](/colas-de-tareas)

La separación entre el servidor web y los workers es fundamental para que tu aplicación sea robusta. Si un worker falla procesando una tarea, tu servidor web sigue funcionando normalmente y los usuarios no se ven afectados.
