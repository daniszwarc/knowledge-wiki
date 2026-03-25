---
title: "Plataformas"
description: "Una plataforma es un sistema base sobre el cual se construyen, ejecutan o distribuyen aplicaciones y servicios."
category: "Ecosistema"
order: 4
question: "¿Qué son las plataformas?"
related: ["no-code-low-code", "servidores", "apis-de-terceros"]
---

## El piso sobre el que construís

Una **plataforma** es un sistema que te provee una base para construir o ejecutar tu aplicación. En vez de armar todo desde cero (comprar servidores físicos, instalar un sistema operativo, configurar redes), usás una plataforma que ya resolvió esas capas y te deja enfocarte en tu producto. Es como la diferencia entre construir una casa desde los cimientos o alquilar un local que ya tiene electricidad, agua y gas: vos solo ponés los muebles.

## Tipos de plataformas

En el mundo tech, "plataforma" se usa para cosas bastante diferentes. Estos son los tipos más comunes:

**IaaS (Infrastructure as a Service)**: Te dan la infraestructura cruda: [servidores](/servidores) virtuales, almacenamiento, redes. Vos instalás y configurás todo lo demás. Ejemplos: AWS EC2, Google Compute Engine, DigitalOcean Droplets.

**PaaS (Platform as a Service)**: Te dan un entorno listo para deployar (publicar) tu código. No te preocupás por el servidor, el sistema operativo ni la configuración. Ejemplos: Vercel, Railway, Heroku, Render.

**SaaS (Software as a Service)**: Software terminado que usás directamente. No construís nada, solo lo usás. Ejemplos: Gmail, Notion, Slack, Figma.

```
Level of control                    Level of convenience
       ▲                                   ▲
       │  IaaS  ← More control,            │  SaaS  ← More convenient,
       │           more work               │           less control
       │  PaaS  ← Balance between          │  PaaS  ← Balance
       │           both                    │
       │  SaaS  ← Less control,            │  IaaS  ← Less convenient,
       │           less work               │           more control
       └─────────────────────►              └─────────────────────►
```

## Plataformas como marketplace

Hay otro tipo de plataforma que no es de infraestructura sino de **negocio**: las plataformas de marketplace. Son sistemas donde dos o más grupos de usuarios se conectan y generan valor mutuamente:

- **MercadoLibre**: Conecta compradores con vendedores.
- **Uber**: Conecta pasajeros con conductores.
- **App Store / Play Store**: Conecta desarrolladores con usuarios.
- **Airbnb**: Conecta viajeros con anfitriones.

El desafío de estas plataformas es el **problema del huevo y la gallina**: necesitás vendedores para atraer compradores, pero necesitás compradores para atraer vendedores.

## Plataforma vs producto

Un **producto** resuelve un problema directamente. Una **plataforma** permite que otros construyan productos sobre ella. La diferencia es importante porque cambia toda la estrategia:

| Aspecto | Producto | Plataforma |
|---------|----------|------------|
| **Valor** | Lo crea la empresa | Lo crean los usuarios/desarrolladores |
| **Crecimiento** | Lineal (más features = más valor) | Exponencial (más usuarios = más valor para todos) |
| **Ejemplo** | Una app de notas | Un sistema donde la gente crea apps de notas |

No todo necesita ser una plataforma. La mayoría de los proyectos empiezan como productos y, si tiene sentido, evolucionan hacia plataformas después. Si estás arrancando, enfocate en resolver un problema puntual primero.

## Elegir la plataforma correcta

Si estás empezando un proyecto, probablemente necesitás elegir una plataforma de despliegue. Para un [MVP](/mvp), un PaaS como Vercel (para frontend y funciones serverless) o Railway (para backend y bases de datos) te permite lanzar rápido sin preocuparte por infraestructura. Si ya tenés más experiencia o necesitás más control, AWS o Google Cloud te dan flexibilidad total. Y si tu proyecto no requiere código personalizado, las herramientas [no-code / low-code](/no-code-low-code) son plataformas en sí mismas. Lo importante es no sobrecomplicar las cosas al principio: elegí lo más simple que resuelva tu necesidad actual y migrá cuando haga falta.
