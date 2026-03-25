---
title: "Deploy"
description: "El deploy es el proceso de publicar una aplicación para que los usuarios puedan acceder a ella."
category: "Infraestructura"
order: 2
question: "¿Cómo se publica una app?"
related: ["servidores", "pipelines", "repositorio"]
---

## ¿Qué es hacer deploy?

Hacer deploy (desplegar) es tomar el código de tu aplicación y ponerlo a funcionar en un [servidor](/servidores) donde los usuarios puedan acceder. Es el paso que transforma tu proyecto local en algo que vive en internet. Suena simple, pero hacerlo bien implica tener un proceso confiable y repetible para que cada cambio llegue a producción sin romper nada.

## El camino del código

El ciclo típico desde que escribís código hasta que está en producción se ve así:

```
Write code → Push to repository → CI/CD Pipeline → Deploy
       │                  │                     │               │
  Your laptop         GitHub/GitLab      Tests + Build     Production
```

1. **Escribís** y probás el código en tu máquina.
2. **Pusheás** los cambios a un repositorio de código.
3. Un [pipeline](/pipelines) de CI/CD corre tests automáticos y construye la aplicación.
4. Si todo pasa, se hace el deploy al servidor de producción.

## Ambientes: staging vs. producción

En equipos profesionales no se despliega directamente a producción. Se usan **ambientes** separados:

- **Development (dev):** Tu máquina local o un servidor de desarrollo.
- **Staging:** Una copia idéntica a producción donde probás que todo funcione antes de publicar.
- **Producción (prod):** El ambiente real al que acceden los usuarios.

Esto te permite detectar problemas antes de que los vean los usuarios. Si algo se rompe en staging, no pasa nada. Si se rompe en producción, tus usuarios lo sufren.

## Plataformas de deploy

Hoy hay muchas plataformas que simplifican enormemente el deploy:

- **Vercel:** Ideal para aplicaciones frontend y Next.js. Conectás tu repo y cada push se despliega automáticamente.
- **Railway:** Excelente para backends y bases de datos. Deploy automático desde GitHub.
- **Fly.io:** Bueno para aplicaciones que necesitan estar cerca de los usuarios geográficamente.
- **Render:** Alternativa simple para todo tipo de aplicaciones.
- **AWS / GCP / Azure:** Para equipos que necesitan control total y tienen la experiencia para configurarlo.

```bash
# Example: deploy with Vercel
npm i -g vercel
vercel --prod

# Example: deploy with Railway
railway up
```

## Rollbacks: cuando algo sale mal

A veces un deploy introduce un bug. Para eso existen los **rollbacks**: la capacidad de volver a la versión anterior rápidamente. Las buenas plataformas de deploy te dejan hacer rollback con un click.

Algunas estrategias avanzadas:

- **Blue-green deployment**: tenés dos ambientes idénticos (azul y verde) y switcheás el tráfico de uno a otro. Si algo falla, volvés al anterior al instante.
- **Canary releases**: enviás el nuevo código solo a un porcentaje chico de usuarios primero. Si todo anda bien, lo expandís al resto.
