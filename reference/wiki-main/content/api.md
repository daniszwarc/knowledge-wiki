---
title: "API"
description: "Una interfaz que permite a dos aplicaciones comunicarse entre sí"
category: "Comunicación"
icon: "message-square"
order: 1
question: "¿Cómo se comunican las partes?"
related: ["request-response", "webhooks", "cliente-frontend", "servidor-backend"]
---

Una **API** (Application Programming Interface) es un conjunto de reglas y definiciones que permite a diferentes programas comunicarse entre sí. Pensá en una API como un mozo en un restaurante: vos (el cliente) hacés un pedido, el mozo lleva tu pedido a la cocina (el [servidor](/servidor)) y te trae la respuesta.

## Cómo funciona

Cuando usás una aplicación en tu celular para ver el clima, esa app le hace una **petición** a una API. La API recibe esa petición, busca los datos en el [servidor](/servidor), y devuelve una **respuesta** con la información del clima.

Las APIs más comunes en la web usan el protocolo HTTP y siguen un estilo llamado **REST**. Estas APIs definen **endpoints** (URLs específicas) para acceder a distintos recursos:

```text
GET    /api/users       → Get list of users
POST   /api/users       → Create a new user
GET    /api/users/123   → Get specific user
DELETE /api/users/123   → Delete user
```

## Formato de datos

Las APIs modernas generalmente intercambian datos en formato **JSON** (JavaScript Object Notation):

```json
{
  "name": "Maria",
  "age": 28,
  "email": "maria@example.com"
}
```

## Por qué son importantes

Las APIs son el pegamento que conecta el [frontend con el backend](/frontend-y-backend). Sin APIs, cada aplicación sería una isla aislada. Gracias a ellas, podés iniciar sesión con Google en otras apps, integrar mapas, procesar pagos, y mucho más.

La [autenticación](/autenticacion) es un aspecto clave de las APIs: necesitás verificar quién está haciendo cada petición para proteger los datos almacenados en tu [base de datos](/base-de-datos).
