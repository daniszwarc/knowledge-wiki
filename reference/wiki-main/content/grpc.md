---
title: "gRPC"
description: "Un protocolo de comunicación de alto rendimiento para conectar servicios entre sí."
category: "Comunicación"
order: 6
question: "¿Cómo se comunican los servicios de forma eficiente?"
related: ["api", "servicios", "streaming"]
---

**gRPC** (Google Remote Procedure Call) es un framework de comunicación de alto rendimiento creado por Google. Permite que un [servicio](/servicios) llame a funciones de otro servicio como si fueran funciones locales, pero a través de la red. Es como hacer una llamada telefónica entre dos servidores donde ambos se entienden perfectamente porque hablan el mismo idioma.

## ¿Qué problema resuelve?

Cuando tenés múltiples [servicios](/servicios) que necesitan comunicarse entre sí (lo que se llama arquitectura de microservicios), usar una [API](/api) REST con JSON puede ser lento. Cada request tiene que convertir los datos a texto JSON, enviarlos, y el receptor tiene que leerlos y convertirlos de vuelta. Para comunicación interna entre servicios que se hablan miles de veces por segundo, eso es un cuello de botella.

## Protocol Buffers: binario en vez de texto

En lugar de JSON (texto legible), gRPC usa **Protocol Buffers** (protobuf) como formato de serialización (es decir, la forma en que los datos se convierten para poder ser enviados). Los datos se envían en **formato binario** (ceros y unos directamente, en vez de texto que podés leer), lo que es mucho más compacto y rápido de procesar.

Primero definís la estructura de tus datos y servicios en un archivo `.proto`:

```protobuf
syntax = "proto3";

service UserService {
  rpc GetUser (UserRequest) returns (UserResponse);
  rpc ListUsers (ListRequest) returns (stream UserResponse);
}

message UserRequest {
  string id = 1;
}

message UserResponse {
  string id = 1;
  string name = 2;
  string email = 3;
}
```

A partir de este archivo, gRPC genera automáticamente el código del cliente y del servidor en el lenguaje que necesites (JavaScript, Python, Go, Java, etc.).

## Tipos de comunicación

gRPC soporta cuatro patrones de comunicación:

```
1. Unary:            Client ──request──→ Server ──response──→ Client
2. Server streaming: Client ──request──→ Server ══multiple══→ Client
3. Client streaming: Client ══multiple══→ Server ──response──→ Client
4. Bidirectional:    Client ══multiple══⇄══multiple══ Server
```

El [streaming](/streaming) bidireccional es una de las grandes ventajas de gRPC. Pensá en un servicio de chat interno entre microservicios, o en un servicio que procesa datos en tiempo real y va devolviendo resultados parciales.

## Ejemplo: cliente en Node.js

```javascript
// lib/grpc-client.js
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

// Load the service definition
const packageDef = protoLoader.loadSync('user.proto');
const proto = grpc.loadPackageDefinition(packageDef);

// Create the client
const client = new proto.UserService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

export default client;

// pages/api/user/[id].js — use gRPC from a Next.js API route
import client from '../../../lib/grpc-client';

export default function handler(req, res) {
  const { id } = req.query;

  client.GetUser({ id }, (error, response) => {
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ name: response.name }); // "María"
  });
}
```

## gRPC vs REST: cuándo usar cada uno

| Aspecto | REST | gRPC |
|---------|------|------|
| Formato | JSON (texto) | Protobuf (binario) |
| Velocidad | Buena | Muy alta |
| Legibilidad | Fácil de leer | Necesitás el `.proto` |
| Navegador | Soporte nativo | Necesita gRPC-Web |
| Uso típico | APIs públicas | Comunicación entre servicios |
| [Streaming](/streaming) | Limitado | Bidireccional nativo |

Usá **gRPC** para comunicación interna entre [servicios](/servicios), cuando la velocidad es crítica, o cuando necesitás streaming bidireccional. Usá **REST** para [APIs](/api) públicas que consumen navegadores o clientes externos, donde la legibilidad y simplicidad importan más que la velocidad pura.
