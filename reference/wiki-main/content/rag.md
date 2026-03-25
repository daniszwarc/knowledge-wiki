---
title: "RAG"
description: "Retrieval-Augmented Generation: una técnica que combina búsqueda de documentos con generación de texto por IA."
category: "Inteligencia artificial"
order: 8
question: "¿Cómo puede la IA responder con información propia?"
related: ["embeddings", "modelos", "prompts", "base-de-datos"]
---

## El problema: los modelos no conocen tus datos

Un [modelo](/modelos) de IA como GPT-4 o Claude fue entrenado con información pública de internet, pero no sabe nada sobre los documentos internos de tu empresa, tus políticas de devolución o tu base de conocimiento privada. Si le preguntás "¿cuál es el proceso de onboarding para nuevos empleados?", va a inventar algo genérico porque no tiene acceso a esa información. Acá es donde entra **RAG**.

## ¿Qué es RAG?

RAG (Retrieval-Augmented Generation) es una técnica que combina dos pasos: primero **buscás** los documentos relevantes en tu propia base de datos, y después se los pasás al modelo como contexto para que **genere** una respuesta basada en información real. En vez de esperar que el modelo sepa todo, le das la información que necesita en el momento.

## El flujo completo

```
1. The user asks: "How many vacation days do I have?"
2. An embedding of the question is generated (numeric vector)
3. The most similar documents are searched in the vector database
4. The 3-5 most relevant fragments are retrieved
5. A prompt is built: "Based on these documents, answer: ..."
6. The model generates a response using that information
```

Cada paso es importante. Si la búsqueda falla y trae documentos irrelevantes, la respuesta va a ser mala aunque el modelo sea excelente.

## Chunking: partir los documentos

Antes de poder buscar en tus documentos, tenés que convertirlos en [embeddings](/embeddings) (representaciones numéricas que capturan el significado del texto). Pero primero hay que partirlos en fragmentos más chicos (**chunks**). Un PDF de 50 páginas no se puede convertir en un solo embedding útil. Lo partís en fragmentos de 200-500 tokens, con algo de superposición entre ellos para no perder contexto.

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)

chunks = splitter.split_documents(documents)
```

## Base de datos vectorial

Los embeddings de tus chunks se guardan en una [base de datos](/base-de-datos) vectorial, que está optimizada para buscar por similitud (es decir, encontrar los fragmentos cuyo significado se parezca más a la pregunta del usuario). Las más populares son Pinecone, Chroma, Weaviate y pgvector (extensión de PostgreSQL). Cuando llega una consulta, generás su embedding y buscás los vectores más cercanos.

```python
# Store documents
vectorstore = Chroma.from_documents(chunks, embedding_model)

# Search for the most relevant
results = vectorstore.similarity_search("vacation", k=3)
```

## El prompt final

Con los documentos recuperados, armás un [prompt](/prompts) que le da contexto al modelo:

```
System: Answer using ONLY the information from the context.
If you don't know, say you don't have that information.

Context:
- "Full-time employees have 15 business days of vacation..."
- "Vacation can be taken after 6 months..."

User: How many vacation days do I have?
```

## ¿RAG o fine-tuning?

RAG es mejor cuando tu información cambia seguido o es muy extensa. **Fine-tuning** (reentrenar el modelo con tus propios datos para que "aprenda" un estilo o conocimiento específico) es mejor cuando necesitás cambiar el comportamiento o estilo del modelo. En muchos casos se combinan: un modelo fine-tuneado para tu tono y formato, que además usa RAG para acceder a datos actualizados.
