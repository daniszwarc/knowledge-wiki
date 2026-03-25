---
title: "Testing automatizado"
description: "El testing automatizado consiste en escribir código que verifica automáticamente que tu software funciona correctamente."
category: "Testing"
order: 4
question: "¿Cómo se automatizan las pruebas?"
related: ["testing", "pipelines", "deploy"]
---

## ¿Qué es el testing automatizado?

El testing automatizado es escribir programas que prueban tus programas. En lugar de abrir la app y verificar manualmente que todo funcione, escribís scripts que hacen eso por vos, de forma automática y repetible. Podés correr cientos de pruebas en segundos, cada vez que hacés un cambio. Es como tener un compañero de equipo que nunca se cansa de probar la misma funcionalidad una y otra vez.

## Herramientas para automatizar tests

Hay muchas herramientas según el tipo de [test](/testing) que quieras hacer:

- **Jest**: uno de los frameworks más populares para tests unitarios y de integración en JavaScript. Viene configurado por defecto en muchos proyectos React.
- **Cypress**: una herramienta para tests end-to-end. Simula un usuario real interactuando con tu app en un navegador.
- **Playwright**: similar a Cypress, permite correr tests E2E en múltiples navegadores.
- **Vitest**: una alternativa moderna a Jest, más rápida y pensada para proyectos con Vite.

```javascript
// Unit test with Jest
describe('Shopping cart', () => {
  test('adds a product to the cart', () => {
    const cart = new Cart();
    cart.add({ name: 'T-shirt', price: 5000 });
    expect(cart.items).toHaveLength(1);
    expect(cart.total()).toBe(5000);
  });

  test('calculates the total with multiple products', () => {
    const cart = new Cart();
    cart.add({ name: 'T-shirt', price: 5000 });
    cart.add({ name: 'Pants', price: 12000 });
    expect(cart.total()).toBe(17000);
  });
});
```

## TDD: Test-Driven Development

**TDD** (Test-Driven Development, o desarrollo guiado por tests) es una forma de trabajar donde primero escribís el test y después el código que lo hace pasar. El ciclo es:

1. **Red**: escribís un test que falla.
2. **Green**: escribís el código mínimo para que pase.
3. **Refactor**: mejorás el código manteniendo los tests en verde.

Suena raro al principio, pero te obliga a pensar en qué tiene que hacer tu código antes de ponerte a escribirlo. No todos los equipos usan TDD, pero es una técnica que vale la pena conocer.

## Integración con CI/CD

Una de las grandes ventajas del testing automatizado es que podés integrarlo con tus [pipelines](/pipelines) de CI/CD. Esto significa que cada vez que alguien sube código al repositorio, los tests se ejecutan automáticamente. Si alguno falla, el [deploy](/deploy) se frena y el equipo recibe una alerta. Así evitás que código roto llegue a producción.

```yaml
# Example pipeline with tests in GitHub Actions
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm test
```

## Test coverage: ¿cuánto estás cubriendo?

El **test coverage** (cobertura de tests) es una métrica que te dice qué porcentaje de tu código está siendo ejecutado por tus tests. Si tenés un 80% de coverage, significa que el 80% de las líneas de tu código se ejecutan cuando corrés los tests.

Ojo: tener alto coverage no garantiza que tus tests sean buenos. Podés tener 100% de coverage con tests que no verifican nada útil. Usalo como una guía, no como un objetivo en sí mismo.
