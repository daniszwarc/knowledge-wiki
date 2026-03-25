---
title: "Tests de integración"
description: "Pruebas que verifican que múltiples partes de la aplicación funcionan correctamente juntas."
category: "Testing"
order: 7
question: "¿Cómo se prueba que todo funcione junto?"
related: ["testing", "testing-automatizado", "mocking", "api"]
---

## Qué son los tests de integración

Los tests de integración verifican que distintas partes de tu aplicación funcionen correctamente cuando se conectan entre sí. A diferencia de los tests unitarios (que prueban funciones individuales de forma aislada), acá lo que te interesa es comprobar que los componentes se comunican bien: que tu [API](/api) recibe un request, consulta la base de datos y devuelve la respuesta esperada.

## La pirámide de testing

Pensá en los tipos de tests como una pirámide:

- **Base (muchos)**: tests unitarios. Rápidos, aislados, baratos.
- **Medio (algunos)**: tests de integración. Más lentos, pero verifican que las piezas encajen.
- **Punta (pocos)**: tests end-to-end (E2E). Simulan al usuario real, son los más lentos y frágiles.

Los tests de integración están en el punto justo: te dan más confianza que los unitarios sin ser tan costosos como los E2E. Son el complemento perfecto del [testing automatizado](/testing-automatizado).

## Qué cubren los tests de integración

Algunos escenarios típicos:

- **Endpoints de API**: verificar que una ruta recibe datos, los procesa y responde correctamente.
- **Consultas a base de datos**: asegurarte de que tus queries devuelven lo esperado con datos reales.
- **Flujos completos**: por ejemplo, crear un usuario, loguearlo y verificar que puede acceder a un recurso protegido.

## Ejemplo con Next.js API routes

```javascript
// pages/api/users.js — Next.js API route
import db from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await db.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    return res.status(201).json(user.rows[0]);
  }
  res.status(405).end();
}
```

```javascript
// __tests__/api/users.test.js — Integration test with node-mocks-http
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/users';
import db from '../../lib/db';

describe('POST /api/users', () => {
  beforeEach(async () => {
    await db.query('DELETE FROM users');
  });

  afterAll(async () => {
    await db.close();
  });

  it('should create a user and return it', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { name: 'Laura', email: 'laura@example.com' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.name).toBe('Laura');
    expect(data.email).toBe('laura@example.com');
    expect(data.id).toBeDefined();
  });

  it('should return 400 if email is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { name: 'Laura' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBeDefined();
  });
});
```

## Base de datos de test

Para los tests de integración, usá una base de datos separada exclusiva para [testing](/testing). Nunca corras tests contra tu DB de producción o desarrollo. Podés configurar esto con variables de entorno:

```javascript
// lib/db.js — Database config for a Next.js project
const dbUrl = process.env.NODE_ENV === 'test'
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL;
```

## Setup y teardown

Mirá, un error común es que los tests dependan del orden en que se ejecutan. Para evitar esto:

- **beforeEach**: limpiá o reiniciá la DB antes de cada test.
- **afterAll**: cerrá conexiones a la DB cuando terminen todos los tests.
- **Datos de prueba**: cada test debería crear los datos que necesita y no depender de lo que dejó otro test.

Esto te garantiza que cada test corra de forma independiente y repetible, sin importar el orden de ejecución. Si combinás estos tests con una buena estrategia de [testing automatizado](/testing-automatizado) y coverage, vas a tener una suite de pruebas sólida.
