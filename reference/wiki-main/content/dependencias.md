---
title: "Dependencias"
description: "Las dependencias son paquetes o módulos externos que tu proyecto necesita para funcionar."
category: "Arquitectura"
order: 4
question: "¿Qué pasa cuando una parte depende de otra?"
related: ["modularidad", "versionado", "servicios"]
---

## ¿Qué es una dependencia?

Una **dependencia** es un pedazo de código que tu proyecto necesita pero que no escribiste vos. En lugar de crear todo desde cero, usás bibliotecas y paquetes que otras personas ya crearon y mantienen. Por ejemplo, si tu app necesita hacer requests HTTP, en vez de implementar todo el protocolo desde cero, instalás una biblioteca como `axios` o `fetch`. Eso es una dependencia: tu código depende de ese paquete para funcionar.

## Package managers: npm, pip y más

Los **package managers** (gestores de paquetes) son herramientas que te ayudan a instalar, actualizar y manejar dependencias. Los más comunes son:

- **npm / yarn / pnpm**: para proyectos JavaScript y Node.js. Las dependencias se definen en `package.json`.
- **pip**: para proyectos Python. Las dependencias se listan en `requirements.txt` o `pyproject.toml`.
- **Composer**: para PHP.
- **Cargo**: para Rust.

```json
// Example package.json with dependencies
{
  "name": "my-app",
  "dependencies": {
    "react": "^18.2.0",
    "axios": "^1.6.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "eslint": "^8.50.0"
  }
}
```

Fijate que hay dos tipos: `dependencies` (las que tu app necesita para correr) y `devDependencies` (las que solo necesitás durante el desarrollo, como herramientas de [testing](/testing) o linters).

## Lockfiles: la importancia de fijar versiones

Cuando instalás dependencias, el package manager crea un **lockfile** (`package-lock.json`, `yarn.lock`, `poetry.lock`). Este archivo registra las versiones exactas de cada paquete que se instaló, incluyendo las dependencias de las dependencias. ¿Por qué importa? Porque si vos instalás `axios@1.6.2` y tu compañero instala `axios@1.6.5`, podrían encontrarse con comportamientos diferentes. El lockfile asegura que todos en el equipo usen exactamente las mismas versiones.

## Dependency hell: cuando todo se complica

El **dependency hell** (infierno de dependencias) es una situación donde las dependencias de tu proyecto entran en conflicto entre sí. El paquete A necesita la versión 2 de una biblioteca, pero el paquete B necesita la versión 3 de esa misma biblioteca, y no son compatibles. Esto pasa más de lo que te imaginás, especialmente en proyectos grandes con muchas dependencias. Para minimizar estos problemas:

- Mantené tus dependencias actualizadas regularmente (no dejes que se atrasen meses).
- Usá herramientas como `npm audit` o Dependabot para detectar vulnerabilidades.
- Antes de agregar una dependencia, preguntate si realmente la necesitás o si podés resolver el problema con pocas líneas de código propio.

## Dependencias entre módulos internos

No solo existen dependencias externas. Dentro de tu propio proyecto, los [módulos](/modularidad) también dependen unos de otros. Si el módulo de pedidos importa funciones del módulo de usuarios, hay una dependencia interna.

El riesgo acá son las **dependencias circulares**: A depende de B, que depende de C, que depende de A. Es como un perro que se persigue la cola: el sistema no sabe por dónde empezar. Esto genera código difícil de entender, difícil de testear y propenso a [bugs](/bugs). La solución es mantener una jerarquía clara de dependencias y evitar que los módulos se conozcan demasiado entre sí.
