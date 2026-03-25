---
title: "Base de datos"
description: "Un sistema organizado para almacenar, gestionar y recuperar información"
category: "Datos"
order: 1
question: "¿Dónde se guardan los datos?"
related: ["persistencia", "cache", "indexacion", "servidor-backend"]
---

Una **base de datos** es un sistema que permite almacenar y organizar información de manera estructurada para que puedas buscarla, modificarla y eliminarla de forma eficiente. Es como una biblioteca ultra organizada donde cada dato tiene su lugar.

## Tipos principales

### Bases de datos relacionales (SQL)

Organizan los datos en **tablas** con filas y columnas, como una planilla de cálculo. Las tablas se relacionan entre sí mediante claves.

| id | nombre | email |
|----|--------|-------|
| 1 | Ana | ana@mail.com |
| 2 | Carlos | carlos@mail.com |

Ejemplos populares: **PostgreSQL**, **MySQL**, **SQLite**.

Se consultan usando **SQL** (Structured Query Language):

```sql
SELECT name, email FROM users WHERE id = 1;
```

### Bases de datos no relacionales (NoSQL)

Almacenan datos de formas más flexibles: documentos JSON, pares clave-valor, grafos, etc. Son útiles cuando la estructura de los datos varía mucho.

Ejemplos populares: **MongoDB**, **Redis**, **Firebase**.

## Cómo se conectan

Las bases de datos viven en el [servidor](/servidor) y nunca se acceden directamente desde el [frontend](/frontend-y-backend). Siempre hay una [API](/api) en el medio que controla qué datos se pueden leer o modificar.

Esto es fundamental para la seguridad: la [autenticación](/autenticacion) verifica quién puede acceder a qué datos, y el backend se encarga de validar cada operación antes de tocar la base de datos.

## Conceptos clave

- **CRUD**: las cuatro operaciones básicas — Create (crear), Read (leer), Update (actualizar), Delete (eliminar)
- **Migraciones**: cambios controlados en la estructura de la base de datos
- **Índices**: estructuras que aceleran las búsquedas (como el índice de un libro)
- **Backup**: copias de seguridad para no perder datos
