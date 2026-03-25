---
title: "Embeddings"
description: "Los embeddings son representaciones numéricas que capturan el significado de un texto para que una computadora pueda comparar conceptos."
category: "Inteligencia artificial"
order: 4
question: "¿Cómo entiende una IA el significado?"
related: ["modelos", "base-de-datos", "indexacion"]
---

## ¿Qué son los embeddings?

Un embedding es una lista de números (un **vector**, que es simplemente una secuencia ordenada de valores) que representa el significado de un texto. Cuando un [modelo](/modelos) de IA genera un embedding para la frase "perro juguetón", produce algo como `[0.23, -0.45, 0.87, ...]` con cientos o miles de valores.

La clave es que textos con significados parecidos producen vectores parecidos. "Cachorro alegre" va a tener un vector muy cercano al de "perro juguetón", aunque las palabras sean completamente distintas.

## ¿Cómo se mide la similitud?

Para comparar dos embeddings se usa una operación matemática llamada **similitud coseno**. No necesitás entender la matemática: lo que importa es que devuelve un número entre -1 y 1. Cuanto más cerca de 1, más parecidos son los textos en significado. Esto permite hacer **búsquedas semánticas**: en vez de buscar palabras exactas, buscás por significado.

```text
Embedding of "sports car"     → [0.8, 0.3, -0.1, ...]
Embedding of "racing vehicle" → [0.78, 0.32, -0.05, ...]  ← very similar
Embedding of "cake recipe"    → [-0.2, 0.9, 0.4, ...]     ← very different

similarity("sports car", "racing vehicle") = 0.97
similarity("sports car", "cake recipe")    = 0.12
```

## Bases de datos vectoriales

Para aprovechar los embeddings a escala, necesitás una [base de datos](/base-de-datos) especializada en almacenar y buscar vectores. Estas se llaman **bases de datos vectoriales** (como Pinecone, Weaviate, Chroma o pgvector). Funcionan así: generás embeddings para todos tus documentos, los guardás en la base vectorial, y cuando un usuario hace una consulta, generás el embedding de la consulta y buscás los vectores más cercanos.

## RAG: Retrieval-Augmented Generation

Una de las aplicaciones más populares de embeddings es **RAG** (Retrieval-Augmented Generation, o "generación aumentada por búsqueda"). La idea es simple: antes de pedirle a un LLM (modelo de lenguaje como ChatGPT) que responda una pregunta, buscás en tu base de datos vectorial los documentos más relevantes y se los pasás como contexto. Así el modelo puede responder con información actualizada y específica de tu negocio, sin necesidad de re-entrenarlo.

```text
1. User asks: "What is the return policy?"
2. An embedding is generated for the question
3. The most similar documents are searched in the vector database
4. A prompt is built with those documents as context
5. The LLM responds using that information
```

## Casos de uso comunes

Los embeddings se usan en muchísimas aplicaciones: buscadores semánticos que entienden lo que querés decir aunque no uses las palabras exactas, sistemas de recomendación que sugieren contenido similar, detección de duplicados, clasificación de texto y más. Si tenés datos que necesitan algún tipo de [indexación](/indexacion) por significado, los embeddings son probablemente la herramienta que necesitás.
