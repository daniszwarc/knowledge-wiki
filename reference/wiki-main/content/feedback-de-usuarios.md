---
title: "Feedback de usuarios"
description: "El feedback de usuarios es la información que recopilás de las personas que usan tu producto para entender qué funciona, qué no y qué mejorar."
category: "Producto"
icon: "package"
order: 5
question: "¿Cómo se recolecta opinión de los usuarios?"
related: ["iteracion", "validacion", "eventos-analytics"]
---

## Escuchar para mejorar

Podés tener la mejor idea del mundo, pero si no escuchás a las personas que usan tu producto, vas a construir algo que solo tiene sentido en tu cabeza. El **feedback de usuarios** es toda la información que recopilás de tus usuarios (opiniones, quejas, sugerencias, comportamiento) para tomar mejores decisiones sobre qué construir, qué cambiar y qué eliminar. Es el combustible de cada [iteración](/iteracion).

## Canales de feedback

Hay muchas formas de recolectar feedback, y lo ideal es combinar varias:

- **Entrevistas 1 a 1**: La forma más rica de entender a tus usuarios. Agendás una llamada de 20-30 minutos y les preguntás sobre su experiencia. Escuchás más de lo que hablás.
- **Encuestas in-app**: Un formulario breve que aparece dentro de tu producto en momentos clave (después de completar una acción, al cancelar, etc.).
- **NPS (Net Promoter Score)**: Una sola pregunta: "Del 0 al 10, ¿qué tan probable es que recomiendes este producto?". Los que responden 9-10 son promotores (fans), 7-8 pasivos, y 0-6 detractores (insatisfechos). Tu NPS es el porcentaje de promotores menos el de detractores. Un NPS alto significa que tenés más fans que usuarios descontentos.
- **Soporte y tickets**: Cada mensaje al soporte es feedback gratuito. Los problemas que más se repiten son los que más urgente necesitás resolver.
- **Redes sociales y reviews**: Lo que la gente dice en Twitter, Reddit o las reviews de la app store.

## Feedback cualitativo vs cuantitativo

No todo el feedback es igual. Hay dos tipos que se complementan:

| Tipo | Qué te dice | Ejemplo |
|------|-------------|---------|
| **Cualitativo** | El *por qué* | "No encuentro el botón de exportar, estuve 5 minutos buscando" |
| **Cuantitativo** | El *qué* y *cuánto* | "Solo el 12% de los usuarios usa la función de exportar" |

El feedback cualitativo te da contexto y empatía. El cuantitativo te da escala y prioridades. Si el 12% usa exportar pero los que la usan la necesitan desesperadamente, tal vez el problema es que no la encuentran, no que no la quieren. Combinando ambos tipos de datos tomás mejores decisiones.

## Cómo priorizar lo que te piden

Un error común es intentar implementar todo lo que los usuarios piden. No todos los pedidos tienen el mismo peso. Un framework útil para priorizar es **ICE**:

```
I = Impact      → How much does it improve the experience? (1-10)
C = Confidence  → How sure are you it will work? (1-10)
E = Effort      → How much does it cost to implement? (1-10, where 10 = easy)

Score = I × C × E

Example:
- Improve onboarding:      I=9, C=8, E=6 → Score: 432 ← High priority
- Dark mode:               I=4, C=7, E=8 → Score: 224
- Slack integration:       I=6, C=5, E=3 → Score: 90  ← Can wait
```

## Preguntar bien

La calidad del feedback depende de la calidad de tus preguntas. Evitá preguntas cerradas como "¿Te gusta la app?" (la respuesta siempre es "sí"). En su lugar, preguntá cosas como: "¿Qué es lo más difícil de hacer en la app?", "¿Qué intentaste hacer y no pudiste?" o "Si pudieras cambiar una sola cosa, ¿cuál sería?". Las mejores preguntas son abiertas y enfocadas en el comportamiento real, no en opiniones abstractas. Este feedback, combinado con datos de [validación](/validacion), te da una base sólida para decidir los próximos pasos de tu producto.
