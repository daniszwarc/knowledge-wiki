---
title: "Merge"
description: "Un merge es la operación de unir los cambios de una rama con otra, combinando el trabajo de diferentes líneas de desarrollo."
category: "Versionado"
order: 6
question: "¿Cómo se unen los cambios?"
related: ["branch", "pull-request", "commit"]
---

## ¿Qué es un merge?

Un merge (fusión) es cuando tomás los cambios de una [rama](/branch) y los combinás con otra. Es el paso final del ciclo de trabajo con ramas: creaste una rama, hiciste tus [commits](/commit), todo funciona bien, y ahora querés que esos cambios pasen a la rama principal. Git se encarga de analizar las diferencias entre ambas ramas y combinarlas. En la mayoría de los casos, esto sucede automáticamente y sin problemas.

## ¿Cómo se hace un merge?

El merge más básico se hace desde la terminal. Te movés a la rama que querés actualizar (generalmente `main`) y le decís a Git que incorpore los cambios de la otra rama. En la práctica, la mayoría de los equipos no hacen merge directamente: usan [pull requests](/pull-request) en GitHub o GitLab para que alguien revise los cambios antes de unirlos.

```bash
# You are on your feature branch
git checkout main

# Pull the latest changes from remote
git pull origin main

# Merge your branch
git merge feature/new-form

# If everything went well, push the changes
git push origin main
```

## Conflictos de merge

A veces, dos personas modifican las mismas líneas del mismo archivo en ramas diferentes. Cuando intentás hacer merge, Git no sabe cuál de las dos versiones conservar, y eso genera un **conflicto de merge**. No te asustes: Git te marca exactamente dónde está el conflicto y vos decidís cómo resolverlo. Abrís el archivo, ves las dos versiones, elegís cuál querés (o combinás ambas), y hacés un commit con la resolución.

```
<<<<<<< HEAD
const price = calculateDiscountedPrice(product);
=======
const price = calculateFinalPrice(product, discount);
>>>>>>> feature/discounts

// The part between <<<< HEAD and ==== is what's in your current branch
// The part between ==== and >>>> feature/discounts is what comes from the other branch
// You choose what to keep and delete the markers
```

## Tipos de merge

Git tiene varias estrategias para hacer merge:

- **Fast-forward**: Si la rama principal no tuvo cambios nuevos desde que creaste tu rama, Git simplemente "avanza" el puntero. No se crea un commit de merge adicional. Es el caso más limpio.
- **Merge commit**: Cuando ambas ramas tienen cambios, Git crea un commit especial que tiene dos "padres" (uno de cada rama). El historial muestra claramente dónde se unieron las ramas.
- **Squash merge**: Toma todos los commits de tu rama y los combina en uno solo antes de unirlos. Deja el historial de la rama principal más limpio, pero perdés el detalle de los commits individuales.

```
Fast-forward:
main  ──●──●─────────●──●  (moves forward directly)
              \     ↗
feature        ●──●

Merge commit:
main  ──●──●──●──────M  (M = merge commit)
              \     ↗
feature        ●──●

Squash:
main  ──●──●──●──────S  (S = a single commit with everything)
              \
feature        ●──●  (these commits get "squashed")
```

## Buenas prácticas

Para evitar conflictos y merges complicados, hay algunas prácticas que ayudan mucho:

- **Mantené tus ramas cortas y enfocadas**: cuanto más tiempo viva una rama separada de main, más chances hay de conflictos.
- **Hacé merge de main a tu rama frecuentemente** para mantenerte actualizado con los cambios del resto del equipo.
- **Antes de hacer merge**, asegurate de que tu código funcione, que los tests pasen y que alguien haya revisado tus cambios a través de un [pull request](/pull-request).
