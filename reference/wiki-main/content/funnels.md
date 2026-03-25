---
title: "Funnels"
description: "Un funnel (embudo) es una representación de los pasos que sigue un usuario hasta completar una acción clave en tu producto."
category: "Analytics"
order: 3
question: "¿Cómo se mide un flujo de usuario?"
related: ["metricas", "eventos-analytics", "ux"]
---

## ¿Qué es un funnel?

Un **funnel** (embudo de conversión) es una forma de visualizar el recorrido que hacen los usuarios a través de una serie de pasos hasta llegar a un objetivo. Se llama "embudo" porque en cada paso se pierde gente: muchos entran al sitio, menos ven un producto, menos lo agregan al carrito, y menos aún completan la compra. Entender dónde y por qué se van los usuarios es clave para mejorar tu producto.

## Ejemplo de un funnel real

Imaginá un e-commerce. El funnel de compra podría ser:

```
Step 1: Visits the homepage      → 10,000 users (100%)
Step 2: Views a product          →  6,500 users (65%)
Step 3: Adds to cart             →  2,000 users (20%)
Step 4: Starts checkout          →  1,200 users (12%)
Step 5: Completes the purchase   →    800 users (8%)
```

La **tasa de conversión** total del funnel es del 8%. Pero lo interesante está en los pasos intermedios: hay una caída grande entre ver un producto y agregarlo al carrito (del 65% al 20%). Eso te da una pista de dónde enfocar los esfuerzos de mejora.

## Puntos de caída (drop-off)

Los **drop-off points** son los pasos del funnel donde más usuarios abandonan. Identificarlos es como encontrar los agujeros en un balde: si los tapás, retenés más agua. Las causas pueden ser variadas:

- Formularios largos o confusos.
- Costos de envío inesperados que aparecen recién en el checkout.
- Páginas que cargan lento.
- Pasos innecesarios que agregan fricción.

Cada punto de caída es una oportunidad de mejora. Incluso cambios chicos (como mover un botón o simplificar un formulario) pueden tener un impacto grande en la conversión.

## Análisis de funnels

Para armar y analizar funnels necesitás tener bien configurados tus [eventos de analytics](/eventos-analytics). Cada paso del funnel corresponde a un evento: "Página Vista", "Producto Visto", "Agregado al Carrito", etc. Herramientas como Mixpanel, Amplitude o Google Analytics te permiten crear funnels arrastrando eventos y ver las tasas de conversión entre cada paso, segmentados por distintas dimensiones (dispositivo, país, campaña de origen).

## Optimización de funnels

Una vez que tenés el funnel armado y los drop-offs identificados, podés empezar a optimizar. El proceso suele ser iterativo:

1. Identificá el paso con mayor caída.
2. Generá hipótesis de por qué los usuarios se van (podés complementar con [métricas](/metricas) o encuestas).
3. Hacé cambios y corré un [A/B test](/ab-testing) para validar.
4. Si la conversión mejora, implementá el cambio. Si no, probá otra hipótesis.

No trates de arreglar todo a la vez. Enfocate en el paso con mayor impacto potencial y trabajá de forma incremental. Un funnel optimizado se traduce directamente en más ingresos, más registros o más de lo que sea que tu producto necesite.
