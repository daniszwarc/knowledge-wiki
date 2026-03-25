---
title: "Modelos"
description: "Un modelo de IA es un programa entrenado con datos para reconocer patrones y generar respuestas."
category: "Inteligencia artificial"
order: 1
question: "¿Qué es un modelo de IA?"
related: ["inferencia", "prompts", "inputs-outputs"]
---

## ¿Qué es un modelo?

Cuando hablamos de un modelo de inteligencia artificial, nos referimos a un programa que fue entrenado con enormes cantidades de datos para aprender patrones. Pensalo como alguien que leyó millones de libros, artículos y conversaciones, y después de todo eso puede generar texto, clasificar imágenes o traducir idiomas. El modelo no "entiende" como un humano, pero es muy bueno encontrando patrones y relaciones estadísticas entre los datos que vio durante su entrenamiento.

## ¿Cómo aprende un modelo?

El proceso de entrenamiento consiste en mostrarle al modelo millones de ejemplos y ajustar sus **parámetros** internos (números que representan conexiones) para que sus predicciones se acerquen cada vez más a la respuesta correcta. Un modelo chico puede tener millones de parámetros, mientras que los modelos grandes de lenguaje (LLMs) como GPT o Claude tienen miles de millones. Cuantos más parámetros y mejores datos de entrenamiento, más capaz tiende a ser el modelo, aunque no siempre es así.

```
Training data → Learning algorithm → Trained model
        (text, images)     (adjusts parameters)     (ready to use)
```

## Tipos de modelos

Existen muchos tipos de modelos según lo que hacen:

- **Modelos de lenguaje (LLMs):** Generan y entienden texto. Son los que están detrás de ChatGPT, Claude, Gemini. Funcionan prediciendo la siguiente palabra más probable.
- **Modelos de imágenes:** Generan imágenes a partir de texto (como DALL-E o Midjourney) o clasifican imágenes existentes.
- **Modelos de audio:** Transcriben voz a texto (como Whisper) o generan audio.
- **Modelos de embeddings:** Convierten texto en representaciones numéricas para buscar similitudes. Podés leer más en [embeddings](/embeddings).

## ¿Modelo vs. producto?

Es importante distinguir entre el modelo y el producto. ChatGPT es un producto que usa modelos de OpenAI por debajo. El modelo en sí es la pieza que recibe [inputs y genera outputs](/inputs-outputs). El producto le agrega interfaz, memoria, herramientas y toda la experiencia de usuario. Cuando hacés [inferencia](/inferencia) a través de una API, estás interactuando directamente con el modelo, sin la capa del producto.

## ¿Por qué importan los modelos?

Los modelos son la pieza central de cualquier aplicación de IA. Elegir el modelo correcto depende de tu caso de uso: si necesitás generar texto largo y complejo, probablemente quieras un LLM potente. Si necesitás clasificar imágenes de productos, vas a buscar un modelo de visión. Entender qué puede y qué no puede hacer un modelo te ayuda a escribir mejores [prompts](/prompts) y a diseñar mejores aplicaciones.
