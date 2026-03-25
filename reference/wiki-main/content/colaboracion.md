---
title: "Colaboración"
description: "La colaboración en código es el conjunto de prácticas y flujos de trabajo que permiten que varias personas trabajen en el mismo proyecto sin pisarse."
category: "Versionado"
order: 8
question: "¿Cómo trabajan varias personas en el mismo código?"
related: ["pull-request", "branch", "repositorio"]
---

## ¿Cómo se colabora en código?

Trabajar en equipo sobre el mismo código parece complicado, pero Git y plataformas como GitHub lo hacen bastante fluido. La idea básica es que cada persona trabaja en su propia [rama](/branch), hace sus [commits](/commit), y cuando termina propone sus cambios a través de un [pull request](/pull-request). Nadie modifica directamente la rama principal: todo pasa por un proceso de revisión. Así, varias personas pueden trabajar en paralelo sin pisarse los cambios.

## Flujos de trabajo comunes

Hay dos flujos de trabajo populares en los equipos de desarrollo:

**Git Flow** usa varias ramas con roles definidos: `main` para producción, `develop` para integración, y ramas `feature/`, `release/` y `hotfix/` para el trabajo diario. Es más estructurado y funciona bien para proyectos con ciclos de release definidos.

**Trunk-based development** es más simple: todos trabajan en ramas cortas que salen directamente de `main` y se mergean (fusionan) rápido, idealmente en el mismo día. Es el preferido por equipos que hacen despliegue continuo.

```
Git Flow:
main     ──●─────────────────●──── (releases)
develop  ──●──●──●──●──●──●──●──── (integration)
feature       \──●──●──/           (features)

Trunk-based:
main     ──●──●──●──●──●──●──●──── (frequent changes)
feature       \●/  \●/              (very short branches)
```

## Convenciones del equipo

Para que la colaboración funcione bien, el equipo necesita ponerse de acuerdo en ciertas convenciones:

- Como nombrar las ramas (`feature/`, `fix/`)
- Como escribir los mensajes de commit (Conventional Commits)
- Cuantas aprobaciones necesita un PR antes de mergearse
- Quien puede mergear a main

Estas reglas se suelen documentar en un archivo `CONTRIBUTING.md` en el [repositorio](/repositorio). No importa tanto cuales sean las reglas, sino que todo el equipo las siga de forma consistente.

```
Typical team conventions:
  - Branches: feature/*, fix/*, hotfix/*
  - Commits: feat:, fix:, refactor:, docs:
  - PRs: minimum 1 approval to merge
  - Main: protected, only merged via PR
  - Tests: must pass before merging
```

## Code ownership y responsabilidades

En equipos más grandes, es común asignar **code owners**: personas o equipos responsables de ciertas partes del código. Por ejemplo, el equipo de pagos es dueño de todo lo que está en `src/pagos/`, y cualquier PR que toque esos archivos necesita su aprobación. GitHub permite configurar esto con un archivo `CODEOWNERS`. Esto asegura que los cambios en áreas críticas sean revisados por las personas que mejor las conocen.

## Herramientas de colaboración

Además de Git y los pull requests, los equipos usan varias herramientas para coordinar su trabajo. Los **issues** en GitHub sirven para reportar bugs y proponer mejoras. Los **projects** (tableros kanban) ayudan a organizar el trabajo en curso. Las **GitHub Actions** automatizan tareas como correr tests o hacer deploys. Y herramientas de comunicación como Slack o Discord permiten discusiones rápidas. Todo esto gira alrededor del repositorio como centro de la colaboración del equipo.
