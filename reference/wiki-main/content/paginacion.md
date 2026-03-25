---
title: "Paginación"
description: "Una técnica para dividir grandes conjuntos de datos en páginas más pequeñas y manejables."
category: "Datos"
order: 8
question: "¿Cómo se muestran miles de registros sin colapsar?"
related: ["base-de-datos", "api", "cache"]
---

Imaginá que tu [base de datos](/base-de-datos) tiene 50.000 productos. ¿Vas a cargar los 50.000 de una y mandárselos al usuario? No. El navegador se colgaría, la [API](/api) tardaría una eternidad, y nadie necesita ver 50.000 resultados a la vez. Para eso existe la **paginación**: dividir los datos en páginas más chicas.

## Paginación por offset

Es la más clásica. Usás `LIMIT` y `OFFSET` en SQL para pedir una "ventana" de datos:

```sql
-- Page 1: first 20 results
SELECT * FROM products ORDER BY id LIMIT 20 OFFSET 0;

-- Page 2: the next 20
SELECT * FROM products ORDER BY id LIMIT 20 OFFSET 20;

-- Page 3
SELECT * FROM products ORDER BY id LIMIT 20 OFFSET 40;
```

En la API se traduce a parámetros como `page` y `per_page`:

```
GET /api/products?page=2&per_page=20
```

```javascript
// pages/api/products.js (Next.js API Route)
export default async function handler(req, res) {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.per_page) || 20;
  const offset = (page - 1) * perPage;

  const products = await db.query(
    'SELECT * FROM products ORDER BY id LIMIT $1 OFFSET $2',
    [perPage, offset]
  );

  const total = await db.query('SELECT COUNT(*) FROM products');

  res.json({
    data: products.rows,
    pagination: {
      page,
      per_page: perPage,
      total: parseInt(total.rows[0].count),
      total_pages: Math.ceil(total.rows[0].count / perPage)
    }
  });
}
```

**El problema**: cuando el offset es muy grande (página 5000 de 10.000), la base de datos tiene que recorrer y descartar miles de filas antes de darte las que pedís. Es lento.

## Paginación por cursor

En vez de decir "dame la página 500", decís "dame los 20 resultados después de este ID". Es mucho más eficiente porque la base de datos puede usar el índice directamente:

```sql
-- Give me 20 products after ID 1000
SELECT * FROM products WHERE id > 1000 ORDER BY id LIMIT 20;
```

```javascript
// In the API
GET /api/products?cursor=1000&limit=20

// The response includes the cursor for the next page
{
  "data": [...],
  "next_cursor": 1020
}
```

**Ventaja**: rendimiento constante sin importar en qué parte del dataset estés.
**Desventaja**: no podés "saltar" directamente a la página 50.

## Infinite scroll vs páginas numeradas

En el frontend, tenés dos formas de presentar la paginación:

**Páginas numeradas**: el usuario ve "Página 1 de 500" y puede navegar. Funciona bien para búsquedas donde querés ir a un resultado específico. Usa offset.

**Infinite scroll**: a medida que el usuario hace scroll, se cargan más resultados automáticamente. Funciona bien para feeds (como Instagram o Twitter). Usa cursores.

## ¿Cuándo usar cada una?

| Escenario | Método | Razón |
|-----------|--------|-------|
| Tabla de datos con navegación | Offset | El usuario necesita saltar entre páginas |
| Feed de contenido | Cursor | Scroll continuo, no necesita saltar |
| Dataset muy grande (+100k) | Cursor | Offset se vuelve lento |
| Dataset chico (-1k) | Offset | Más simple de implementar |

Si la respuesta de tu API es lenta incluso con paginación, considerá agregar [cache](/cache) para las páginas más consultadas.
