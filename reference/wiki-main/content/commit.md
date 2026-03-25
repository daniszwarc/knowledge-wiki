---
title: "Commit"
description: "Un commit es una foto del estado de tu código en un momento específico, acompañada de un mensaje que describe qué se cambió."
category: "Versionado"
order: 4
question: "¿Qué es un commit?"
related: ["repositorio", "versionado", "branch"]
---

## ¿Qué es un commit?

Un commit es un punto guardado en el historial del proyecto. Cuando hacés un commit, Git registra el estado actual de ciertos archivos junto con un mensaje que explica qué cambiaste. Si en la [rama](/branch) `feature/search-products` avanzaste con el buscador, cada paso lógico que cierres debería quedar guardado en un commit.

Pensalo así: la rama es el camino, y los commits son las marcas que vas dejando sobre ese camino.

## ¿Cómo se hace un commit?

El proceso tiene dos pasos:

1. Elegís qué archivos querés incluir con `git add`.
2. Guardás ese cambio con `git commit`.

No hace falta meter todo lo modificado en el mismo commit. De hecho, lo mejor suele ser separar cada cambio lógico.

```bash
# Ver qué cambió
git status

# Preparar solo los archivos del buscador
git add src/components/SearchBar.jsx
git add src/pages/products.jsx

# Guardar ese cambio en el historial
git commit -m "feat: agregar buscador de productos"
```

## Commits atómicos

Un commit atómico representa un solo cambio lógico y completo. No mezcla cosas sin relación. Eso hace que el historial sea más fácil de entender y que, si aparece un bug, sea más simple encontrar en qué momento se introdujo.

```bash
# Malo: mezclar cambios sin relación
git commit -m "cambios varios en buscador, perfil y dashboard"

# Mejor: un cambio lógico por commit
git commit -m "feat: agregar buscador de productos"
git commit -m "fix: corregir filtro por categoría"
git commit -m "refactor: extraer lógica de búsqueda a un hook"
```

## Buenos mensajes de commit

El mensaje del commit debería dejar claro qué hiciste. Una convención muy usada es **Conventional Commits**, con prefijos como `feat:`, `fix:` o `refactor:`. No es obligatorio, pero ayuda mucho a mantener un historial legible.

```bash
# Ejemplos de buenos mensajes
git commit -m "feat: agregar filtro por precio"
git commit -m "fix: evitar búsqueda vacía"
git commit -m "refactor: extraer lógica de búsqueda"
git commit -m "docs: documentar variables de entorno"
```

## El historial de commits

Todos los commits forman una línea de tiempo. Con `git log` la recorrés, con `git show` inspeccionás un commit puntual y con `git diff` comparás cambios.

Cuando tu rama ya tiene commits claros y ordenados, el siguiente paso natural es abrir un [pull request](/pull-request) para que otra persona los revise.
