---
title: "Jobs programados"
description: "Tareas que se ejecutan automáticamente en horarios o intervalos definidos"
category: "Procesamiento"
order: 5
question: "¿Cómo se ejecutan tareas automáticamente?"
related: ["colas-de-tareas", "workers", "automatizacion"]
---

Los **jobs programados** (scheduled jobs o cron jobs) son tareas que se ejecutan automáticamente en momentos específicos o a intervalos regulares, sin que nadie las dispare manualmente. Es como poner un despertador: lo configurás una vez y suena todos los días a la misma hora.

## Para qué se usan

Hay muchas tareas en una aplicación que necesitan ejecutarse periódicamente:

- **Limpieza de datos**: borrar archivos temporales del [almacenamiento](/almacenamiento-de-archivos) cada noche
- **Envío de reportes**: generar y enviar un resumen semanal por email todos los lunes a las 8am
- **Renovación de caché**: actualizar datos cacheados cada hora
- **Facturación**: procesar los cobros mensuales de suscripciones el día 1 de cada mes
- **Monitoreo**: verificar que servicios externos estén funcionando cada 5 minutos

## Cron: el clásico

El sistema más tradicional para programar tareas es **cron**, una herramienta de Unix/Linux que existe desde los años 70. Usa una sintaxis de cinco campos para definir cuándo ejecutar algo:

```text
┌───────── minute (0-59)
│ ┌─────── hour (0-23)
│ │ ┌───── day of month (1-31)
│ │ │ ┌─── month (1-12)
│ │ │ │ ┌─ day of week (0-6, 0=Sunday)
│ │ │ │ │
* * * * *  command to execute
```

Algunos ejemplos:

```text
0 8 * * 1        → Every Monday at 8:00am
*/5 * * * *      → Every 5 minutes
0 0 1 * *        → The first day of each month at midnight
30 14 * * 1-5    → Monday through Friday at 2:30pm
```

La sintaxis puede parecer críptica al principio, pero hay herramientas como [crontab.guru](https://crontab.guru) que te ayudan a armarla visualmente.

## Jobs programados en aplicaciones modernas

Hoy en día, muchas aplicaciones no usan cron directamente en un servidor, sino que usan librerías o servicios que manejan la programación por vos:

```javascript
// pages/api/cron/clean-files.js — Next.js API route triggered by Vercel Cron
// In vercel.json: { "crons": [{ "path": "/api/cron/clean-files", "schedule": "0 3 * * *" }] }

export default async function handler(req, res) {
  // Verify the request comes from Vercel Cron
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('Cleaning temporary files...');
  await cleanTemporaryFiles();

  res.status(200).json({ message: 'Done' });
}
```

```javascript
// Alternative: using node-cron in a standalone Node.js server
import cron from 'node-cron';

// Run every day at 3:00am
cron.schedule('0 3 * * *', async () => {
  console.log('Cleaning temporary files...');
  await cleanTemporaryFiles();
});

// Run every hour
cron.schedule('0 * * * *', async () => {
  console.log('Updating product cache...');
  await updateProductCache();
});
```

Servicios en la nube como **AWS EventBridge**, **Google Cloud Scheduler** o **Vercel Cron** te permiten configurar jobs sin administrar servidores.

## Jobs vs colas de tareas

Es común combinar jobs programados con [colas de tareas](/colas-de-tareas). El job programado se encarga de **disparar** la tarea a una hora específica, y la cola se encarga de **ejecutarla** a través de un [worker](/workers). Esto es útil porque si el job genera mucho trabajo (por ejemplo, enviar emails a 10.000 usuarios), podés distribuir esa carga entre varios workers.

```text
Cron (3:00am) → Enqueues task "generate monthly report"
                      │
                      ▼
                Task queue
                      │
                      ▼
                Worker processes → Generates PDF → Sends via email
```

## Cosas a tener en cuenta

- **Zona horaria**: asegurate de configurar la zona horaria correcta. Un job que se ejecuta a las "8am" puede significar cosas distintas según el huso horario del servidor
- **Ejecución duplicada**: si tenés varios [servidores](/servidores), el mismo job podría ejecutarse en todos a la vez. Necesitás un mecanismo de "lock" (bloqueo) para que solo uno lo ejecute
- **Errores y reintentos**: si un job falla, decidí si debe reintentarse automáticamente o si alguien debe ser alertado
