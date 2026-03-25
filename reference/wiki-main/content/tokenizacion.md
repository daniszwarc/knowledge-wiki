---
title: "Tokenización"
description: "El proceso por el cual un modelo de IA descompone texto en unidades más pequeñas llamadas tokens."
category: "Inteligencia artificial"
order: 9
question: "¿Cómo leen texto los modelos de IA?"
related: ["modelos", "prompts", "inferencia"]
---

## ¿Qué es un token?

Los [modelos](/modelos) de IA no leen texto como nosotros. No procesan letras individuales ni palabras completas. En su lugar, descomponen el texto en unidades llamadas **tokens**, que son fragmentos de texto que pueden ser palabras completas, partes de palabras o incluso caracteres individuales. La tokenización es el proceso que convierte texto legible en esta secuencia de tokens que el modelo puede procesar.

## Subwords: ni letras ni palabras

El método más usado hoy se llama **BPE** (Byte Pair Encoding), un algoritmo que aprende cuáles son los fragmentos de texto más frecuentes. La idea es que las palabras comunes se representan como un solo token, pero las palabras raras o largas se descomponen en partes más chicas. Mirá estos ejemplos:

```
"hello"          → ["hello"]                    (1 token)
"programming"    → ["program", "ming"]           (2 tokens)
"cryptocurrency" → ["crypt", "ocur", "rency"]    (3 tokens)
"inteligencia"   → ["int", "elig", "encia"]       (3 tokens)
```

Las palabras en inglés suelen usar menos tokens porque los modelos fueron entrenados principalmente con texto en inglés. "Hello" es 1 token, pero "cryptocurrency" podría ser 3 tokens. El español en promedio usa entre un 20-30% más de tokens que el inglés para decir lo mismo.

## ¿Por qué importa?

La tokenización importa por tres razones principales:

- **Límites de contexto:** Cada modelo tiene un máximo de tokens que puede procesar. GPT-4o soporta 128K tokens. Si tu [prompt](/prompts) más el contexto superan ese límite, tenés que recortar.
- **Costos:** La [inferencia](/inferencia) se cobra por token. Más tokens, más caro. Un prompt mal diseñado que usa 2000 tokens en vez de 500 te cuesta 4 veces más.
- **Velocidad:** Más tokens de salida significa más tiempo de generación. El modelo genera un token a la vez.

## Contando tokens

Podés contar tokens antes de mandar un request para estimar costos y verificar que no te pasás del límite:

```python
import tiktoken

encoder = tiktoken.encoding_for_model("gpt-4o")
text = "How does tokenization work in AI models?"

tokens = encoder.encode(text)
print(f"Text: {text}")
print(f"Tokens: {tokens}")
print(f"Count: {len(tokens)}")

# Result:
# Tokens: [3456, 78234, 1209, 456, ...]
# Count: 12
```

## Tokens especiales

Además de los tokens de texto, existen **tokens especiales** que el modelo usa internamente para marcar el inicio y fin de mensajes, separar roles (system, user, assistant) y otras señales. Estos tokens también cuentan para el límite y el costo, aunque no los veas directamente.

## Optimizando el uso de tokens

Algunas prácticas para usar menos tokens en tus [prompts](/prompts):

- Sé conciso en las instrucciones. No repitas lo mismo de distintas formas.
- Usá abreviaciones o formatos compactos cuando el modelo los entiende igual.
- Si mandás contexto largo, resumilo o seleccioná solo las partes relevantes.
- Considerá usar [modelos](/modelos) con ventanas de contexto más grandes si necesitás procesar mucho texto.

Cada token que ahorrás es plata que ahorrás, especialmente cuando tu aplicación escala a miles de usuarios.
