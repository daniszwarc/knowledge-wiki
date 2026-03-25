---
title: "URLs públicas y privadas"
description: "Cómo controlar quién puede acceder a los archivos almacenados en tu aplicación"
category: "Archivos"
order: 2
question: "¿Cómo se comparten archivos de forma segura?"
related: ["almacenamiento-de-archivos", "autorizacion", "cdn"]
---

Cuando guardás un archivo en un servicio de [almacenamiento](/almacenamiento-de-archivos), necesitás decidir quién puede acceder a él. ¿Es una imagen pública que cualquiera puede ver? ¿O es un documento privado que solo debería ver un usuario específico? La diferencia está en cómo configurás la URL de acceso.

## URLs públicas

Una URL pública es accesible por cualquier persona que la conozca. No necesita autenticación ni permisos especiales. Es ideal para contenido que querés que todo el mundo vea: logos, imágenes de productos, archivos CSS o JavaScript.

```
https://my-bucket.s3.amazonaws.com/public/logo.png
```

Cualquier persona, navegador o bot puede acceder a esa URL. Es simple y rápido, pero obviamente no sirve para archivos sensibles. Además, estas URLs se pueden cachear fácilmente en un [CDN](/cdn) para mejorar la velocidad de carga.

## URLs privadas y firmadas

Para archivos privados, existen las **URLs firmadas** (signed URLs o presigned URLs). Son URLs que incluyen una firma criptográfica temporal (un código secreto generado matemáticamente), lo que significa que solo funcionan por un tiempo limitado y no se pueden modificar.

```
https://my-bucket.s3.amazonaws.com/private/invoice-123.pdf
  ?X-Amz-Algorithm=AWS4-HMAC-SHA256
  &X-Amz-Credential=AKIA.../20240101/us-east-1/s3/aws4_request
  &X-Amz-Date=20240101T120000Z
  &X-Amz-Expires=3600
  &X-Amz-Signature=abc123...
```

Esa URL larga y fea es una URL firmada. Fijate que tiene un parámetro `Expires` — después de ese tiempo (en este caso, 3600 segundos = 1 hora), la URL deja de funcionar. Si alguien la intercepta después de ese tiempo, no le sirve para nada.

## Cómo funciona el flujo

El proceso típico para compartir un archivo privado es:

1. El usuario pide acceder a un archivo (por ejemplo, descargar su factura)
2. El backend verifica que el usuario tenga permiso (usando [autenticación](/autenticacion))
3. El backend genera una URL firmada con un tiempo de expiración
4. El backend le devuelve esa URL al frontend
5. El frontend usa esa URL para descargar o mostrar el archivo
6. Pasado el tiempo de expiración, la URL ya no funciona

```javascript
// pages/api/download-invoice.js — Next.js API route with AWS S3
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: 'us-east-1' });

export default async function handler(req, res) {
  const command = new GetObjectCommand({
    Bucket: 'my-private-bucket',
    Key: 'invoices/invoice-123.pdf',
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour

  // Return the signed URL to the frontend
  res.json({ downloadUrl: url });
}
```

## Subida directa con URLs firmadas

Las URLs firmadas no son solo para descargar. También podés generar URLs firmadas de **subida** (presigned PUT URLs). Esto permite que el frontend suba archivos directamente al [almacenamiento](/almacenamiento-de-archivos) sin pasar por tu servidor, lo cual es mucho más eficiente para archivos grandes.

El flujo es: tu backend genera la URL firmada de subida, se la pasa al frontend, y el frontend sube el archivo directo al bucket. Tu servidor nunca tiene que manejar el archivo, solo validar el permiso y generar la URL.
