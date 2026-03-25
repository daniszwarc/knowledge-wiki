---
title: "Batch processing"
description: "Procesamiento de grandes volúmenes de datos en lotes en vez de uno por uno."
category: "Procesamiento"
icon: "cpu"
order: 7
question: "¿Cómo se procesan miles de registros de forma eficiente?"
related: ["colas-de-tareas", "workers", "jobs-programados"]
---

El **batch processing** (procesamiento por lotes) es una técnica donde en vez de procesar datos uno por uno a medida que llegan, los juntás en grupos (lotes o "batches") y los procesás todos juntos. Pensá en cómo funciona un lavadero de ropa: no lavás cada prenda individual, esperás a juntar un lote y lavás todo junto. Es más eficiente.

## Batch vs tiempo real

No todo necesita procesarse al instante. Muchas operaciones pueden esperar minutos, horas o incluso hasta la madrugada:

| Enfoque | Cuándo usarlo | Ejemplo |
|---------|--------------|---------|
| **Tiempo real** | El usuario espera la respuesta | Validar un formulario |
| **Batch** | No hace falta respuesta inmediata | Generar reportes mensuales |

Si el usuario no está sentado esperando el resultado, probablemente sea un buen candidato para batch processing.

## Casos de uso típicos

- **Envío de campañas de email**: mandás 50,000 emails en lotes de 500, en vez de uno por uno
- **Importación de datos**: un cliente te sube un CSV con 100,000 filas para importar
- **Generación de reportes**: calcular métricas mensuales procesando millones de registros
- **Actualización masiva de precios**: un e-commerce que actualiza 20,000 productos cuando cambia el dólar

## Procesando en chunks

La clave del batch processing es dividir el trabajo en **chunks** (pedazos) manejables. Si intentás procesar 10,000 registros de una, probablemente te quedes sin memoria o satures la base de datos. En cambio, procesás de a 100:

```javascript
// pages/api/process-users.js
async function processInBatches(records, batchSize = 100) {
  const results = [];

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1} ` +
      `of ${Math.ceil(records.length / batchSize)}`
    );

    // Process each batch
    const result = await Promise.all(
      batch.map(record => processRecord(record))
    );

    results.push(...result);
  }

  return results;
}

export default async function handler(req, res) {
  const users = await getAllUsers();
  const results = await processInBatches(users, 100);
  res.status(200).json({ processed: results.length });
}
```

## Tracking de progreso

Cuando un batch tarda minutos u horas, necesitás saber cómo va. Un patrón común es guardar el progreso en la base de datos:

```javascript
// lib/batch.js
import db from './db';

export async function processWithProgress(jobId, records, batchSize = 100) {
  const total = records.length;
  let processed = 0;

  for (let i = 0; i < total; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await Promise.all(batch.map(r => processRecord(r)));

    processed += batch.length;
    const percentage = Math.round((processed / total) * 100);

    // Update progress in the database
    await db.query(
      'UPDATE jobs SET progress = $1, updatedAt = NOW() WHERE id = $2',
      [percentage, jobId]
    );

    console.log(`Progress: ${percentage}% (${processed}/${total})`);
  }
}

// pages/api/jobs/[id]/progress.js — endpoint for the frontend to check progress
import db from '../../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  const result = await db.query('SELECT progress FROM jobs WHERE id = $1', [id]);
  res.status(200).json({ progress: result.rows[0].progress });
}
```

Así el frontend puede consultar el progreso y mostrarle al usuario una barra o porcentaje. En aplicaciones reales, los batches suelen ejecutarse como [jobs programados](/jobs-programados) en horarios de baja carga, procesados por [workers](/workers) que toman las tareas de una [cola de tareas](/colas-de-tareas). Esto permite escalar el procesamiento y reintentar lotes que fallen sin afectar al resto.
