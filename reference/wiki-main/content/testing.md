---
title: "Testing"
description: "El testing es el proceso de verificar que el software funciona como se espera antes de que llegue a los usuarios."
category: "Testing"
order: 1
question: "¿Cómo se prueba que una app funcione?"
related: ["testing-automatizado", "bugs", "qa"]
---

## ¿Qué es el testing?

Cuando construís una app, necesitás alguna forma de saber que todo funciona bien. El **testing** (o pruebas de software) es justamente eso: un conjunto de técnicas para verificar que tu código hace lo que tiene que hacer. Pensalo como un control de calidad antes de entregar un producto. Si fabricás una silla, la probás antes de venderla. Con el software pasa lo mismo, solo que las formas de "probar" son más variadas.

## Testing manual vs. automatizado

La forma más básica de testing es la **prueba manual**: abrís la app, hacés clic en los botones, llenás formularios y verificás que todo se vea y funcione bien. Es intuitivo, pero tiene un problema grande: lleva tiempo, es repetitivo y es fácil que se te escape algo. Por eso existe el [testing automatizado](/testing-automatizado), donde escribís código que prueba tu código. Suena raro, pero es muy poderoso: podés correr cientos de pruebas en segundos.

## Tipos de tests

Hay distintos niveles de testing, y cada uno cubre una parte diferente de tu app:

- **Tests unitarios**: prueban una función o componente individual, de forma aislada. Por ejemplo, verificar que una función `sumar(2, 3)` devuelve `5`.
- **Tests de integración**: verifican que varias partes funcionen bien juntas. Por ejemplo, que un formulario envíe datos correctamente a la [API](/api) y guarde en la [base de datos](/base-de-datos).
- **Tests end-to-end (E2E)**: simulan lo que haría un usuario real, desde abrir el navegador hasta completar un flujo completo como registrarse o hacer una compra.

```javascript
// Example of a unit test with Jest
function add(a, b) {
  return a + b;
}

test('add 2 + 3 equals 5', () => {
  expect(add(2, 3)).toBe(5);
});
```

## ¿Por qué es importante testear?

Sin tests, cada cambio que hacés en el código es un salto de fe. ¿Rompiste algo sin darte cuenta? Solo lo vas a saber cuando un usuario te reporte un [bug](/bugs). Los tests te dan confianza para hacer cambios, refactorizar código y agregar funcionalidades sin miedo. Además, sirven como documentación viva: leyendo los tests podés entender qué se espera que haga cada parte del sistema.

## ¿Cuándo testear?

No necesitás testear absolutamente todo desde el día uno. Empezá por las partes más críticas: la lógica de negocio, los flujos de pago, la [autenticación](/autenticacion). A medida que el proyecto crece, vas sumando más tests. Lo importante es que el [QA](/qa) (Quality Assurance, o aseguramiento de calidad) y el testing sean parte de la cultura del equipo, no algo que se hace "cuando sobre tiempo" (spoiler: nunca sobra tiempo).
