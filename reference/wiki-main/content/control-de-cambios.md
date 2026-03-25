---
title: "Control de cambios"
description: "El control de cambios es el conjunto de prácticas y herramientas para rastrear qué se modificó en el código, quién lo hizo y cuándo."
category: "Versionado"
order: 7
question: "¿Cómo se rastrean los cambios?"
related: ["commit", "versionado", "repositorio"]
---

## ¿Qué es el control de cambios?

El control de cambios va más allá de simplemente usar Git. Es la práctica de mantener un registro claro y consultable de todas las modificaciones que se hicieron en un proyecto: qué se cambió, quién lo cambió, cuándo y por qué. Mientras que el [versionado](/versionado) te da las herramientas técnicas (Git, commits, ramas), el control de cambios es la disciplina de usar esas herramientas de forma que cualquier persona pueda entender la evolución del proyecto.

## Herramientas de rastreo en Git

Git tiene varios comandos que te permiten investigar el historial de cambios. `git diff` te muestra las diferencias entre dos versiones de un archivo. `git log` te muestra la lista de [commits](/commit) con sus mensajes y autores. Y `git blame` te dice quién escribió cada línea de un archivo y en qué commit. Estos comandos son esenciales para entender por qué el código está como está y para encontrar cuándo se introdujo un bug.

```bash
# See what changed in a specific file
git log --oneline src/components/Checkout.jsx
# a3f21bc Add discount coupon to checkout
# 8d4e2fa Fix total when there is free shipping
# 1b7c9d0 Create checkout component

# See who wrote each line
git blame src/components/Checkout.jsx
# a3f21bc (Maria  2024-03-15) const applyCoupon = (code) => {
# a3f21bc (Maria  2024-03-15)   const discount = validateCoupon(code);
# 8d4e2fa (Carlos 2024-03-10)   const total = calculateTotal(items);

# See exactly what changed in a commit
git show a3f21bc
```

## Diff: comparar versiones

El `diff` es la vista de diferencias entre dos estados del código. Muestra las líneas agregadas (en verde con `+`), las eliminadas (en rojo con `-`) y el contexto alrededor. Es lo que ves cuando revisás un pull request en GitHub. Aprender a leer diffs es una habilidad fundamental: te permite entender rápidamente qué se modificó sin tener que leer todo el archivo.

```diff
// Example of a diff
- const price = product.price;
+ const price = product.price * (1 - discount);
+ const finalPrice = price + calculateTaxes(price);

  return {
-   total: price,
+   total: finalPrice,
    currency: 'ARS',
  };
```

## Changelog: el registro público

Un **changelog** (registro de cambios) es un archivo donde se documentan los cambios relevantes de cada versión del software de forma legible para humanos. A diferencia del historial de commits (que es muy técnico), el changelog está pensado para usuarios o para el equipo en general. Generalmente se organiza por versión y agrupa los cambios en categorías como "Agregado", "Cambiado", "Corregido" y "Eliminado".

```markdown
# Changelog

## [1.3.0] - 2024-03-20
### Added
- Product search with filters
- Support for discount coupons

### Fixed
- Error in free shipping calculation
- Layout issue on small screens

## [1.2.0] - 2024-03-01
### Added
- Shopping cart
- Checkout page
```

## ¿Por qué importa el control de cambios?

Rastrear los cambios de forma ordenada te salva en muchas situaciones:

- Cuando algo se rompe en producción, podés ver rápidamente qué cambió recientemente y quién lo hizo.
- Cuando un nuevo desarrollador se suma al equipo, puede entender la historia del proyecto leyendo el changelog y los commits.
- Cuando necesitás revertir un cambio problemático, el historial te permite hacerlo con precisión quirúrgica.

Un buen control de cambios es lo que separa a un proyecto organizado de uno caótico, y se construye con buenos mensajes de commit en el [repositorio](/repositorio).
