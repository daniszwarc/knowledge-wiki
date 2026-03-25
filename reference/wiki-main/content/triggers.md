---
title: "Triggers"
description: "Un trigger es un evento o condición que dispara automáticamente la ejecución de una acción o proceso."
category: "Automatización"
order: 3
question: "¿Qué dispara una acción automática?"
related: ["eventos", "webhooks", "workflows"]
---

## ¿Qué es un trigger?

Un trigger (disparador) es lo que inicia una acción automática. En vez de que alguien ejecute algo manualmente, el sistema detecta que algo pasó y reacciona. Es la primera pieza de cualquier automatización: sin un trigger, no hay nada que arranque el proceso. Cada [workflow](/workflows) empieza con un trigger que le dice "dale, ponete en marcha".

## Tipos de triggers

Existen varios tipos según qué es lo que los activa:

### Triggers por evento
Se disparan cuando algo específico ocurre en el sistema:
- Un usuario se registra
- Llega un nuevo mail
- Se actualiza un registro en la base de datos
- Se hace un push a un repositorio de código

### Triggers por horario (cron)
Se ejecutan en momentos programados:

```bash
# Every day at 9:00 AM
0 9 * * * /scripts/daily-report.sh

# Every Monday at 8:00 AM
0 8 * * 1 /scripts/weekly-report.sh

# Every 5 minutes
*/5 * * * * /scripts/check-status.sh
```

### Triggers por webhook
Un servicio externo hace un request HTTP a tu aplicación para avisarte que algo pasó. Por ejemplo, Stripe te manda un [webhook](/webhooks) cada vez que se procesa un pago. Tu sistema lo recibe y actúa en consecuencia.

### Triggers de base de datos
Muchas bases de datos permiten definir triggers que se ejecutan automáticamente cuando se insertan, actualizan o eliminan datos:

```sql
CREATE TRIGGER update_stock
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
  UPDATE products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;
END;
```

## Triggers con condiciones

No siempre querés que el trigger dispare la acción sin más. A veces necesitás **condiciones**: "ejecutá esto solo si el monto es mayor a $10.000" o "solo si el usuario es premium". Las plataformas de automatización te dejan agregar filtros después del trigger para que solo se procesen los eventos relevantes.

## Diseñando buenos triggers

Un trigger bien diseñado tiene que ser confiable y predecible. Algunas consideraciones:

- **Idempotencia:** Si el trigger se dispara dos veces por el mismo evento, el sistema no debería hacer las cosas dos veces (es decir, el resultado tiene que ser el mismo sin importar cuántas veces se ejecute). Esto pasa más seguido de lo que pensás, especialmente con [webhooks](/webhooks).
- **Manejo de errores:** ¿Qué pasa si el trigger se dispara pero la acción falla? Necesitás reintentos y alertas.
- **Observabilidad:** Registrá cada vez que un trigger se activa para poder debuggear si algo no funciona. Los triggers silenciosos son una pesadilla para debuggear.
