---
title: "Mocking"
description: "Una técnica de testing que simula dependencias externas para probar código de forma aislada."
category: "Testing"
order: 6
question: "¿Cómo se testea código que depende de servicios externos?"
related: ["testing", "testing-automatizado", "api"]
---

## Qué es mocking

Mocking es una técnica de [testing](/testing) que consiste en reemplazar dependencias reales (como bases de datos, APIs externas o servicios de terceros) por versiones simuladas que vos controlás. La idea es simple: si querés probar que tu función de "crear usuario" funciona bien, no necesitás conectarte a una base de datos real cada vez que corrés los tests.

## Por qué usar mocks

Pensá en lo que pasa si tus tests dependen de servicios reales:

- **Son lentos**: cada test hace llamadas de red o consultas a una DB.
- **Son frágiles**: si la API externa se cae, tus tests fallan aunque tu código esté perfecto.
- **Tienen efectos secundarios**: podrías estar enviando emails reales o creando registros en producción.

Con mocks, tus tests corren rápido, de forma aislada y predecible. Esto es fundamental para un buen flujo de [testing automatizado](/testing-automatizado).

## Mocks vs stubs vs spies

Aunque muchas veces se usan como sinónimos, hay diferencias sutiles:

- **Mock**: un objeto que simula el comportamiento de una dependencia y además puede verificar cómo fue usado (si fue llamado, cuántas veces, con qué argumentos).
- **Stub**: una versión simplificada que siempre devuelve un valor fijo. No verifica interacciones.
- **Spy**: envuelve la implementación real y registra las llamadas, sin cambiar el comportamiento original.

## Ejemplo con Jest

```javascript
// lib/users.js
export async function getUser(id) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

```javascript
// lib/users.test.js
import { getUser } from "./users";

global.fetch = jest.fn();

test("devuelve los datos del usuario", async () => {
  fetch.mockResolvedValue({
    json: async () => ({ id: 1, name: "Ana" }),
  });

  const user = await getUser(1);

  expect(user).toEqual({ id: 1, name: "Ana" });
  expect(fetch).toHaveBeenCalledWith("/api/users/1");
});
```

Leelo en este orden:

- `fetch` no hace una llamada real.
- Vos decidís qué devuelve el mock.
- El test valida la lógica de `getUser`, no el comportamiento de la red.

## Mockear módulos propios

También podés mockear tus propios módulos. Esto es útil cuando un módulo depende de otro y querés testear cada uno por separado:

```javascript
jest.mock("./database", () => ({
  save: jest.fn().mockResolvedValue({ id: 1 }),
  findByEmail: jest.fn().mockResolvedValue(null),
}));
```

La misma idea se repite: reemplazás una dependencia real por una versión controlada por el test.

## Cuándo no mockear

Mirá, no todo debería ser un mock. Si mockeás demasiado, terminás testeando que tus mocks funcionan en vez de testear tu código real. Evitá mockear:

- **Lógica pura** que no tiene dependencias externas.
- **Todo en tests de integración**: ahí el objetivo es justamente probar que las partes funcionan juntas.
- **Estructuras de datos simples** como arrays u objetos.

La regla general es: mockeá lo que cruza los límites de tu sistema (red, disco, servicios externos) y dejá el resto real. Encontrar ese balance es clave para tener tests que realmente te den confianza en tu código.
