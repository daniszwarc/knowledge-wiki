---
title: "Guardrails"
description: "Mecanismos para limitar, validar y controlar las respuestas generadas por modelos de IA."
category: "Inteligencia artificial"
order: 10
question: "¿Cómo se controla lo que responde una IA?"
related: ["prompts", "modelos", "validacion"]
---

## ¿Por qué necesitás guardrails?

Los [modelos](/modelos) de IA son potentes pero impredecibles. Pueden inventar información que suena correcta pero no lo es (lo que se llama "alucinaciones"), responder sobre temas que no deberían, generar contenido inapropiado o devolver datos en un formato inesperado que rompe tu aplicación. Los **guardrails** son los mecanismos que ponés para controlar, limitar y validar lo que el modelo responde. Son la diferencia entre un prototipo divertido y un producto confiable.

## System prompts: la primera línea de defensa

El system prompt es donde definís las reglas del juego. Le decís al modelo qué puede hacer, qué no puede hacer y cómo debe comportarse. Esto no es infalible, pero es el punto de partida más importante.

```
System: You are a technical support assistant for ProductX.
Rules:
- Only answer questions related to ProductX.
- If asked about competitors, say you cannot comment.
- Never make up features that don't exist.
- If you don't know something, say "I don't have that information, please contact support."
```

Un buen [prompt](/prompts) del sistema reduce enormemente los problemas, pero no los elimina. Siempre necesitás validar la salida.

## Validación de la salida

Nunca confíes ciegamente en lo que devuelve el modelo. Aplicá [validación](/validacion) a cada respuesta antes de mostrársela al usuario:

```python
import json
from pydantic import BaseModel, ValidationError

class ProductResponse(BaseModel):
    name: str
    price: float
    available: bool

def validate_response(model_text: str):
    try:
        data = json.loads(model_text)
        response = ProductResponse(**data)
        return response
    except (json.JSONDecodeError, ValidationError) as e:
        # The model response does not have the expected format
        return generate_fallback_response()
```

## Structured output: JSON mode

Muchos proveedores de [modelos](/modelos) ofrecen un **modo JSON** que fuerza al modelo a devolver JSON válido. Esto elimina uno de los problemas más comunes: que el modelo agregue texto adicional antes o después del JSON, o que genere JSON mal formado.

```python
response = client.chat.completions.create(
    model="gpt-4o",
    response_format={"type": "json_object"},
    messages=[
        {"role": "system", "content": "Always respond in JSON."},
        {"role": "user", "content": "Data for product X"}
    ]
)
```

## Filtrado de contenido

Para evitar respuestas dañinas o inapropiadas, podés implementar filtros en distintas capas:

- **Filtro de entrada:** Revisá el mensaje del usuario antes de mandarlo al modelo. Bloqueá intentos de inyección de prompts o contenido ofensivo.
- **Filtro de salida:** Revisá la respuesta del modelo antes de mostrársela al usuario. Buscá contenido que viole tus políticas.
- **Clasificadores de seguridad:** Usá un modelo secundario que clasifique si la respuesta es segura o no.

## Respuestas de fallback

Siempre tené una respuesta de respaldo para cuando algo falla. Si el modelo no responde, responde mal o la validación falla, tu aplicación tiene que seguir funcionando:

```python
FALLBACK = "I couldn't process your request. Please try again or contact support."

def get_response(question: str) -> str:
    try:
        response = call_model(question)
        if not passes_validation(response):
            return FALLBACK
        if not is_safe_content(response):
            return FALLBACK
        return response
    except Exception:
        return FALLBACK
```

Los guardrails no son opcionales. Son parte fundamental de cualquier aplicación seria que use IA. Pensá en ellos desde el principio, no como algo que agregás después.
