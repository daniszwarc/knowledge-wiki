---
title: "Pull Request"
description: "Un pull request es una solicitud para incorporar los cambios de una rama al código principal, permitiendo revisión y discusión antes del merge."
category: "Versionado"
order: 5
question: "¿Cómo se revisan los cambios antes de unirlos?"
related: ["merge", "branch", "colaboracion"]
---

## ¿Qué es un Pull Request?

Un Pull Request (PR) es la etapa donde decís: "Mi rama está lista, revisémosla antes de unirla". Si venís siguiendo esta serie, sería el momento en que terminaste `feature/search-products` y querés incorporar ese trabajo a `main`.

El PR no sirve solo para mergear. También sirve para explicar el cambio, discutir decisiones y hacer revisión de código antes de tocar la rama principal.

## ¿Cómo se crea un PR?

Primero trabajás en tu [rama](/branch), hacés tus [commits](/commit), subís esa rama al remoto y recién ahí abrís el PR. En esa pantalla explicás qué cambiaste y por qué.

```bash
# 1. Trabajar en tu rama y hacer commits
git checkout -b feature/search-products

# 2. Subir la rama al remoto
git push -u origin feature/search-products

# 3. Crear el PR desde GitHub o con GitHub CLI
gh pr create \
  --title "Agregar buscador de productos" \
  --body "Suma búsqueda por nombre y filtro por categoría en la página de productos"
```

## El proceso de Code Review

Una vez abierto el PR, empieza la revisión. Otras personas del equipo pueden mirar el diff, dejar comentarios, pedir cambios o aprobarlo. La idea no es frenar el trabajo, sino asegurarse de que el cambio esté claro, correcto y alineado con el proyecto.

```text
Estados típicos de un PR:
1. Open               -> esperando review
2. Changes requested  -> hay cambios pedidos
3. Approved           -> listo para mergear
4. Merged             -> ya entró a main
5. Closed             -> se cerró sin merge
```

## Checks automáticos (CI)

La mayoría de los equipos ejecuta checks automáticos cada vez que un PR se crea o se actualiza. Esos checks suelen validar que el cambio no rompa nada antes de mergearlo.

- Correr los tests para verificar que nada se rompió.
- Analizar el código en busca de errores comunes (linting).
- Verificar que el código compila correctamente.
- Chequear la cobertura de tests (qué porcentaje del código está cubierto por tests).

Si alguno falla, el PR no debería mergearse todavía.

```text
Checks del PR:
✅ Tests unitarios
✅ Lint
✅ Build
❌ Cobertura menor al mínimo

-> no se mergea hasta corregir el ❌
```

## Buenas prácticas para PRs

Un buen PR suele tener estas características:

- Es **pequeño y enfocado**.
- Explica qué cambia y por qué.
- Tiene commits legibles.
- Incluye contexto visual si el cambio afecta la interfaz.
- Llega con tests o checks pasando.

En otras palabras: el PR es el cierre natural del recorrido. Primero tenés el repo, después el versionado, después la rama, después los commits y finalmente la revisión antes del merge.
