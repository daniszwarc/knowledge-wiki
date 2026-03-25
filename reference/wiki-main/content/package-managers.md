---
title: "Package managers"
description: "Herramientas que gestionan las dependencias y librerías que usa tu proyecto."
category: "Ecosistema"
order: 6
question: "¿Cómo se instalan y gestionan las librerías?"
related: ["dependencias", "open-source", "versionado"]
---

## Qué es un package manager

Un **package manager** (gestor de paquetes) es una herramienta que automatiza la instalación, actualización y eliminación de las [dependencias](/dependencias) de tu proyecto. En vez de descargar manualmente archivos de internet y copiarlos a tu proyecto, le decís al package manager "necesito esta librería" y se encarga de todo: la descarga, resuelve sub-dependencias y la deja lista para usar.

## Los package managers de JavaScript

En el ecosistema JavaScript, tenés varias opciones:

- **npm**: Viene incluido con Node.js. Es el más usado y el que tiene el registro de paquetes más grande del mundo (más de 2 millones de paquetes).
- **yarn**: Creado por Facebook como alternativa a npm. Introdujo los lockfiles (archivos que registran las versiones exactas instaladas) y la instalación en paralelo.
- **pnpm**: Usa un sistema de links simbólicos (atajos que apuntan a un archivo en otro lugar del disco) para no duplicar paquetes. Si tenés 10 proyectos que usan React, pnpm lo descarga una sola vez.
- **bun**: El más nuevo. Es un runtime de JavaScript que incluye un package manager extremadamente rápido.

```bash
# Install a dependency with each one
npm install axios
yarn add axios
pnpm add axios
bun add axios
```

## package.json: el manifiesto de tu proyecto

El archivo `package.json` es el centro de tu proyecto. Define el nombre, la versión, los scripts y, lo más importante, las dependencias:

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "react": "^18.2.0",
    "next": "^14.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "eslint": "^8.50.0"
  }
}
```

Las `dependencies` son las que tu app necesita para funcionar. Las `devDependencies` son las que solo usás durante el desarrollo (testing, linting, TypeScript).

## Versionado semántico

Las versiones de los paquetes siguen el formato `MAJOR.MINOR.PATCH` (por ejemplo, `18.2.1`). Los prefijos en `package.json` controlan qué actualizaciones aceptás:

- **`^18.2.0`** (caret): Acepta actualizaciones de MINOR y PATCH. Instalaría `18.3.0` pero no `19.0.0`.
- **`~18.2.0`** (tilde): Solo acepta actualizaciones de PATCH. Instalaría `18.2.5` pero no `18.3.0`.
- **`18.2.0`** (exacta): Solo esa versión, nada más.

Podés profundizar en esto en el artículo de [versionado](/versionado).

## Lock files: por qué importan

Cuando instalás dependencias, el package manager genera un **lockfile** (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`). Este archivo registra la versión exacta de cada paquete instalado, incluyendo todas las sub-dependencias. Siempre commiteá el lockfile al repositorio. Sin él, cada persona del equipo podría terminar con versiones diferentes y bugs imposibles de reproducir.

## node_modules

La carpeta `node_modules` es donde se guardan físicamente los paquetes descargados. Puede llegar a pesar cientos de megabytes. Nunca la commitees al repositorio (agregala a `.gitignore`). Cuando alguien clona tu proyecto, ejecuta `npm install` y el package manager recrea `node_modules` a partir del `package.json` y el lockfile.

## Comandos esenciales

```bash
# Install all project dependencies
npm install

# Add a new dependency
npm install package-name

# Add a development dependency
npm install -D package-name

# Update dependencies
npm update

# Remove a dependency
npm uninstall package-name

# View outdated dependencies
npm outdated

# Audit security vulnerabilities
npm audit
```

Elegir entre npm, yarn, pnpm o bun es mayormente cuestión de preferencia. Lo importante es que todo el equipo use el mismo para evitar conflictos con los lockfiles.
