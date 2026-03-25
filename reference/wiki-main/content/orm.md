---
title: "ORM"
description: "Una herramienta que permite interactuar con la base de datos usando objetos en vez de SQL."
category: "Datos"
order: 6
question: "¿Cómo se habla con la base de datos desde el código?"
related: ["base-de-datos", "persistencia", "migraciones"]
---

Un **ORM** (Object-Relational Mapping) es una herramienta que te permite interactuar con tu [base de datos](/base-de-datos) usando el lenguaje de programación que ya conocés, sin necesidad de escribir SQL a mano. Traduce entre el mundo de los objetos (tu código) y el mundo de las tablas (la base de datos).

## ¿Cómo funciona?

En vez de escribir consultas SQL directamente, trabajás con **modelos** — clases u objetos que representan las tablas de tu base de datos. Cada instancia del modelo es una fila de la tabla.

Sin ORM:

```sql
INSERT INTO users (name, email) VALUES ('Ana', 'ana@mail.com');
SELECT * FROM users WHERE email = 'ana@mail.com';
UPDATE users SET name = 'Ana García' WHERE id = 1;
DELETE FROM users WHERE id = 1;
```

Con ORM (usando Prisma):

```javascript
// Create
await prisma.user.create({
  data: { name: 'Ana', email: 'ana@mail.com' }
});

// Read
const ana = await prisma.user.findUnique({
  where: { email: 'ana@mail.com' }
});

// Update
await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Ana García' }
});

// Delete
await prisma.user.delete({ where: { id: 1 } });
```

## ORMs populares en JavaScript/TypeScript

| ORM | Estilo | Características |
|-----|--------|-----------------|
| **Prisma** | Schema-first | Genera tipos TypeScript, migraciones automáticas |
| **Sequelize** | Code-first | Muy maduro, muchas features, API basada en clases |
| **TypeORM** | Decoradores | Inspirado en Java/Hibernate, usa decoradores TypeScript |
| **Drizzle** | SQL-like | Más cercano al SQL, liviano, buen rendimiento |

## Relaciones entre modelos

Una de las ventajas más grandes de un ORM es cómo maneja las **relaciones** entre tablas. En vez de hacer JOINs a mano, definís las relaciones en el modelo:

```javascript
// With Prisma: get a user with all their articles
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: { articles: true }  // automatic JOIN
});

// user.articles → [{id: 1, title: 'My first post'}, ...]
```

## Pros y contras

**Ventajas:**
- Escribís menos código y más legible
- Evitás errores de SQL y vulnerabilidades de inyección SQL
- Podés cambiar de base de datos (de MySQL a PostgreSQL, por ejemplo) con cambios mínimos
- Autocompletado y chequeo de tipos en el editor

**Desventajas:**
- Para consultas complejas, el SQL generado puede ser ineficiente
- Agrega una capa de abstracción que a veces oculta lo que realmente pasa
- Tenés que aprender la API del ORM además de entender SQL
- En operaciones masivas puede ser mucho más lento que SQL directo

## ¿Usar ORM o SQL puro?

No es una cosa o la otra. Muchos proyectos usan un ORM para las operaciones comunes (CRUD básico -- crear, leer, actualizar y borrar datos -- y relaciones simples) y SQL directo para las consultas complejas o críticas en rendimiento. La mayoría de los ORMs permiten ejecutar SQL crudo cuando lo necesitás.

Lo importante es que entiendas qué pasa por debajo. Un ORM te facilita la [persistencia](/persistencia) de datos, pero no reemplaza saber cómo funciona una [base de datos](/base-de-datos). Y cuando la estructura necesite cambios, usá [migraciones](/migraciones) para mantener todo bajo control.
