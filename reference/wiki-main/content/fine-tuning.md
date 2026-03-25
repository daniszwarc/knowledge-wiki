---
title: "Fine-tuning"
description: "El proceso de entrenar un modelo de IA existente con tus propios datos para especializarlo en una tarea."
category: "Inteligencia artificial"
order: 7
question: "¿Cómo se entrena un modelo con datos propios?"
related: ["modelos", "prompts", "embeddings"]
---

## ¿Qué es fine-tuning?

Fine-tuning es el proceso de tomar un [modelo](/modelos) de IA que ya fue entrenado (como GPT-4 o Llama) y seguir entrenándolo con tus propios datos para que se especialice en una tarea específica. No estás creando un modelo desde cero (eso cuesta millones de dólares y requiere cantidades enormes de datos). Estás ajustando un modelo existente para que entienda mejor tu dominio, tu formato o tu estilo. Pensá en la diferencia entre enseñarle un idioma a alguien desde cero y enseñarle vocabulario técnico a alguien que ya habla el idioma.

## ¿Cuándo conviene hacer fine-tuning?

No siempre necesitás fine-tuning. Conviene cuando:

- **Necesitás un formato consistente:** Por ejemplo, que siempre responda con un JSON específico o que clasifique textos en categorías que definiste vos.
- **Tenés un dominio especializado:** Terminología médica, legal, técnica o interna de tu empresa que el modelo base no maneja bien.
- **Los [prompts](/prompts) se te hacen muy largos:** Si estás mandando muchos ejemplos en cada request para que el modelo entienda qué hacer, fine-tuning puede "internalizar" esas instrucciones.

## Preparar los datos de entrenamiento

Los datos se preparan en formato **JSONL** (JSON Lines), donde cada línea es un ejemplo de conversación con el input y el output esperado:

```jsonl
{"messages": [{"role": "system", "content": "Classify support tickets."}, {"role": "user", "content": "I can't log in"}, {"role": "assistant", "content": "category: authentication, priority: high"}]}
{"messages": [{"role": "system", "content": "Classify support tickets."}, {"role": "user", "content": "I don't like the button color"}, {"role": "assistant", "content": "category: UI, priority: low"}]}
```

Necesitás como mínimo unas 50-100 muestras de buena calidad, aunque con más datos generalmente obtenés mejores resultados.

## Ejemplo con OpenAI

```bash
# Upload the training file
openai api files.create -f training_data.jsonl -p fine-tune

# Create the fine-tuning job
openai api fine_tuning.jobs.create \
  -m gpt-4o-mini-2024-07-18 \
  -t file-abc123
```

El proceso tarda entre minutos y horas dependiendo de la cantidad de datos. Cuando termina, tenés un modelo propio al que le hacés [inferencia](/inferencia) igual que a cualquier otro.

## Costos

Fine-tuning tiene dos costos: el **entrenamiento** (se paga una vez, basado en la cantidad de tokens de entrenamiento) y la **inferencia** (cada vez que usás tu modelo ajustado, que suele costar un poco más que el modelo base). Para GPT-4o mini, el entrenamiento ronda los $3 por millón de tokens.

## Fine-tuning vs. prompt engineering vs. RAG

| Enfoque | Cuándo usarlo | Costo |
|---------|--------------|-------|
| Prompt engineering | Primero siempre. Probá mejorar tus [prompts](/prompts) antes de cualquier otra cosa | Bajo |
| RAG (Retrieval-Augmented Generation) | Cuando necesitás que el modelo acceda a información actualizada o propia. Usá [embeddings](/embeddings) para buscar documentos relevantes y dárselos como contexto | Medio |
| Fine-tuning | Cuando necesitás cambiar el comportamiento o estilo del modelo de forma consistente | Alto |

En la práctica, estas técnicas se combinan. Podés tener un modelo fine-tuneado que además use RAG para consultar tu base de conocimiento.
