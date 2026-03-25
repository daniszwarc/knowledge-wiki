---
title: "Scripts"
description: "Pequeños programas que automatizan tareas repetitivas del desarrollo."
category: "Automatización"
order: 5
question: "¿Cómo se automatizan tareas repetitivas?"
related: ["workflows", "ci-cd", "jobs-programados"]
---

## ¿Qué es un script?

Un **script** es un pequeño programa que automatiza una tarea que de otra manera tendrías que hacer a mano. Pensá en todas esas cosas que hacés seguido: levantar el entorno de desarrollo, limpiar archivos temporales, poblar la base de datos con datos de prueba, generar archivos a partir de plantillas. En vez de recordar y tipear los mismos comandos una y otra vez, escribís un script que lo haga por vos.

## Scripts en package.json

Si trabajás con Node.js, el lugar más común para definir scripts es el `package.json`. Ahí podés crear atajos para los comandos que usás todos los días:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --fix",
    "test": "jest --coverage",
    "seed": "node scripts/seed.js",
    "clean": "rm -rf .next node_modules/.cache",
    "generate:types": "prisma generate"
  }
}
```

Después los ejecutás con `npm run`:

```bash
npm run dev          # Start the development environment
npm run seed         # Populate the database with test data
npm run clean        # Clean cache files
npm test             # Run the tests (test and start don't need "run")
```

## Scripts en Bash

Para tareas más complejas o que no dependen de Node, podés escribir scripts en Bash. Por ejemplo, un script que prepare todo el entorno de desarrollo:

```bash
#!/bin/bash
# setup.sh - Set up the development environment

echo "Installing dependencies..."
npm install

echo "Configuring environment variables..."
cp .env.example .env

echo "Starting database..."
docker compose up -d postgres

echo "Running migrations..."
npm run db:migrate

echo "Loading initial data..."
npm run seed

echo "Done! Run 'npm run dev' to start."
```

Para ejecutarlo, le das permisos y lo corrés:

```bash
chmod +x setup.sh
./setup.sh
```

## Casos de uso comunes

Los scripts aparecen en todos lados del desarrollo:

- **Setup del proyecto**: instalar dependencias, crear archivos de configuración, levantar servicios
- **Base de datos**: correr migraciones, cargar datos de prueba (seed), hacer backups
- **Limpieza**: borrar archivos temporales, limpiar cache, resetear el entorno
- **Generación de código**: crear componentes a partir de plantillas, generar tipos desde el schema
- **Validación**: correr linters, verificar formato, chequear tipos antes de commitear

## Makefiles

Otra opción popular es usar un **Makefile**, que funciona como un menú de comandos disponibles:

```makefile
dev:
	docker compose up -d
	npm run dev

test:
	npm test

deploy:
	npm run build
	npm run deploy
```

Y los ejecutás con `make dev`, `make test`, etc. Es especialmente útil en proyectos que mezclan distintas tecnologías.

Los scripts son el primer paso hacia la automatización. Si querés llevar esto al siguiente nivel y automatizar [workflows](/workflows) completos, podés integrar tus scripts en un sistema de [CI/CD](/ci-cd) que los ejecute automáticamente en cada cambio.
