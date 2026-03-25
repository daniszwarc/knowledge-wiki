---
title: "Flujo de datos"
description: "El flujo de datos describe cómo la información viaja entre el usuario, el frontend, el backend y la base de datos en una aplicación."
category: "Fundamentos"
order: 5
question: "¿Cómo se mueve la información?"
related: ["api", "request-response", "estado"]
---

## La información tiene un camino

Cuando usás una app, la información no aparece mágicamente en tu pantalla. Sigue un recorrido bien definido entre distintas partes del sistema. Entender ese recorrido, el **flujo de datos**, te ayuda a comprender cómo funciona cualquier aplicación por dentro y, si algo falla, a saber dónde buscar el problema.

## El ciclo de petición y respuesta

El flujo más básico en una aplicación web es el ciclo **request/response** (petición y respuesta):

```
1. The user does something        →  Taps a button, loads a page
2. The frontend builds a request  →  Creates an HTTP request
3. The request travels to server  →  Through the internet, reaches the API
4. The backend processes it       →  Queries the database, applies logic
5. The backend responds           →  Returns data (usually in JSON)
6. The frontend receives the data →  Updates the state
7. The screen updates             →  The user sees the result
```

Este ciclo se repite constantemente. Cada vez que cargás tu feed de redes sociales, mandás un mensaje o hacés una búsqueda, este flujo ocurre en milisegundos.

## Flujo unidireccional

En el [frontend](/cliente-frontend) moderno, se usa mucho un patrón llamado **flujo unidireccional**. La idea es que los datos siempre fluyen en una sola dirección, lo que hace todo más predecible:

```
User action → State update → Screen re-render
     ↑                              |
     └──────────────────────────────┘
```

Por ejemplo, en React:

```jsx
// components/LikeButton.js

import { useState } from 'react';

export default function LikeButton() {
  const [likes, setLikes] = useState(0);

  // 1. The user clicks "Like"
  // 2. An action is dispatched
  const handleLike = () => {
    setLikes(likes + 1); // Updates the state
  };
  // 3. React detects the state change and re-renders
  // 4. The user sees the new number of likes

  return <button onClick={handleLike}>{likes} Likes</button>;
}
```

Esto es más fácil de razonar que un flujo donde cualquier parte puede modificar cualquier dato en cualquier momento (flujo bidireccional), que suele generar bugs difíciles de rastrear.

## Datos que van y vienen por la [API](/api)

La comunicación entre el frontend y el backend se hace a través de una [API](/api) usando el patrón de [petición y respuesta](/request-response). El frontend envía datos (por ejemplo, los campos de un formulario) y el backend responde con el resultado (por ejemplo, confirmación de que el usuario se registró). Los datos suelen viajar en formato JSON:

```json
// Request from frontend to backend
{ "email": "maria@example.com", "password": "myPassword123" }

// Response from backend to frontend
{ "ok": true, "user": { "id": 42, "name": "María" }, "token": "abc123" }
```

## ¿Por qué importa entender el flujo?

Porque cuando algo no funciona (un botón que no responde, datos que no aparecen, un formulario que no se envía), el problema está en algún punto de este flujo. Saber cómo se mueven los datos te permite diagnosticar problemas como un detective: ¿el frontend envió la petición? ¿El backend la recibió? ¿La respuesta llegó bien? ¿El [estado](/estado) se actualizó? Cada paso es un punto donde podés investigar.
