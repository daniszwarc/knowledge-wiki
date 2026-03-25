---
title: "Indexación"
description: "Una técnica de bases de datos que crea estructuras auxiliares para encontrar datos mucho más rápido sin recorrer toda la tabla."
category: "Datos"
order: 4
question: "¿Cómo se buscan datos rápidamente?"
related: ["base-de-datos", "persistencia"]
---

## ¿Qué es un índice?

Pensá en un libro de 500 páginas. Si querés encontrar dónde se habla de "autenticación", tenés dos opciones: leer página por página (lento) o ir al **índice** al final del libro y ver directamente que está en la página 234 (rápido). Los índices en [bases de datos](/base-de-datos) funcionan exactamente igual: son estructuras auxiliares que le permiten al motor de la base encontrar datos sin tener que revisar cada fila de la tabla.

## ¿Cómo funcionan por dentro?

Sin un índice, cuando hacés una consulta como `SELECT * FROM usuarios WHERE email = 'ana@mail.com'`, la base de datos tiene que hacer un **full table scan** (recorrer la tabla entera): revisar fila por fila hasta encontrar el resultado. Si tenés 1 millón de usuarios, eso puede ser muy lento.

Con un índice en la columna `email`, la base de datos crea una estructura (generalmente un **B-tree**, un tipo de árbol de datos optimizado para búsquedas) que organiza los valores de forma ordenada, permitiendo encontrar cualquier valor en muy pocos pasos:

```
Without index:  O(n)     → scan 1,000,000 rows
With index:     O(log n) → ~20 steps at most
```

Crear un índice es tan simple como una línea de SQL:

```sql
-- Create an index on the email column
CREATE INDEX idx_users_email ON users(email);

-- Unique index (does not allow duplicates)
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Composite index (for queries that filter by multiple columns)
CREATE INDEX idx_orders_user_date ON orders(user_id, date);
```

## ¿Cuándo crear un índice?

No todas las columnas necesitan un índice. La regla general es: creá índices en columnas que aparecen frecuentemente en:

- **WHERE**: `WHERE email = '...'`
- **JOIN**: `JOIN pedidos ON usuarios.id = pedidos.usuario_id`
- **ORDER BY**: `ORDER BY fecha DESC`
- **Búsquedas frecuentes**: Cualquier campo por el que los usuarios busquen seguido.

```sql
-- These queries benefit from an index
SELECT * FROM products WHERE category = 't-shirts' ORDER BY price;
-- Recommended index:
CREATE INDEX idx_products_cat_price ON products(category, price);
```

Un buen truco es usar **EXPLAIN** para ver cómo la base ejecuta tu consulta y si está usando índices o no:

```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'ana@mail.com';
-- Shows you if it uses "Index Scan" (good) or "Seq Scan" (no index)
```

## Los trade-offs: no todo es gratis

Los índices aceleran las lecturas, pero tienen un costo:

- **Espacio en disco**: Cada índice ocupa espacio extra. Si tenés una tabla con 10 índices, estás almacenando la información de esas columnas de forma duplicada.
- **Escrituras más lentas**: Cada vez que insertás, actualizás o borrás una fila, la base tiene que actualizar todos los índices de esa tabla. Si tenés muchos índices, las escrituras se vuelven más lentas.
- **Mantenimiento**: Los índices pueden fragmentarse con el tiempo y necesitan reorganizarse.

| Operación | Sin índice | Con índice |
|-----------|-----------|------------|
| **SELECT (búsqueda)** | Lenta | Rápida |
| **INSERT** | Rápida | Un poco más lenta |
| **UPDATE** | Lenta (buscar) + rápida (escribir) | Rápida (buscar) + un poco más lenta (escribir + actualizar índice) |
| **DELETE** | Lenta (buscar) | Rápida (buscar) + actualizar índice |

## Buenas prácticas

Como regla general, indexá las columnas que se leen mucho y se escriben poco. Las claves primarias ya tienen índice automáticamente. Para columnas con pocos valores distintos (como un campo `activo` que es `true` o `false`), un índice no ayuda mucho porque no descarta suficientes filas. Y si tenés consultas que combinan varias columnas, los **índices compuestos** son mucho más efectivos que varios índices individuales. La [persistencia](/persistencia) de datos y la indexación van de la mano: guardar datos es solo la mitad del trabajo, la otra mitad es poder encontrarlos rápido.
