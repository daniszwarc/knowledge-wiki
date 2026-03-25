---
title: "Migraciones"
description: "Scripts que modifican la estructura de la base de datos de forma controlada y reversible."
category: "Datos"
order: 5
question: "¿Cómo se cambia la estructura de la base de datos?"
related: ["base-de-datos", "versionado", "deploy"]
---

Imaginá que tu app ya está en producción con miles de usuarios y necesitás agregar una columna nueva a una tabla. ¿Entrás a la [base de datos](/base-de-datos) y corrés un `ALTER TABLE` a mano? Eso es peligroso, no queda registro, y si algo sale mal no podés volver atrás. Para eso existen las **migraciones**.

## ¿Qué son las migraciones?

Las migraciones son **scripts versionados** (archivos de código con un número de orden) que describen cambios en la estructura de la base de datos. Cada migración tiene un timestamp (marca de fecha y hora) que indica cuándo se creó, y se ejecutan en orden. Pensá en ellas como un [control de cambios](/control-de-cambios) pero para la estructura de tu base de datos.

## Up y Down

Cada migración tiene dos funciones:

- **up**: aplica el cambio (crear tabla, agregar columna, etc.)
- **down**: deshace el cambio (borrar tabla, quitar columna, etc.)

Esto te permite avanzar y retroceder en el historial de cambios de tu base de datos.

```javascript
// Example with Knex.js
// File: 20240315120000_add_comments_table.js

exports.up = function(knex) {
  return knex.schema.createTable('comments', (table) => {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users');
    table.integer('article_id').references('id').inTable('articles');
    table.text('content').notNullable();
    table.timestamps(true, true); // created_at, updated_at
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('comments');
};
```

## Con Prisma

Si usás Prisma, el enfoque es diferente: definís tu esquema y Prisma genera las migraciones automáticamente.

```prisma
// schema.prisma
model Comment {
  id        Int      @id @default(autoincrement())
  content   String
  user      User     @relation(fields: [userId], references: [id])
  userId    Int
  article   Article  @relation(fields: [articleId], references: [id])
  articleId Int
  createdAt DateTime @default(now())
}
```

```bash
# Generate and apply the migration
npx prisma migrate dev --name add_comments
```

## ¿Por qué no hacer cambios manuales?

- **No queda registro**: nadie sabe qué se cambió ni cuándo
- **No es reproducible**: si tenés que configurar la base de datos de nuevo (en otro entorno, en la máquina de un compañero), no sabés qué ejecutar
- **No es reversible**: si algo sale mal, no hay forma de volver atrás automáticamente
- **No funciona en equipo**: cada desarrollador necesita saber qué cambios aplicar

## Migraciones en el deploy

Las migraciones se ejecutan como parte del proceso de [deploy](/deploy). Antes de que el nuevo código arranque, se corren las migraciones pendientes. Si una migración falla, el deploy se cancela.

```bash
# Typical deploy flow
npm run build          # Build the app
npm run migrate        # Run pending migrations
npm run start          # Start the app
```

## Buenas prácticas

- **Nunca edites una migración ya ejecutada**. Si necesitás corregir algo, creá una nueva migración.
- **Hacé las migraciones pequeñas y atómicas**. Un cambio por migración.
- **Testeá la migración down** para asegurarte de que realmente deshace el cambio.
- **Hacé un backup** de la base de datos antes de correr migraciones en producción.

Las migraciones son una de esas herramientas que parecen burocracia innecesaria hasta que te salvan de un desastre. Son al esquema de tu [base de datos](/base-de-datos) lo que los commits son al código.
