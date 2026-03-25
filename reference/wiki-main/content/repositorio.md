---
title: "Repositorio"
description: "Un repositorio es el lugar donde se almacena todo el código fuente de un proyecto junto con su historial de cambios."
category: "Versionado"
order: 1
question: "¿Dónde se guarda el código?"
related: ["versionado", "commit", "colaboracion"]
---

## ¿Qué es un repositorio?

Un repositorio (o "repo") es la carpeta donde vive tu proyecto junto con su historial de cambios. Si usás Git, dentro de esa carpeta hay un directorio oculto llamado `.git` que guarda toda esa historia: qué cambió, quién lo cambió y cuándo. Es la base sobre la que después aparecen los [commits](/commit), las [ramas](/branch) y los pull requests.

Para ver la serie completa, imaginá este caso: tenés una tienda online y querés agregar un buscador de productos. Todo ese trabajo va a vivir dentro del mismo repositorio.

## Repositorio local vs. remoto

Hay dos versiones del mismo repo:

- El repositorio **local** está en tu computadora. Ahí escribís código, hacés cambios y probás cosas.
- El repositorio **remoto** vive en una plataforma como GitHub, GitLab o Bitbucket. Ahí el equipo comparte el código y sincroniza el trabajo.

```text
Tu computadora (local)         <-->      GitHub (remoto)
mi-tienda/                               github.com/equipo/mi-tienda
├── src/                                 ├── src/
├── package.json                         ├── package.json
└── .git/                                └── historial compartido
```

La idea importante es esta: trabajás en local, pero colaborás a través del remoto.

## Crear y clonar repositorios

Hay dos formas comunes de arrancar:

- **Crear** un repo nuevo con `git init`.
- **Clonar** uno existente con `git clone`.

Si clonás, no bajás solo los archivos: bajás también todo el historial.

```bash
# Crear un repositorio nuevo
mkdir mi-tienda
cd mi-tienda
git init

# O clonar uno que ya existe
git clone https://github.com/equipo/mi-tienda.git
```

## ¿Qué se guarda en un repositorio?

En un repo guardás el código fuente, la configuración y la documentación del proyecto. Pero no todo debería entrar. Hay archivos que conviene ignorar porque se pueden regenerar o porque contienen información sensible.

```text
# Ejemplo de .gitignore
node_modules/
.env
dist/
*.log
```

`node_modules` se puede reinstalar. `.env` suele tener secretos. `dist` se puede volver a generar. Eso es exactamente lo que `.gitignore` evita que subas por error.

## El repositorio como centro del proyecto

El repositorio no es solo una carpeta con archivos. Es el lugar donde se organiza todo el trabajo del proyecto: historial, ramas, revisiones, issues, documentación y automatizaciones.

Si querés pensar esta familia como una secuencia, el orden lógico es:

1. Primero existe el repositorio.
2. Después Git guarda cambios dentro de ese repo.
3. Esos cambios se organizan en commits y ramas.
4. Finalmente se revisan con un pull request.
