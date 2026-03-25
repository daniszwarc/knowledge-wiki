---
title: "SDKs"
description: "Kits de desarrollo que facilitan la integración con servicios y plataformas externas."
category: "Ecosistema"
order: 7
question: "¿Cómo se integra fácilmente con servicios externos?"
related: ["apis-de-terceros", "integraciones-externas", "dependencias"]
---

## Qué es un SDK

Un **SDK** (Software Development Kit) es un conjunto de herramientas, librerías y documentación que una empresa o plataforma te da para que integres sus servicios en tu aplicación de manera más fácil. En vez de hacer peticiones HTTP crudas a una [API de terceros](/apis-de-terceros), usás el SDK que ya tiene funciones listas, manejo de errores, tipado y autenticación resuelta.

## SDK vs API

Es común confundir estos dos conceptos, pero son cosas diferentes:

- Una **API** es la interfaz: define qué endpoints existen, qué datos esperan y qué devuelven.
- Un **SDK** es una librería que **envuelve** esa API y te da una forma más cómoda de usarla desde tu lenguaje de programación.

Pensalo así: la API es el menú del restaurante, y el SDK es un asistente que lee el menú por vos, hace el pedido y te trae la comida a la mesa.

```js
// Without SDK: manual HTTP request to the Stripe API
const response = await fetch("https://api.stripe.com/v1/charges", {
  method: "POST",
  headers: {
    Authorization: "Bearer sk_test_xxx",
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: "amount=2000&currency=usd&source=tok_visa",
});
const charge = await response.json();

// With Stripe SDK: much simpler
const stripe = require("stripe")("sk_test_xxx");
const charge = await stripe.charges.create({
  amount: 2000,
  currency: "usd",
  source: "tok_visa",
});
```

La diferencia es clara: el SDK te abstrae los detalles de la petición HTTP, el formato de los datos y el manejo de headers.

## Ejemplos de SDKs populares

Prácticamente todo servicio externo que uses va a tener un SDK:

- **Stripe SDK**: Para procesar pagos. Maneja tokenización de tarjetas, suscripciones, webhooks.
- **AWS SDK**: Para interactuar con los servicios de Amazon (S3, DynamoDB, Lambda, etc.).
- **Firebase SDK**: Para autenticación, base de datos en tiempo real y almacenamiento de Google.
- **Twilio SDK**: Para enviar SMS y hacer llamadas telefónicas.
- **Supabase SDK**: Para base de datos, auth y storage con una interfaz tipo Firebase.

## Por qué usar SDKs

Podrías hacer todo manualmente con `fetch`, pero los SDKs te dan ventajas importantes:

- **Type safety** (seguridad de tipos): Los SDKs de TypeScript te dan autocompletado y detección de errores en tiempo de desarrollo.
- **Helpers y utilidades**: Funciones para tareas comunes como paginación, reintentos y transformación de datos.
- **Manejo de autenticación**: Gestionan tokens, refresh automático y headers de auth sin que vos te preocupes.
- **Manejo de errores**: Errores tipados y descriptivos en vez de respuestas HTTP genéricas.
- **Documentación integrada**: JSDoc o tipos que te explican cada parámetro desde tu editor.

## Instalando y usando un SDK

Los SDKs se instalan como cualquier otra [dependencia](/dependencias) de tu proyecto:

```bash
# Install the Supabase SDK
npm install @supabase/supabase-js
```

```js
// Initialize and use
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://your-project.supabase.co",
  "your-public-api-key"
);

// Read data
const { data, error } = await supabase
  .from("products")
  .select("*")
  .eq("category", "sneakers")
  .order("price", { ascending: true });

// Insert data
const { data, error } = await supabase
  .from("products")
  .insert({ name: "Air Max", price: 150, category: "sneakers" });
```

Mirá cómo el SDK te da una interfaz encadenada y legible. No necesitás saber la URL exacta del endpoint ni el formato del body. Todo eso lo maneja el SDK internamente.

Antes de hacer una integración, siempre fijate si el servicio tiene un SDK oficial para tu lenguaje. Te va a ahorrar horas de trabajo y te va a evitar errores comunes. Podés explorar más sobre cómo integrar servicios en [integraciones externas](/integraciones-externas) y [APIs de terceros](/apis-de-terceros).
