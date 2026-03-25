---
title: "GraphQL"
description: "Un lenguaje de consultas para APIs que permite pedir exactamente los datos que necesitás."
category: "Comunicación"
order: 5
question: "¿Cómo pedir solo los datos que necesitás?"
related: ["api", "request-response", "cliente-frontend"]
---

**GraphQL** es un lenguaje de consultas para APIs desarrollado por Facebook (ahora Meta) en 2012 y liberado como open source en 2015. A diferencia de REST, donde el servidor decide qué datos devolver en cada endpoint, con GraphQL sos vos (el cliente) quien especifica exactamente qué datos necesitás.

## El problema con REST

Imaginá que estás construyendo una pantalla de perfil de usuario. Necesitás el nombre, el avatar y sus últimos 3 posts. Con una [API](/api) REST tradicional, podrías necesitar hacer varios requests:

```
GET /api/users/123          → Returns ALL user data (20 fields, you only need 2)
GET /api/users/123/posts    → Returns ALL posts (you only need 3)
```

Esto tiene dos problemas: **over-fetching** (te trae más datos de los que necesitás, desperdiciando ancho de banda) y **under-fetching** (necesitás hacer múltiples requests porque uno solo no te alcanza). GraphQL resuelve ambos.

## Queries: pedí lo que necesitás

Con GraphQL, mandás una **query** describiendo exactamente la estructura de datos que querés:

```graphql
query {
  user(id: "123") {
    name
    avatar
    posts(limit: 3) {
      title
      date
    }
  }
}
```

Y el servidor te responde con exactamente eso, nada más:

```json
{
  "data": {
    "user": {
      "name": "María",
      "avatar": "https://example.com/maria.jpg",
      "posts": [
        { "title": "My first post", "date": "2024-01-15" },
        { "title": "Learning GraphQL", "date": "2024-01-10" },
        { "title": "Hello world", "date": "2024-01-05" }
      ]
    }
  }
}
```

Un solo [request](/request-response), solo los datos que necesitás.

## Mutations: modificar datos

Las **queries** son para leer. Para crear, actualizar o borrar datos usás **mutations**:

```graphql
mutation {
  createPost(input: { title: "New post", content: "Hello everyone" }) {
    id
    title
    date
  }
}
```

## Subscriptions: datos en tiempo real

Las **subscriptions** te permiten escuchar cambios en tiempo real. El servidor te avisa cuando algo cambia, sin que vos tengas que preguntar:

```graphql
subscription {
  newMessage(room: "general") {
    text
    author
    date
  }
}
```

## El schema: el contrato

Todo en GraphQL se define a través de un **schema** que actúa como contrato entre el [cliente](/cliente-frontend) y el servidor. El schema define qué datos existen, qué tipos tienen y qué operaciones se pueden hacer:

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Query {
  user(id: ID!): User
  users: [User!]!
}
```

Esto hace que la API sea **autodocumentada**: el schema te dice todo lo que podés hacer.

## ¿Cuándo usar GraphQL vs REST?

Usá **GraphQL** cuando tu frontend necesita flexibilidad para pedir datos distintos en cada pantalla, cuando tenés múltiples clientes (web, mobile) con necesidades diferentes, o cuando el over-fetching se vuelve un problema de performance.

Quedáte con **REST** cuando tu [API](/api) es simple, los endpoints devuelven justo lo que necesitás, o tu equipo ya tiene experiencia sólida con REST. No todo proyecto necesita GraphQL, y agregar esa complejidad sin un problema real que resolver no tiene mucho sentido.
