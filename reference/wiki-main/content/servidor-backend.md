---
title: "Servidor (Backend)"
description: "El backend es la parte de una aplicación que corre en el servidor, procesando datos, aplicando reglas de negocio y comunicándose con bases de datos."
category: "Fundamentos"
order: 3
question: "¿Qué pasa detrás de escena?"
related: ["cliente-frontend", "api", "base-de-datos", "servidores"]
---

## Lo que no ves pero hace que todo funcione

Cuando iniciás sesión en una app, escribís tu usuario y contraseña en el [frontend](/cliente-frontend) y tocás "Entrar". Pero, ¿quién verifica que esos datos sean correctos? ¿Quién busca tu información en la base de datos? Eso lo hace el **backend** (o servidor). Es toda la lógica que corre en una computadora remota, lejos de tu dispositivo, y se encarga del trabajo pesado que no ves.

## ¿Qué hace exactamente un backend?

El backend tiene varias responsabilidades clave:

- **Procesar pedidos**: cuando el frontend necesita datos, le manda una petición al backend a través de una [API](/api). El backend la recibe, la interpreta y responde.
- **Aplicar reglas de negocio**: por ejemplo, verificar que un usuario tenga saldo suficiente antes de aprobar una compra, o que no se pueda agendar un turno en un horario ya ocupado.
- **Comunicarse con la [base de datos](/base-de-datos)**: guardar información nueva, buscar registros existentes, actualizar o eliminar datos.
- **Manejar seguridad**: autenticar usuarios, verificar permisos, encriptar información sensible.

```
Flow example:

1. The user taps "Buy" in the app (frontend)
2. The frontend sends a request to the backend: "User #42 wants to buy product #7"
3. The backend checks: does the product exist? is there stock? does the user have balance?
4. If everything is OK, it records the purchase in the database
5. It responds to the frontend: "Purchase successful, order number: 12345"
6. The frontend shows the message to the user
```

## Lenguajes y tecnologías del backend

El backend se puede construir con muchos lenguajes de programación. Los más comunes son:

- **JavaScript/TypeScript** (con Node.js): permite usar el mismo lenguaje que en el frontend.
- **Python** (con Django o FastAPI): muy popular por su sintaxis clara.
- **Java** (con Spring): muy usado en empresas grandes y bancos.
- **Go**: conocido por su rendimiento y simplicidad.
- **C#** (con .NET): popular en el ecosistema Microsoft.

No hay un lenguaje "mejor"; la elección depende del proyecto, el equipo y las necesidades.

## El servidor como concepto

Cuando decimos "servidor", nos referimos a dos cosas. Por un lado, es el **programa** (software) que escucha peticiones y las responde. Por otro, es la **máquina** (hardware) donde corre ese programa, que vive en un data center o en la nube. Hoy en día, servicios como AWS, Google Cloud o Azure te permiten tener [servidores](/servidores) sin comprar una sola computadora física.

## La relación con el frontend

Backend y [frontend](/cliente-frontend) son como el salón y la cocina de un restaurante. El cliente (vos) interactúa con el salón: ve el menú, hace el pedido, recibe el plato. Pero la cocina es donde se prepara todo. Sin la cocina no hay comida; sin el salón no hay forma de atender al cliente. Juntos forman una aplicación completa.
