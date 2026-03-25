---
title: "Compresión"
description: "Técnicas para reducir el tamaño de archivos y datos para transferirlos más rápido."
category: "Archivos"
order: 4
question: "¿Cómo se reduce el peso de los archivos?"
related: ["cdn", "almacenamiento-de-archivos", "cache"]
---

La **compresión** es el proceso de reducir el tamaño de un archivo o dato para que ocupe menos espacio y se transfiera más rápido por la red. Es como comprimir ropa en una bolsa al vacío para que entre más en la valija: el contenido es el mismo, pero ocupa mucho menos lugar. En la web, la compresión es una de las formas más efectivas de mejorar el rendimiento de tu aplicación.

## Compresión con pérdida vs sin pérdida

Existen dos grandes familias de compresión:

- **Sin pérdida (lossless)**: el archivo comprimido se puede descomprimir y recuperar exactamente el original. Se usa para código, texto, y cualquier dato donde no podés perder ni un bit. Ejemplos: gzip, Brotli, ZIP.
- **Con pérdida (lossy)**: se descarta información que el humano difícilmente nota, logrando archivos mucho más chicos. Se usa para imágenes, audio y video. Ejemplos: JPEG, MP3, H.264.

## Compresión en la web: gzip y Brotli

Cuando tu navegador pide una página web, el servidor puede comprimir la respuesta antes de enviarla. El navegador la descomprime automáticamente. Esto se negocia con headers HTTP:

```http
# The browser tells the server which compression it accepts
Accept-Encoding: gzip, deflate, br

# The server responds indicating which one it used
Content-Encoding: br
```

**Brotli** (`br`) es el estándar moderno: comprime entre un 15-25% mejor que gzip, especialmente para archivos de texto como HTML, CSS y JavaScript. La mayoría de los servidores y [CDNs](/cdn) lo soportan.

## Formatos de imagen modernos

Los formatos de imagen son donde más impacto tiene la compresión. Mirá la diferencia de peso para una misma foto:

| Formato | Peso aproximado | Soporte |
|---------|----------------|---------|
| JPEG | 200 KB | Universal |
| PNG | 500 KB | Universal |
| WebP | 120 KB | 97% de navegadores |
| AVIF | 80 KB | 92% de navegadores |

**WebP** y **AVIF** usan algoritmos de compresión mucho más avanzados. Si tu app muestra muchas imágenes, migrar a estos formatos puede reducir el peso de tu página a la mitad sin perder calidad visible.

## Compresión de video

El video es, por lejos, el tipo de contenido más pesado. Un minuto de video sin comprimir puede pesar varios gigabytes. Los **codecs** (programas que comprimen y descomprimen video) como **H.264**, **H.265** y **AV1** reducen esto a apenas unos megabytes. Por eso plataformas como YouTube recodifican cada video que subís a múltiples resoluciones y codecs.

## Por qué importa para el rendimiento

Pensá en un usuario con conexión 3G en el celular. Si tu página pesa 5 MB, puede tardar 15 segundos en cargar. Con compresión bien aplicada, podés bajar eso a 1.5 MB y que cargue en 4-5 segundos. Combinada con un [CDN](/cdn) y buenas políticas de [cache](/cache), la compresión es una de las optimizaciones que más impacto tiene con menos esfuerzo.
