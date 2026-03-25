---
title: "HTTP / HTTPS"
description: "HTTP es el protocolo que define cómo se comunican el navegador y el servidor; HTTPS agrega una capa de encriptación para proteger esos datos."
category: "Internet"
order: 3
question: "¿Cómo viajan los datos por internet?"
related: ["dns", "request-response", "api"]
---

## El idioma de la web

Cuando tu navegador necesita cargar una página o enviar datos, usa un **protocolo**: un conjunto de reglas que ambas partes (navegador y [servidor](/servidores)) entienden. **HTTP** (HyperText Transfer Protocol) es ese protocolo. Cada vez que visitás un sitio, tu navegador envía una **petición HTTP** al servidor, y el servidor responde con los datos pedidos. Es el mecanismo fundamental detrás del [request/response](/request-response).

## HTTP vs HTTPS

**HTTPS** es HTTP con una capa de seguridad llamada **TLS** (Transport Layer Security, antes conocido como SSL). La diferencia es crucial:

- **HTTP**: Los datos viajan en texto plano. Cualquier persona en la misma red podría interceptarlos y leerlos.
- **HTTPS**: Los datos se encriptan antes de viajar. Aunque alguien los intercepte, solo ve información ilegible.

Hoy en día, HTTPS es prácticamente obligatorio. Los navegadores marcan los sitios HTTP como "No seguro", Google los penaliza en el ranking, y servicios como Let's Encrypt te dan certificados SSL/TLS gratis. Si estás deployando una app, plataformas como Vercel o Netlify configuran HTTPS automáticamente.

## Métodos HTTP

HTTP define varios **métodos** (o verbos) que indican qué querés hacer con un recurso. Los más comunes son:

```
Method    Usage                       Example
───────── ─────────────────────────── ──────────────────────────
GET       Get data                    Load a page or list
POST      Send/create data            Submit a form
PUT       Replace a resource          Update an entire profile
PATCH     Partially modify            Change only the email
DELETE    Delete a resource           Delete an account
```

Cuando una [API](/api) sigue el estilo REST, usa estos métodos de manera consistente para que sea predecible y fácil de entender.

## Headers y status codes

Cada petición y respuesta HTTP incluye **headers** (encabezados) con metadatos. Algunos headers comunes:

```
Content-Type: application/json       → The data format
Authorization: Bearer eyJhbGci...    → Authentication token
Cache-Control: max-age=3600          → How long to cache
```

Las respuestas también traen un **código de estado** que te dice qué pasó:

| Rango | Significado | Ejemplos |
|-------|-------------|----------|
| **2xx** | Todo salió bien | `200 OK`, `201 Created` |
| **3xx** | Redirección | `301 Moved Permanently`, `304 Not Modified` |
| **4xx** | Error del cliente | `400 Bad Request`, `401 Unauthorized`, `404 Not Found` |
| **5xx** | Error del servidor | `500 Internal Server Error`, `503 Service Unavailable` |

Conocer estos códigos te ayuda mucho a la hora de debuguear. Si tu app recibe un `401`, sabés que el problema es de [autenticación](/autenticacion). Si recibe un `500`, el error está en el servidor.

## HTTPS en la práctica

El flujo de una conexión HTTPS incluye un paso extra llamado **TLS handshake** (literalmente, un "apretón de manos") donde el navegador y el servidor se ponen de acuerdo en cómo encriptar la comunicación. Esto agrega unos milisegundos a la primera conexión, pero después las peticiones fluyen con normalidad. Para el usuario final es transparente: simplemente ve el candadito en la barra de direcciones y sabe que la conexión es segura.
