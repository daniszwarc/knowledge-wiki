---
title: "Versionado"
description: "El versionado es el proceso de registrar y gestionar los cambios que se hacen en el código a lo largo del tiempo."
category: "Versionado"
order: 2
question: "¿Cómo se manejan las versiones del código?"
related: ["repositorio", "commit", "branch"]
---

## ¿Qué es el versionado?

El versionado es el sistema que registra los cambios que hacés en el código a lo largo del tiempo. Te dice qué cambió, quién lo cambió y cuándo. Si ya entendiste que el [repositorio](/repositorio) es la carpeta donde vive el proyecto, el versionado es la memoria de todo lo que pasó dentro de esa carpeta.

Sigamos con el mismo ejemplo: en tu tienda online querés agregar un buscador de productos. Con versionado, ese cambio no queda mezclado ni olvidado: queda registrado paso a paso.

## ¿Por qué importa?

Sin versionado, los cambios se vuelven difíciles de seguir. Si algo se rompe, no sabés cuándo pasó. Si otra persona toca el mismo archivo, no tenés una forma clara de combinar el trabajo. Con Git, en cambio, podés volver atrás, comparar versiones y trabajar en paralelo sin perder contexto.

```text
Sin versionado:
mi-tienda/
mi-tienda-final/
mi-tienda-final-ahora-si/
mi-tienda-final-ahora-si-2/

Con Git:
mi-tienda/
└── .git/  <- toda la historia vive acá
```

## Git: la base de todo

Git funciona guardando "fotos" del proyecto en momentos específicos. Esas fotos son los [commits](/commit). Cada commit tiene un identificador, un mensaje y una relación con el commit anterior. Juntos forman una línea de tiempo del proyecto.

En la práctica, el historial se ve más o menos así:

```bash
# Ver el historial resumido
git log --oneline

# Ejemplo de salida
a3f21bc feat: agregar buscador de productos
8d4e2fa fix: corregir cálculo del total
1b7c9d0 feat: crear navegación principal
f4a8e12 chore: inicializar proyecto con Vite
```

## Versionado semántico

Además del historial interno de Git, existe una convención para numerar versiones públicas de tu software: **versionado semántico** o SemVer. Usa el formato `MAJOR.MINOR.PATCH`, por ejemplo `2.4.1`.

- Se incrementa **MAJOR** cuando hacés cambios que rompen compatibilidad.
- Se incrementa **MINOR** cuando agregás funcionalidad nueva sin romper nada.
- Se incrementa **PATCH** cuando corregís bugs.

```text
Versión 2.4.1
2 = MAJOR, cambios incompatibles
4 = MINOR, nuevas funcionalidades compatibles
1 = PATCH, correcciones
```

## Ramas y trabajo en paralelo

Una de las cosas más útiles del versionado con Git es que te permite crear [ramas](/branch). Eso significa que podés trabajar en el buscador de productos sin tocar la versión principal hasta que esté listo.

Dicho simple:

- El **repositorio** es el lugar.
- El **versionado** es la memoria.
- Los **commits** son los puntos de esa memoria.
- Las **ramas** permiten que esa memoria tenga caminos paralelos.
