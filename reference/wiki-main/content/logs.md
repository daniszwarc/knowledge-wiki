---
title: "Logs"
description: "Los logs son registros de eventos que genera una aplicación para que los desarrolladores puedan entender qué pasó y cuándo."
category: "Infraestructura"
order: 4
question: "¿Cómo se registra lo que pasa?"
related: ["monitoreo", "servidores", "bugs"]
---

## ¿Qué son los logs?

Los logs son mensajes que tu aplicación va registrando mientras se ejecuta. Son como un diario: "a las 14:32 el usuario Juan se logueó", "a las 14:33 se procesó un pago de $5000", "a las 14:35 falló la conexión a la base de datos". Cuando algo se rompe (y algo siempre se rompe), los logs son lo primero que revisás para entender qué pasó.

## Niveles de log

No todos los mensajes tienen la misma importancia. Por eso existen **niveles de log** que te permiten filtrar según la gravedad:

```javascript
// DEBUG: Technical detail, only useful for development
logger.debug("Parameters received: { id: 42, action: 'update' }");

// INFO: Normal business events
logger.info("User juan@mail.com logged in");

// WARN: Something odd but not serious
logger.warn("The payments API took 3 seconds to respond");

// ERROR: Something failed
logger.error("Could not connect to the database", { error: err });

// FATAL: Critical error, the application cannot continue
logger.fatal("No memory available, shutting down process");
```

En producción, generalmente configurás para ver desde `INFO` para arriba. En desarrollo, activás `DEBUG` para tener más detalle.

## Logs estructurados

Los logs como texto plano son difíciles de buscar y analizar a escala. La práctica moderna es usar **logs estructurados** en formato JSON. Cada entrada tiene campos bien definidos que después podés filtrar y agregar:

```json
{
  "timestamp": "2025-03-15T14:32:00Z",
  "level": "error",
  "service": "payment-api",
  "message": "Payment rejected",
  "userId": "usr_123",
  "amount": 5000,
  "reason": "insufficient_funds",
  "traceId": "abc-456-def"
}
```

Con logs estructurados podés filtrar y hacer consultas como "mostrá todos los errores de pago del último lunes" o "cuántos usuarios tuvieron errores hoy".

## Agregación y búsqueda

Cuando tu app corre en múltiples [servidores](/servidores), necesitás centralizar los logs en un solo lugar. Para eso existen herramientas de **agregación de logs**:

- **ELK Stack (Elasticsearch, Logstash, Kibana):** El clásico open source. Recolecta, indexa y visualiza logs.
- **Datadog:** Plataforma completa que combina logs con [monitoreo](/monitoreo).
- **Grafana Loki:** Alternativa liviana para agregar logs, se integra bien con Grafana.

## Buenas prácticas

Algunas reglas que te van a ahorrar horas de debugging:

- **Logueá el contexto:** No solo "error al procesar pago", sino qué usuario, qué monto, qué error exacto.
- **Usá IDs de correlación:** Un `traceId` (identificador único) que conecte todos los logs de un mismo request a través de diferentes servicios. Así podés seguir el rastro completo de una operación.
- **No logués datos sensibles:** Nunca contraseñas, tokens o datos de tarjetas de crédito.
- **Rotá los logs:** Los archivos de log crecen infinitamente si no los controlás. Configurá rotación y retención.
