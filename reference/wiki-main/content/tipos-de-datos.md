---
title: "Tipos de datos"
description: "Las diferentes categorías de valores que un programa puede almacenar y manipular."
category: "Fundamentos"
order: 8
question: "¿Qué tipos de valores maneja un programa?"
related: ["base-de-datos", "validacion", "estado"]
---

## ¿Qué son los tipos de datos?

Cuando programás, manejás información todo el tiempo: nombres de usuarios, precios, si un botón está activo o no, listas de productos. Cada uno de estos valores tiene un **tipo** que define qué es y qué podés hacer con él. No es lo mismo un número (podés sumarle otro número) que un texto (podés convertirlo a mayúsculas). Entender los tipos de datos es fundamental para evitar errores y escribir código predecible.

## Tipos primitivos

Son los valores más básicos del lenguaje. En JavaScript tenés estos:

```javascript
// String: text
const name = "Maria";

// Number: numbers (integers and decimals)
const price = 4999.99;

// Boolean: true or false
const active = true;

// Null: intentional absence of value
const address = null;

// Undefined: declared variable with no assigned value
let phone;
console.log(phone); // undefined
```

| Tipo | Ejemplo | Uso típico |
|------|---------|------------|
| `string` | `"hola"`, `"usr_123"` | Nombres, emails, IDs |
| `number` | `42`, `3.14` | Precios, cantidades, edades |
| `boolean` | `true`, `false` | Flags, condiciones, [estado](/estado) |
| `null` | `null` | Valor vacío a propósito |
| `undefined` | `undefined` | Variable sin inicializar |

## Tipos complejos

Cuando necesitás agrupar datos, usás estructuras más elaboradas:

```javascript
// Array: ordered list of values
const colors = ["red", "green", "blue"];
console.log(colors[0]); // "red"

// Object: set of key-value pairs
const user = {
  name: "Carlos",
  age: 28,
  active: true,
};
console.log(user.name); // "Carlos"
```

Los arrays y objetos son los que más vas a usar. Gran parte de la programación web es recibir objetos desde una API, transformarlos y mostrarlos en la interfaz. Si trabajás con una [base de datos](/base-de-datos), cada registro es esencialmente un objeto con propiedades.

## Cuidado con la coerción de tipos

JavaScript intenta ser "amable" y convierte tipos automáticamente. Esto puede traer sorpresas desagradables:

```javascript
// Implicit coercion: unexpected results
"5" + 3      // "53" (concatenated strings)
"5" - 3      // 2 (subtracted numbers)
true + 1     // 2
"" == false  // true

// Always use === to compare without coercion
"5" === 5    // false (different types)
"5" == 5     // true (coercion, dangerous)
```

Esta es una fuente clásica de [bugs](/bugs). La regla de oro es: usá siempre `===` en vez de `==` y sé explícito cuando necesités convertir tipos.

## TypeScript: tipos con esteroides

Cuando tu proyecto crece, es fácil perder el control de qué tipo tiene cada variable. **TypeScript** agrega tipos estáticos a JavaScript: te obliga a declarar qué tipo de dato espera cada función y variable, y te avisa en tiempo de desarrollo si algo no encaja.

```typescript
function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}

calculateTotal(100, 3);      // OK
calculateTotal("100", 3);    // Error: "100" is not a number
```

TypeScript es especialmente útil para la [validación](/validacion) de datos: si definís bien tus tipos, muchos errores los atrapás antes de correr el código. En proyectos con [estado](/estado) complejo, como apps con muchas pantallas y formularios, tener tipos claros te ahorra horas de debugging.
