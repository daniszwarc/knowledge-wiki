---
title: "Branch"
description: "Una branch (rama) es una línea de desarrollo independiente que permite trabajar en cambios sin afectar el código principal."
category: "Versionado"
icon: "git-branch"
order: 3
question: "¿Qué es una rama?"
related: ["commit", "merge", "pull-request"]
---

## ¿Qué es una rama?

Una rama (branch) es una línea de trabajo separada dentro del mismo repositorio. Te deja avanzar con un cambio sin tocar la versión principal hasta que ese cambio esté listo. Siguiendo el ejemplo de esta serie, podrías crear una rama solo para agregar el buscador de productos de tu tienda online.

## La rama principal

Todo repo tiene una rama principal, que normalmente se llama `main`. Esa rama representa la versión estable del proyecto: la que está en producción o cerca de estarlo. La práctica más común es no trabajar directo sobre `main`, sino crear una rama por funcionalidad, bug o mejora.

```text
main                     ●──●──●────────────●
                          \
feature/search-products    ●──●──●
                           tu cambio
```

## Crear y cambiar de rama

Crear una rama y moverte a ella es simple. Cuando cambiás de rama, Git actualiza los archivos de tu carpeta para mostrarte el estado de esa rama. Podés ir y venir entre ramas y cada una mantiene sus propios [commits](/commit).

```bash
# Crear una rama para el buscador y moverte a ella
git checkout -b feature/search-products

# Ver en qué rama estás
git branch
# * feature/search-products
#   main

# Volver a main
git checkout main

# Regresar a tu rama
git checkout feature/search-products
```

## Estrategias de ramas

La estrategia más común es usar **feature branches**: una rama por cada cambio lógico. Eso hace que el historial sea más claro y que la revisión sea más fácil. El nombre de la rama debería decir qué estás haciendo.

```bash
# Convenciones comunes
feature/search-products
feature/shopping-cart
fix/mobile-login
hotfix/incorrect-price
refactor/header
```

## ¿Cuándo crear una rama?

La respuesta corta es: casi siempre que vayas a hacer un cambio. Incluso si es chico, una rama separada te da tres ventajas:

- No tocás `main` mientras todavía estás probando.
- Podés descartar el trabajo si no sirve.
- El cambio queda aislado y después se puede revisar mejor en un [pull request](/pull-request).

Dentro de esa rama es donde ahora entran los commits.
