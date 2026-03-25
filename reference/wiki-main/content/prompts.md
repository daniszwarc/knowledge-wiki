---
title: "Prompts"
description: "Un prompt es la instrucción o texto que le das a un modelo de IA para que genere una respuesta."
category: "Inteligencia artificial"
order: 3
question: "¿Cómo se le pide algo a una IA?"
related: ["modelos", "inputs-outputs", "agentes"]
---

## ¿Qué es un prompt?

Un prompt es el texto que le enviás a un [modelo](/modelos) de IA para indicarle qué querés que haga. Puede ser tan simple como una pregunta ("¿Cuál es la capital de Francia?") o tan complejo como un documento con instrucciones detalladas, ejemplos y restricciones. La calidad de la respuesta depende enormemente de cómo escribís tu prompt; por eso existe toda una disciplina llamada **prompt engineering** (el arte de escribir buenas instrucciones para la IA).

## Partes de un prompt

Un prompt bien diseñado suele tener varias partes:

- **System prompt:** Instrucciones generales que definen el comportamiento del modelo. Por ejemplo: "Sos un asistente que responde en español argentino y de forma concisa."
- **Contexto:** Información de fondo que el modelo necesita para responder bien.
- **Instrucción:** Lo que querés que haga concretamente.
- **Formato de salida:** Cómo esperás que te responda (JSON, lista, párrafo, etc.).

```
System: You are an expert in Argentine cuisine.
User: Give me a recipe for empanadas salteñas.
      Format: list of ingredients + numbered steps.
```

## Few-shot: enseñar con ejemplos

Una técnica muy poderosa es dar **ejemplos** dentro del prompt para que el modelo entienda el patrón que querés. A esto se le dice "few-shot prompting". En vez de explicar con palabras qué formato querés, le mostrás dos o tres ejemplos y el modelo sigue el patrón.

```
Classify the sentiment of the text.

Text: "I loved the movie" → Positive
Text: "It was so boring" → Negative
Text: "The acting was incredible but the ending disappointed me" → ???
```

El modelo va a completar con "Mixto" o algo similar porque entendió el patrón de los ejemplos anteriores. Esto funciona mucho mejor que simplemente decir "clasificá el sentimiento".

## Buenas prácticas

Hay algunas reglas que mejoran mucho los resultados:

- **Sé específico:** "Resumí este texto en 3 oraciones" funciona mejor que "resumí esto".
- **Dá contexto:** Cuanto más información relevante le des, mejor responde.
- **Pedí paso a paso:** Si la tarea es compleja, pedile que razone paso a paso antes de dar la respuesta final.
- **Iterá:** Rara vez el primer prompt es el mejor. Probá, ajustá y volvé a probar.

## Prompts en aplicaciones

Cuando construís una aplicación que usa IA, los prompts no los escribe el usuario final: los escribís vos como desarrollador. El system prompt define la personalidad y las reglas del [modelo](/modelos), y después combinás eso con los [inputs](/inputs-outputs) del usuario. Los [agentes](/agentes) de IA llevan esto un paso más allá, usando prompts dinámicos que cambian según el contexto y las herramientas disponibles.
