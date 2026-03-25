---
title: "Almacenamiento de archivos"
description: "Cómo y dónde se guardan los archivos que sube o genera una aplicación"
category: "Archivos"
icon: "folder-open"
order: 1
question: "¿Dónde se guardan los archivos?"
related: ["base-de-datos", "urls-publicas-privadas", "cdn"]
---

Cuando un usuario sube una foto de perfil, un PDF o cualquier otro archivo a tu aplicación, ese archivo tiene que guardarse en algún lugar. Pero, ¿dónde? A diferencia de los datos estructurados (como nombres o emails) que van a una [base de datos](/base-de-datos), los archivos se almacenan de forma diferente porque suelen ser mucho más pesados.

## Archivos vs base de datos

La [base de datos](/base-de-datos) es ideal para guardar datos pequeños y estructurados: textos, números, fechas. Pero no es buena idea guardar archivos grandes directamente ahí. Imaginá meter una imagen de 5 MB en una tabla de PostgreSQL — la base se volvería lenta y enorme. Lo que se hace en la práctica es guardar el archivo en un **servicio de almacenamiento** y en la base de datos solo guardar la referencia (la URL o ruta del archivo).

```
// In the database you store this:
{
  "user_id": 42,
  "avatar_url": "https://my-bucket.s3.amazonaws.com/avatars/42.jpg"
}

// The actual file lives in the storage service
```

## Almacenamiento en la nube

Los servicios más usados para guardar archivos son:

- **Amazon S3** (Simple Storage Service): el más popular, ofrece almacenamiento prácticamente ilimitado
- **Google Cloud Storage (GCS)**: la alternativa de Google con integración con sus otros servicios
- **Azure Blob Storage**: la opción de Microsoft

Estos servicios organizan los archivos en **buckets** (contenedores). Pensá en un bucket como una carpeta raíz donde metés todos los archivos de tu aplicación. Cada archivo tiene una **key** (clave) que funciona como su ruta dentro del bucket.

```
my-app-bucket/
  ├── avatars/
  │   ├── user-1.jpg
  │   └── user-2.png
  ├── documents/
  │   └── report-2024.pdf
  └── temp/
      └── upload-in-progress.tmp
```

## Local vs remoto

Durante el desarrollo, es común guardar archivos en el disco local del servidor. Pero en producción, esto trae problemas: si tenés varios servidores, un archivo subido a uno no está disponible en los otros. Además, si el servidor se cae, perdés los archivos.

Por eso en producción se usa almacenamiento remoto en la nube. Los archivos quedan accesibles desde cualquier servidor, tienen respaldo automático, y podés servir los archivos a través de un [CDN](/cdn) para que carguen rápido en todo el mundo. El acceso se controla con [URLs públicas o privadas](/urls-publicas-privadas) según la necesidad.

## Cuándo usar qué

- **Base de datos**: datos pequeños y estructurados (texto, números, JSON pequeño)
- **Almacenamiento en la nube**: archivos binarios (imágenes, videos, PDFs, backups)
- **Disco local**: solo para desarrollo o archivos temporales durante el procesamiento
