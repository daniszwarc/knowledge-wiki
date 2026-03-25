---
title: "Autenticación"
description: "El proceso de verificar la identidad de un usuario en una aplicación"
category: "Usuarios"
icon: "user-check"
order: 1
question: "¿Cómo sabe la app quién sos?"
related: ["autorizacion", "sesiones", "gestion-de-cuentas", "api"]
---

La **autenticación** es el proceso de verificar que alguien es quien dice ser. Cuando iniciás sesión en una aplicación con tu usuario y contraseña, estás pasando por un proceso de autenticación.

## Autenticación vs. Autorización

Son dos conceptos distintos que suelen confundirse:

- **Autenticación**: ¿Quién sos? → Verificar identidad
- **Autorización**: ¿Qué podés hacer? → Verificar permisos

Primero te autenticás (demostrás quién sos), y después el sistema decide qué estás autorizado a hacer.

## Métodos comunes

### Usuario y contraseña

El método más tradicional. Las contraseñas **nunca** se guardan como texto plano en la [base de datos](/base-de-datos); se almacenan como un **hash** (una versión transformada matemáticamente que no se puede revertir al texto original). No es encriptación: es una transformación de una sola vía.

### Tokens (JWT)

Después de autenticarte, el [servidor](/servidor) te da un **token** — una cadena de texto que funciona como un pase temporal. Cada vez que tu [frontend](/frontend-y-backend) hace una petición a la [API](/api), envía este token para demostrar que ya se autenticó.

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### OAuth

Permite iniciar sesión usando cuentas de otros servicios (Google, GitHub, etc.) sin compartir tu contraseña. Es el "Iniciar sesión con Google" que ves en muchas apps.

## El flujo típico

1. El usuario ingresa sus credenciales en el [frontend](/frontend-y-backend)
2. El frontend envía las credenciales a la [API](/api)
3. El [servidor](/servidor) verifica las credenciales contra la [base de datos](/base-de-datos)
4. Si son correctas, el servidor genera un **token** y lo devuelve
5. El frontend guarda el token y lo envía en cada petición futura

## Buenas prácticas

- Usar **HTTPS** siempre (encriptar la comunicación)
- Implementar **expiración de tokens** (no duran para siempre)
- Agregar **rate limiting** (limitar intentos de login para prevenir ataques)
- Considerar **autenticación de dos factores** (2FA) para mayor seguridad
