---
title: "QA"
description: "QA (Quality Assurance) es el proceso sistemático de asegurar que un producto de software cumple con los estándares de calidad antes de llegar a los usuarios."
category: "Testing"
order: 2
question: "¿Qué es el control de calidad?"
related: ["testing", "bugs", "ab-testing"]
---

## ¿Qué es QA?

**QA** significa Quality Assurance, o en español, aseguramiento de la calidad. Es el proceso que se encarga de que el software que construís funcione bien, se vea bien y cumpla con lo que se espera. No es solo "encontrar errores": es un enfoque más amplio que incluye prevenir problemas, definir estándares y asegurarse de que cada funcionalidad nueva no rompa las que ya existían.

## El rol de QA en un equipo

En muchos equipos de desarrollo hay una persona (o varias) dedicadas al rol de QA. Su trabajo no es simplemente hacer clic en la app buscando [bugs](/bugs). Un buen QA participa desde el diseño de la funcionalidad, preguntando cosas como: "¿qué pasa si el usuario hace esto?", "¿y si pierde conexión a internet en medio del proceso?". Estas preguntas ayudan a prevenir problemas antes de que se escriba una sola línea de código.

## Planes de prueba y regresión

Un **plan de prueba** (test plan) es una lista organizada de todo lo que hay que verificar. Incluye los escenarios esperados ("el usuario se registra con éxito") y también los inesperados ("el usuario envía el formulario vacío"). Cuando una app crece, aparece algo que se llama **regresión**: bugs que aparecen en funcionalidades que antes andaban bien, porque un cambio nuevo las afectó sin querer. Es como arreglar una canilla y que empiece a perder otra. Para combatir esto, se hacen pruebas de regresión, idealmente de forma [automatizada](/testing-automatizado).

```
Example test plan - Login flow:

1. User enters valid email and password → enters the dashboard
2. User enters invalid email → shows error "Invalid email"
3. User enters incorrect password → shows error "Incorrect password"
4. User leaves fields empty → button disabled
5. User tries to access without session → redirects to login
```

## QA manual y QA automatizado

Hay dos grandes enfoques. El **QA manual** implica que una persona prueba la app a mano, siguiendo el plan de prueba o explorando libremente (lo que se conoce como "testing exploratorio"). El **QA automatizado** usa herramientas y scripts para ejecutar esas mismas pruebas de forma automática. En la práctica, lo ideal es combinar ambos: lo automatizado cubre lo repetitivo, y lo manual cubre la intuición humana, como detectar que algo "se siente raro" en la experiencia de usuario.

## ¿QA es solo para apps grandes?

Para nada. Incluso en proyectos chicos, tener al menos un proceso básico de [testing](/testing) te ahorra dolores de cabeza. No necesitás un equipo de QA completo: con escribir algunos tests y tener una checklist antes de cada deploy, ya estás haciendo QA. Lo clave es incorporar la mentalidad de calidad en el equipo, no dejarlo como algo que "hace otra persona".
