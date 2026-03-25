---
title: "Workflows"
description: "Un workflow es una secuencia de pasos automatizados que se ejecutan para completar un proceso."
category: "Automatización"
order: 1
question: "¿Cómo se automatizan procesos?"
related: ["pipelines", "triggers", "agentes"]
---

## ¿Qué es un workflow?

Un workflow (flujo de trabajo) es una serie de pasos que se ejecutan en un orden determinado para completar una tarea. En vez de hacer cada paso manualmente, lo automatizás: definís qué tiene que pasar, en qué orden, y bajo qué condiciones. Por ejemplo, cuando un cliente hace una compra, automáticamente se genera la factura, se envía un mail de confirmación y se actualiza el inventario. Cada paso se ejecuta sin que nadie tenga que intervenir.

## ¿Cómo se arma un workflow?

Un workflow típico tiene estas partes:

- **Trigger (disparador):** Lo que inicia el flujo. Puede ser un evento, un horario o una acción manual. Más sobre esto en [triggers](/triggers).
- **Pasos (acciones):** Cada tarea que se ejecuta. Puede ser llamar a una [API](/api), transformar datos, enviar un mail, guardar en una base de datos, etc.
- **Condiciones:** Bifurcaciones del tipo "si pasa X, hacé Y; si no, hacé Z".
- **Salida:** El resultado final del proceso.

```
Trigger: New order received
    │
    ▼
Step 1: Check stock
    │
    ├── Stock available → Step 2: Process payment
    │                          │
    │                          ▼
    │                     Step 3: Send confirmation
    │
    └── Out of stock → Send waiting notice
```

## Herramientas de automatización

Existen muchas plataformas que te permiten armar workflows sin escribir código (o con muy poco):

- **Zapier:** Conecta miles de apps entre sí con una interfaz visual. Ideal para automatizaciones simples.
- **n8n:** Similar a Zapier pero open source y self-hosted. Más flexible para casos complejos.
- **Make (antes Integromat):** Interfaz visual potente con soporte para flujos complejos.
- **Temporal / Inngest:** Para workflows programáticos dentro de tu código, con manejo de errores avanzado.

## Workflows e IA

Los workflows se vuelven mucho más interesantes cuando les sumás inteligencia artificial. Un [agente](/agentes) de IA puede tomar decisiones dentro del flujo, clasificar datos automáticamente o generar contenido. Por ejemplo: recibís un mail de un cliente, un modelo lo clasifica como "reclamo" o "consulta", y según eso se dispara un flujo diferente. La combinación de workflows con IA es una de las áreas que más está creciendo.

## Diferencia con pipelines

Aunque suenan parecidos, workflows y [pipelines](/pipelines) tienen enfoques distintos. Un workflow se orienta a procesos de negocio con lógica condicional y múltiples caminos posibles (como un diagrama con bifurcaciones). Un pipeline suele ser más lineal: datos que pasan por una serie de transformaciones, uno tras otro. En la práctica, muchas veces se usan juntos.
