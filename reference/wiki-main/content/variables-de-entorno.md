---
title: "Variables de entorno"
description: "Valores de configuración que se definen fuera del código para adaptar la aplicación a cada ambiente."
category: "Fundamentos"
order: 6
question: "¿Cómo se configura una app sin tocar el código?"
related: ["deploy", "servidores", "servidor-backend"]
---

## ¿Qué son las variables de entorno?

Imaginate que tu aplicación necesita conectarse a una [base de datos](/base-de-datos). La dirección de esa base de datos es diferente en tu máquina, en staging (un ambiente de prueba que imita producción) y en producción. No podés escribir esa dirección directamente en el código, porque cada vez que hagas [deploy](/deploy) tendrías que cambiarla a mano. Las **variables de entorno** resuelven ese problema: son valores de configuración que viven *fuera* del código y se inyectan según el ambiente donde corra la app.

## El archivo .env

La forma más común de definir variables de entorno en desarrollo es usando un archivo `.env` en la raíz del proyecto:

```bash
# .env
DATABASE_URL=postgres://localhost:5432/my_app
API_KEY=sk-dev-123456
PORT=3000
NODE_ENV=development
```

En Node.js, accedés a estos valores con `process.env`:

```javascript
// In a Next.js API route or server-side code
// pages/api/example.js
const db = connect(process.env.DATABASE_URL);

export default function handler(req, res) {
  // Check the environment
  if (process.env.NODE_ENV === 'production') {
    console.log('We are in production');
  }

  // process.env values are available in API routes and server-side code
  // Next.js handles the port automatically — no need for app.listen()
  res.json({ status: 'ok' });
}
```

## Diferentes valores por ambiente

La misma app usa variables distintas según dónde corra. Esto es lo que te permite tener un solo código que funciona en todos lados:

| Variable | Development | Staging | Producción |
|----------|-------------|---------|------------|
| `DATABASE_URL` | `localhost:5432/dev` | `staging-db.server.com/app` | `prod-db.server.com/app` |
| `API_KEY` | `sk-dev-123` | `sk-stg-456` | `sk-prod-789` |
| `NODE_ENV` | `development` | `staging` | `production` |
| `LOG_LEVEL` | `debug` | `info` | `error` |

En cada [servidor](/servidores) configurás las variables correspondientes, ya sea desde el panel de la plataforma de deploy o directamente en el sistema operativo.

## Nunca commitees secretos

Esta es una regla de oro: **el archivo `.env` nunca se sube al repositorio**. Siempre agregalo a tu `.gitignore`:

```bash
# .gitignore
.env
.env.local
.env.production
```

¿Por qué? Porque ahí guardás claves de API, contraseñas de bases de datos y tokens secretos. Si los subís al repo, cualquier persona con acceso puede verlos. Lo que sí podés versionar es un archivo `.env.example` que muestre qué variables se necesitan, pero sin los valores reales:

```bash
# .env.example
DATABASE_URL=
API_KEY=
PORT=3000
NODE_ENV=development
```

Así, cuando alguien nuevo se suma al equipo, sabe exactamente qué configurar sin que le tengas que explicar variable por variable.

## Variables de entorno en plataformas

Los servicios de [deploy](/deploy) como Vercel, Railway o Render te permiten configurar variables de entorno desde su panel. Cada ambiente (preview, staging, producción) tiene sus propias variables. Esto hace que el proceso sea seguro y fácil de auditar: podés ver qué variables están configuradas sin que nadie tenga que compartir secretos por Slack.
