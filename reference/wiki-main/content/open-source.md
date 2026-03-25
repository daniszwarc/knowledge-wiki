---
title: "Open source"
description: "Software cuyo código fuente es público y cualquiera puede usar, modificar y distribuir."
category: "Ecosistema"
order: 5
question: "¿Qué significa que un software sea de código abierto?"
related: ["repositorio", "dependencias", "colaboracion"]
---

## Qué es open source

**Open source** (código abierto) significa que el código fuente de un software está disponible públicamente para que cualquiera lo pueda ver, usar, modificar y distribuir. En contraste con el software propietario (donde el código es secreto), el open source se basa en la transparencia y la [colaboración](/colaboracion). Cuando instalás React, Node.js o Linux, estás usando software open source: podés ir al [repositorio](/repositorio) en GitHub y leer cada línea de código.

## Las licencias

No todo el open source es igual. La **licencia** define qué podés y qué no podés hacer con el código:

- **MIT**: La más permisiva. Podés hacer lo que quieras con el código (usarlo, modificarlo, venderlo) mientras incluyas la licencia original. React, Next.js y muchas librerías la usan.
- **Apache 2.0**: Similar a MIT, pero incluye una cláusula de patentes que te protege legalmente. La usan Kubernetes y TensorFlow.
- **GPL**: La más restrictiva. Si usás código GPL en tu proyecto, tu proyecto también tiene que ser GPL (es "viral"). Linux usa GPL.

Antes de usar una librería, mirá su licencia. Para la mayoría de los proyectos comerciales, MIT y Apache no generan problemas. Con GPL tenés que tener más cuidado.

## Cómo contribuir

Contribuir a un proyecto open source es una de las mejores formas de aprender y de construir tu perfil profesional. El flujo típico es:

1. **Fork**: Hacés una copia del repositorio en tu cuenta de GitHub.
2. **Clone**: Bajás esa copia a tu máquina.
3. **Branch**: Creás una rama para tu cambio.
4. **Commit**: Hacés tus modificaciones y las commiteás.
5. **Pull Request**: Proponés tus cambios al proyecto original.

```bash
# Clone your fork
git clone https://github.com/your-username/project.git

# Create a branch for your feature
git checkout -b fix/typo-in-readme

# Make changes, commit and push
git add .
git commit -m "fix: correct typo in README"
git push origin fix/typo-in-readme

# Then create the PR from GitHub
```

No hace falta arrancar con cambios enormes. Corregir documentación, arreglar un bug pequeño o mejorar un mensaje de error son contribuciones valiosas.

## Beneficios del open source

- **Transparencia**: Podés auditar el código. Sabés exactamente qué hace.
- **Comunidad**: Miles de desarrolladores contribuyen, reportan bugs y proponen mejoras.
- **Gratuito**: La mayoría del software open source es gratis. Tus [dependencias](/dependencias) son en gran parte open source.
- **Calidad**: Los proyectos populares tienen muchos ojos revisando el código.

## Ejemplos que usás todos los días

- **Linux**: El sistema operativo que corre en la mayoría de los servidores del mundo.
- **React**: La biblioteca de UI de Meta para construir interfaces.
- **Node.js**: El runtime de JavaScript para el servidor.
- **VS Code**: El editor de código de Microsoft.
- **PostgreSQL**: Una de las bases de datos más populares.

## Tu proyecto como open source

Si estás construyendo un proyecto propio, hacerlo open source puede traerte contribuciones de la comunidad, visibilidad y credibilidad. Eso sí, necesitás elegir una licencia, escribir buena documentación, y estar dispuesto a revisar Pull Requests. Un buen `README` y un archivo `CONTRIBUTING.md` en tu [repositorio](/repositorio) son el primer paso.
