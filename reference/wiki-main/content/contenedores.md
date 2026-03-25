---
title: "Contenedores (Docker)"
description: "Una tecnología que empaqueta una aplicación con todo lo que necesita para funcionar en cualquier lugar."
category: "Infraestructura"
icon: "server"
order: 6
question: "¿Cómo se empaqueta una app para que funcione en cualquier lado?"
related: ["deploy", "servidores", "escalabilidad"]
---

## ¿Qué es un contenedor?

Imaginate un contenedor de barco: no importa qué haya adentro, tiene un formato estándar que permite transportarlo en cualquier barco, tren o camión del mundo. Los **contenedores de software** funcionan igual: empaquetan tu aplicación junto con todo lo que necesita (sistema operativo, dependencias, configuración) en una unidad estándar que funciona en cualquier [servidor](/servidores).

El problema clásico que resuelven es el famoso "en mi máquina funciona". Con contenedores, si funciona en tu computadora, funciona en producción, porque el entorno es exactamente el mismo.

## Docker: la herramienta estándar

**Docker** es la plataforma más popular para crear y manejar contenedores. Dos conceptos clave:

- **Imagen**: es la "receta" o plantilla. Define qué sistema operativo usar, qué instalar y cómo configurar todo. Es inmutable (no cambia).
- **Contenedor**: es una instancia en ejecución de una imagen. Podés tener muchos contenedores corriendo a partir de la misma imagen.

Pensalo así: la imagen es el plano de una casa, el contenedor es la casa construida.

## Dockerfile: la receta de tu app

Un **Dockerfile** le dice a Docker cómo construir la imagen de tu aplicación:

```dockerfile
# Start from a base image with Node.js
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy dependency files first (to leverage cache)
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3000

# Command to start
CMD ["npm", "start"]
```

Con esto, construís y corrés tu app así:

```bash
docker build -t my-app .
docker run -p 3000:3000 my-app
```

## Contenedores vs. máquinas virtuales

Ambos aíslan aplicaciones, pero los contenedores son mucho más livianos:

| Característica | Máquina virtual | Contenedor |
|---------------|----------------|------------|
| **Arranque** | Minutos | Segundos |
| **Tamaño** | Gigabytes | Megabytes |
| **SO** | SO completo propio | Comparte el kernel (nucleo del sistema operativo) del host |
| **Rendimiento** | Penalidad significativa | Casi nativo |

## Docker Compose: orquestar múltiples servicios

Una app real raramente corre sola. Necesitás base de datos, cache, cola de tareas. **Docker Compose** te permite definir todos los servicios en un solo archivo:

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - db
      - redis

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - db_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  db_data:
```

Un solo comando levanta todo: `docker compose up`. Esto es especialmente poderoso para desarrollo local: cualquier persona nueva en el equipo puede tener el entorno completo corriendo en minutos.

Los contenedores son la base del [deploy](/deploy) moderno. Permiten que tu aplicación [escale](/escalabilidad) fácilmente (levantás más contenedores cuando hay más tráfico) y se ejecute de manera consistente en cualquier [servidor](/servidores), ya sea tu laptop, un servidor en la nube o un cluster de Kubernetes.
