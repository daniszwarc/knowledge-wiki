---
title: "CORS"
description: "Un mecanismo de seguridad que controla qué dominios pueden acceder a los recursos de tu servidor."
category: "Internet"
order: 7
question: "¿Por qué el navegador bloquea peticiones a otros dominios?"
related: ["api", "http-https", "requests-en-red"]
---

## Qué es CORS

**CORS** (Cross-Origin Resource Sharing) es un mecanismo de seguridad implementado por los navegadores que controla qué dominios pueden hacer [peticiones en red](/requests-en-red) a tu servidor. Si tu frontend corre en `https://miapp.com` y tu [API](/api) está en `https://api.miapp.com`, el navegador va a bloquear las peticiones a menos que el servidor las autorice explícitamente mediante headers CORS.

## La política del mismo origen

Todo empieza con la **same-origin policy** (política del mismo origen). El navegador considera que dos URLs tienen el mismo origen si comparten el mismo **protocolo**, **dominio** y **puerto**:

```
https://myapp.com:443/page      ← origin
  ↓         ↓        ↓
protocol   domain   port

✅ https://myapp.com/other-page      → same origin
❌ http://myapp.com/page             → different protocol
❌ https://api.myapp.com/data        → different domain
❌ https://myapp.com:3000/page       → different port
```

Si una petición va a un origen distinto, el navegador la bloquea por defecto. CORS es el mecanismo que le dice al navegador: "Tranquilo, este otro origen tiene permiso".

## Preflight requests

Para peticiones que no son simples (por ejemplo, un `POST` con `Content-Type: application/json`), el navegador envía primero una **preflight request** (peticion de "verificacion previa"): una peticion `OPTIONS` al servidor preguntando si la peticion real esta permitida. Es como tocar el timbre antes de entrar.

```
OPTIONS /api/users HTTP/1.1
Origin: https://myapp.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type
```

El servidor responde indicando qué permite:

```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://myapp.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

Solo si el servidor responde correctamente, el navegador envía la petición real.

## Headers CORS principales

- **Access-Control-Allow-Origin**: Qué orígenes pueden acceder. Puede ser un dominio específico o `*` (todos, pero no recomendado en producción).
- **Access-Control-Allow-Methods**: Qué métodos HTTP están permitidos.
- **Access-Control-Allow-Headers**: Qué headers personalizados se aceptan.
- **Access-Control-Allow-Credentials**: Si se permiten cookies en peticiones cross-origin.

## Configuración en el servidor

La forma más sencilla de habilitar CORS es configurar los headers en tus rutas de API:

```js
// pages/api/data.js (Next.js API Route)
export default function handler(req, res) {
  // Set CORS headers to allow only your frontend
  res.setHeader("Access-Control-Allow-Origin", "https://myapp.com");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  res.status(200).json({ message: "This works from myapp.com" });
}
```

## Errores comunes y soluciones

- **"No 'Access-Control-Allow-Origin' header"**: Tu servidor no está enviando los headers CORS. Agregá el middleware.
- **"Credentials flag is true but Access-Control-Allow-Origin is '*'"**: No podés usar `credentials: true` con `origin: "*"`. Especificá el dominio exacto.
- **El preflight falla**: Asegurate de que tu servidor responda a peticiones `OPTIONS` en las rutas de tu API.

Recordá que CORS es una protección del **navegador**. Si hacés una petición desde un servidor (backend a backend), CORS no aplica. Solo se activa cuando el navegador detecta que un script intenta acceder a un origen diferente usando [HTTP/HTTPS](/http-https).
