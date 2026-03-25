---
title: "Request / Response"
description: "El modelo de comunicación donde un cliente envía un pedido (request) y el servidor devuelve una respuesta (response)."
category: "Comunicación"
order: 2
question: "¿Cómo son los mensajes entre cliente y servidor?"
related: ["api", "http-https", "cliente-frontend"]
---

## ¿Qué es el ciclo request/response?

Cada vez que usás una app o un sitio web, tu navegador (o cualquier cliente) está mandando **requests** (pedidos) a un servidor, y ese servidor te devuelve **responses** (respuestas). Es como ir a un restaurante: vos hacés un pedido al mozo (request) y el mozo te trae la comida (response). Toda la comunicación entre cliente y servidor en la web funciona con este modelo.

## Métodos HTTP: los tipos de pedido

No todos los pedidos son iguales. HTTP define varios **métodos** para indicar qué querés hacer:

- **GET**: Pedir datos. Por ejemplo, cargar una página o traer una lista de productos.
- **POST**: Enviar datos nuevos. Por ejemplo, crear una cuenta o subir un comentario.
- **PUT**: Actualizar datos existentes. Por ejemplo, editar tu perfil.
- **DELETE**: Borrar algo. Por ejemplo, eliminar una publicación.

```http
GET /api/products HTTP/1.1
Host: my-store.com
```

```http
POST /api/products HTTP/1.1
Host: my-store.com
Content-Type: application/json

{
  "name": "T-Shirt",
  "price": 5000
}
```

Estos métodos son parte fundamental de cómo se diseñan las [APIs](/api).

## Status codes: ¿cómo te fue?

Cada response viene con un **código de estado** (status code) que te dice si todo salió bien o si hubo algún problema:

- **200 OK**: Todo perfecto, acá tenés lo que pediste.
- **201 Created**: Se creó el recurso que mandaste.
- **400 Bad Request**: El pedido tiene algo mal (datos faltantes, formato incorrecto).
- **401 Unauthorized**: No estás autenticado.
- **404 Not Found**: Eso que buscás no existe.
- **500 Internal Server Error**: Algo falló en el servidor.

Los códigos que empiezan con **2xx** son éxito, los **4xx** son errores del cliente, y los **5xx** son errores del servidor.

## Headers y body: las partes del mensaje

Tanto el request como el response tienen dos partes importantes además de la línea inicial:

- **Headers** (encabezados): Metadatos del mensaje. Por ejemplo, `Content-Type: application/json` le dice al servidor que le estás mandando JSON. `Authorization: Bearer token123` lleva tu token de autenticación.
- **Body** (cuerpo): Los datos en sí. En un GET normalmente no mandás body, pero en un POST o PUT sí llevás la información que querés enviar o actualizar.

```javascript
// Example with fetch in JavaScript
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer my-token'
  },
  body: JSON.stringify({ name: 'Maria', email: 'maria@mail.com' })
});

const data = await response.json();
console.log(response.status); // 201
```

## Resumen

El modelo request/response es la base de la comunicación web. Entender los métodos HTTP, los códigos de estado, los headers y el body te da las herramientas para trabajar con cualquier [API](/api) y entender qué pasa cuando tu app se comunica con un servidor. Si querés explorar alternativas donde el servidor avisa sin que le pidas, mirá [Webhooks](/webhooks).
