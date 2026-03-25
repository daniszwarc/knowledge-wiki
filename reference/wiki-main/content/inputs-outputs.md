---
title: "Inputs / Outputs"
description: "Los inputs son los datos que recibe un modelo de IA y los outputs son las respuestas que genera."
category: "Inteligencia artificial"
order: 2
question: "¿Qué entra y qué sale de un modelo?"
related: ["modelos", "prompts", "inferencia"]
---

## La idea básica

Un [modelo](/modelos) de IA funciona como una función: le das algo de entrada (input) y te devuelve algo de salida (output). Parece simple, pero entender bien qué tipos de inputs acepta un modelo y qué tipos de outputs puede generar es fundamental para usarlo correctamente. No todos los modelos aceptan los mismos inputs ni producen los mismos outputs.

## Tipos de inputs

Los inputs son los datos que le mandás al modelo para que los procese:

- **Texto:** Es el input más común. Incluye tu [prompt](/prompts), las instrucciones del sistema y cualquier contexto adicional. Por ejemplo: `"Traducí esta frase al inglés: Hola mundo"`.
- **Imágenes:** Los modelos multimodales pueden recibir imágenes junto con texto. Le podés mandar una foto y preguntarle qué ve.
- **Audio:** Algunos modelos aceptan archivos de audio para transcripción o análisis.
- **Datos estructurados:** Podés pasar JSON, tablas o cualquier dato formateado como parte del contexto.

```json
{
  "model": "gpt-4",
  "messages": [
    { "role": "system", "content": "You are a professional translator." },
    { "role": "user", "content": "Translate 'good morning' to Japanese." }
  ]
}
```

## Tokens: la unidad real

Antes de procesar tu input, el modelo lo divide en **tokens**. Un token no es exactamente una palabra; puede ser una palabra completa, parte de una palabra o un signo de puntuación. Por ejemplo, la palabra "programación" podría dividirse en dos o tres tokens. Esto importa porque los modelos tienen un límite de tokens (la **ventana de contexto**) y porque te cobran por token. Un modelo con una ventana de 128K tokens puede procesar textos muy largos, mientras que uno de 4K se queda corto rápido.

## Tipos de outputs

Lo que te devuelve el modelo depende del tipo de tarea:

- **Texto generado:** La respuesta en lenguaje natural. Es el output más habitual cuando usás un LLM.
- **Embeddings:** Listas de números que representan el significado del texto (como coordenadas que ubican cada palabra o frase en un "mapa de significados"). Se usan para búsqueda semántica. Más detalles en [embeddings](/embeddings).
- **Clasificaciones:** El modelo puede devolverte una categoría, como "positivo" o "negativo" en análisis de sentimiento.
- **Datos estructurados:** Podés pedirle al modelo que te devuelva JSON, listas o tablas.

## ¿Por qué importa entender esto?

Cuando diseñás una aplicación que usa IA, necesitás saber exactamente qué le vas a mandar al modelo y qué esperás que te devuelva. Si tu input es confuso o incompleto, el output va a ser pobre. Por eso el diseño de [prompts](/prompts) es tan importante: es la manera en la que controlás qué entra para influir en lo que sale. Cada llamada de [inferencia](/inferencia) consume tokens, así que optimizar tus inputs también te ahorra plata.
