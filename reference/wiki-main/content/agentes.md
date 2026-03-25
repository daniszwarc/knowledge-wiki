---
title: "Agentes"
description: "Un agente de IA es un sistema que puede tomar decisiones, usar herramientas y ejecutar acciones de forma autónoma."
category: "Inteligencia artificial"
icon: "brain"
order: 5
question: "¿Qué es un agente de IA?"
related: ["modelos", "prompts", "workflows"]
---

## ¿Qué es un agente?

Un agente de IA es un programa que va más allá de simplemente responder preguntas: puede **razonar**, **decidir** qué hacer y **ejecutar acciones** por su cuenta. Mientras que un [modelo](/modelos) normal recibe un [prompt](/prompts) y devuelve una respuesta, un agente puede analizar la situación, elegir qué herramienta usar, ejecutarla, ver el resultado y decidir el siguiente paso. Es como la diferencia entre un asistente que contesta preguntas y uno que además puede mandarte mails, reservarte turnos y hacer compras.

## ¿Cómo funciona un agente?

El agente opera en un **loop** (ciclo) continuo. En cada iteración:

1. **Observa:** Recibe información del entorno o del usuario.
2. **Piensa:** Usa un LLM (modelo de lenguaje, como GPT o Claude) para razonar sobre qué hacer.
3. **Actúa:** Ejecuta una herramienta o acción.
4. **Evalúa:** Analiza el resultado y decide si terminó o necesita otro paso.

```
┌──────────────────────────────┐
│  User: "Find me cheap        │
│  flights to Bariloche"       │
│              │                │
│              ▼                │
│  Agent thinks: I need to     │
│  search flights → uses       │
│  search tool                 │
│              │                │
│              ▼                │
│  Result: 5 options           │
│              │                │
│              ▼                │
│  Agent thinks: filter        │
│  the cheapest → responds     │
└──────────────────────────────┘
```

## Tool use: el superpoder de los agentes

Lo que hace poderosos a los agentes es el **tool use** (uso de herramientas). Le definís al modelo un conjunto de funciones que puede llamar, como buscar en una base de datos, hacer un request HTTP, leer un archivo o ejecutar código. El modelo decide cuándo y cómo usar cada herramienta según lo que necesite. Esto conecta la capacidad de razonamiento del modelo con acciones concretas en el mundo real.

## Ejemplos de agentes

Los agentes ya están en todos lados:

- **Agentes de código:** Como Claude Code o GitHub Copilot agent, que pueden leer tu código, editarlo, correr tests y hacer commits.
- **Asistentes de atención al cliente:** Que buscan en la base de datos del cliente, consultan el historial de pedidos y resuelven problemas.
- **Agentes de investigación:** Que buscan información en múltiples fuentes, la sintetizan y generan reportes.
- **Automatizaciones inteligentes:** Que combinan agentes con [workflows](/workflows) para ejecutar procesos de negocio complejos.

## Consideraciones importantes

Los agentes son potentes pero hay que diseñarlos con cuidado. Cada paso del loop implica una llamada al modelo (que consume recursos y plata), así que pueden ser costosos. También necesitás manejar errores: ¿qué pasa si una herramienta falla? ¿Y si el agente entra en un loop infinito? Definir buenos límites, timeouts y mecanismos de fallback es clave para que un agente funcione bien en producción.
