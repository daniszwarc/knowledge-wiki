---
title: "Colas de tareas"
description: "Un sistema que organiza y distribuye tareas pendientes para que se procesen en orden"
category: "Procesamiento"
order: 3
question: "¿Cómo se organizan las tareas pendientes?"
related: ["procesamiento-asincrono", "workers", "jobs-programados"]
---

Una **cola de tareas** (message queue o job queue) es exactamente lo que su nombre indica: una fila donde se acumulan tareas esperando a ser procesadas. Funciona igual que la fila del supermercado — el primero que llega es el primero que se atiende. Este principio se llama **FIFO** (First In, First Out).

## Por qué se usan

Imaginá que tu aplicación permite subir imágenes y necesitás redimensionarlas a varios tamaños. Si hacés eso de forma [síncrona](/procesamiento-sincrono), el usuario tiene que esperar mientras se procesan todas las versiones. Con una cola de tareas, la aplicación recibe la imagen, la guarda en el [almacenamiento](/almacenamiento-de-archivos), mete un "trabajo" en la cola, y le responde al usuario inmediatamente. Un [worker](/workers) agarra ese trabajo de la cola y lo procesa en segundo plano.

```
User uploads image
       │
       ▼
  Server receives it
       │
       ├──→ Saves original image
       │
       ├──→ Puts task in the queue: "resize image 456"
       │
       └──→ Responds to user: "Image uploaded!"

// Meanwhile, on another side...
Worker ←── Grabs task from the queue
       │
       └──→ Resizes image 456 to three sizes
```

## Cómo funciona una cola

Una cola tiene tres partes principales:

- **Productores**: el código que crea y agrega tareas a la cola (tu servidor web, por ejemplo)
- **La cola**: el servicio que almacena las tareas en orden
- **Consumidores**: los [workers](/workers) que sacan tareas de la cola y las ejecutan

```javascript
// pages/api/send-email.js (Next.js API Route — producer)
import { Queue } from 'bullmq';

const emailQueue = new Queue('send-email');

export default async function handler(req, res) {
  await emailQueue.add('send-email', {
    recipient: 'user@example.com',
    subject: 'Welcome',
    template: 'welcome',
  });
  res.status(200).json({ message: 'Email queued' });
}

// worker.js (separate Node.js process — consumer)
import { Worker } from 'bullmq';

const worker = new Worker('send-email', async (job) => {
  await sendEmail(job.data.recipient, job.data.subject, job.data.template);
});
```

## Herramientas populares

- **RabbitMQ**: un message broker (intermediario de mensajes) robusto y muy usado, soporta múltiples patrones de mensajería
- **Amazon SQS**: servicio de colas totalmente administrado por AWS, escala automáticamente
- **Redis + BullMQ**: Redis como base con BullMQ como librería para manejar colas en Node.js
- **Sidekiq**: muy popular en el mundo Ruby on Rails

## Casos de uso típicos

Las colas de tareas son ideales para cualquier trabajo que no necesite una respuesta inmediata:

- **Envío de emails y notificaciones**: no necesitás que el usuario espere mientras se envía un email
- **Procesamiento de imágenes y video**: redimensionar, convertir formatos, generar thumbnails
- **Generación de reportes**: compilar datos pesados en PDFs o planillas
- **Importación de datos**: procesar un CSV con miles de filas
- **Sincronización con servicios externos**: actualizar datos en otras [APIs](/api)

Las colas también sirven como amortiguador: si de repente llegan miles de pedidos, la cola los acumula y los [workers](/workers) los procesan al ritmo que pueden, sin que el sistema se caiga. Es una pieza clave del [procesamiento asíncrono](/procesamiento-asincrono).
