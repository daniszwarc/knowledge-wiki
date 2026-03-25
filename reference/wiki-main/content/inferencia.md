---
title: "Inferencia"
description: "La inferencia es el proceso en el que un modelo de IA ya entrenado genera respuestas a partir de datos nuevos."
category: "Inteligencia artificial"
order: 6
question: "¿Cómo genera respuestas una IA?"
related: ["modelos", "inputs-outputs", "api"]
---

## Inferencia vs. entrenamiento

Cuando se habla de [modelos](/modelos) de IA hay dos fases bien distintas: **entrenamiento** e **inferencia**. El entrenamiento es cuando el modelo aprende de los datos (puede tardar semanas y costar millones de dólares). La inferencia es cuando el modelo ya entrenado recibe un input nuevo y genera una respuesta. Cada vez que le preguntás algo a ChatGPT o a Claude, estás haciendo inferencia. El modelo no está aprendiendo nada nuevo; está aplicando lo que ya sabe.

## ¿Cómo funciona una llamada de inferencia?

En la práctica, hacer inferencia significa mandar un request a una [API](/api) con tus [inputs](/inputs-outputs) y recibir el output generado. El proceso por detrás es computacionalmente intensivo: el modelo procesa todos los tokens (las unidades en que se divide el texto, como palabras o fragmentos de palabras) de entrada y va generando tokens de salida uno por uno, eligiendo el más probable en cada paso.

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "What is inference?"}
    ]
  }'
```

## Latencia y velocidad

La **latencia** es el tiempo que tarda el modelo en empezar a responder, y depende de varios factores: el tamaño del modelo, la cantidad de tokens de entrada, la carga del servidor y la distancia geográfica. Los modelos más grandes son más lentos. Para mejorar la experiencia del usuario, muchas APIs soportan **streaming**: en vez de esperar a que el modelo genere toda la respuesta, te la van mandando token por token. Así el usuario ve cómo se va escribiendo la respuesta en tiempo real.

## Costos

La inferencia se cobra por **tokens procesados**, tanto los de entrada como los de salida. Modelos más capaces cuestan más por token. Un ejemplo aproximado:

| Modelo | Input (por 1M tokens) | Output (por 1M tokens) |
|--------|----------------------|----------------------|
| GPT-4o mini | ~$0.15 | ~$0.60 |
| GPT-4o | ~$2.50 | ~$10.00 |
| Claude Sonnet | ~$3.00 | ~$15.00 |

Optimizar tus [prompts](/prompts) para usar menos tokens tiene un impacto directo en lo que gastás. A escala, la diferencia entre un prompt de 500 tokens y uno de 2000 puede ser enorme.

## Inferencia en tu aplicación

Cuando construís una aplicación que usa IA, cada interacción del usuario genera una o más llamadas de inferencia. Tenés que pensar en cómo manejar la latencia (¿mostrás un spinner? ¿usás streaming?), cómo controlás los costos (¿ponés límites de uso? ¿cacheás respuestas comunes?) y cómo manejás errores (¿qué pasa si la API del modelo se cae?). Estas son las mismas preocupaciones que tendrías con cualquier servicio externo al que le hacés [requests](/request-response).
