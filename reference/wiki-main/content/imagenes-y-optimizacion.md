---
title: "Imágenes y optimización"
description: "Técnicas para servir imágenes de forma eficiente sin sacrificar calidad visual."
category: "Archivos"
order: 5
question: "¿Cómo se muestran imágenes sin que la página sea lenta?"
related: ["cdn", "compresion", "almacenamiento-de-archivos"]
---

Las imágenes suelen ser el contenido más pesado de una página web. Una sola foto sin optimizar puede pesar más que todo el JavaScript y CSS de tu aplicación juntos. Optimizar imágenes no es opcional: es una de las primeras cosas que tenés que resolver si querés que tu app cargue rápido.

## Formatos: cuál usar y cuándo

Cada formato tiene su fuerte:

- **JPEG**: ideal para fotos. Reduce el peso descartando detalles que el ojo casi no nota (lo que se llama "compresión con pérdida"). El clásico.
- **PNG**: para imágenes que necesitan transparencia o con pocos colores (logos, capturas). No pierde calidad, pero el archivo pesa más que JPEG para fotos.
- **SVG**: para íconos, logos e ilustraciones simples. En vez de guardar píxeles, guarda instrucciones matemáticas (como "dibujá un círculo acá"), por eso escala a cualquier tamaño sin perder calidad y pesa muy poco.
- **WebP**: reemplaza a JPEG y PNG con mejor compresión. Soporta transparencia y animación. Ya lo soportan prácticamente todos los navegadores.
- **AVIF**: el más nuevo, comprime incluso mejor que WebP. Soporte creciendo rápido.

## Lazy loading: cargá solo lo que se ve

¿Para qué descargar una imagen que está al fondo de la página si el usuario todavía no scrolleó hasta ahí? Con **lazy loading**, el navegador solo descarga las imágenes cuando están por entrar en la pantalla:

```jsx
// In Next.js, the Image component handles lazy loading by default
import Image from 'next/image';

<Image src="/product-photo.webp" alt="Running shoes" width={800} height={600} />
// Next.js applies lazy loading automatically — no extra attribute needed
```

Esta técnica puede reducir drásticamente la carga inicial de páginas con muchas imágenes. En HTML puro, se logra con el atributo `loading="lazy"` en la etiqueta `<img>`. En Next.js, el componente `Image` lo aplica automáticamente.

## Imágenes responsive con srcset

No tiene sentido mandar una imagen de 2000px de ancho a un celular con pantalla de 400px. Con `srcset`, el navegador elige el tamaño más apropiado:

```jsx
// In Next.js, the Image component generates responsive sizes automatically
import Image from 'next/image';

<Image
  src="/product-800.webp"
  alt="Running shoes"
  width={800}
  height={600}
  sizes="(max-width: 600px) 400px, 800px"
/>
// Next.js generates optimized srcset with multiple sizes automatically
```

Así un celular descarga la versión de 400px (50 KB) en vez de la de 1200px (200 KB).

## Image CDNs: optimización automática

Servicios como **Cloudinary**, **imgix** o **Cloudflare Images** reciben tu imagen original y te devuelven versiones optimizadas al vuelo. Cambiás parámetros en la URL y listo:

```
https://res.cloudinary.com/my-app/image/upload/w_400,f_auto,q_auto/product.jpg
```

Esa URL te devuelve la imagen a 400px de ancho, en el mejor formato que soporte el navegador (`f_auto`), con calidad optimizada automáticamente (`q_auto`). No necesitás generar las variantes vos.

## Next.js Image component

Si usás Next.js, el componente `Image` te da optimización automática sin configurar casi nada:

```jsx
import Image from 'next/image';

export default function Product() {
  return (
    <Image
      src="/photos/shoes.jpg"
      alt="Running shoes"
      width={800}
      height={600}
      placeholder="blur"
    />
  );
}
```

Next.js automáticamente genera versiones en WebP/AVIF, las sirve en el tamaño justo, y aplica lazy loading. Combinado con un [CDN](/cdn), es una solución muy completa. Si querés entender más sobre cómo se reduce el peso de los archivos en general, mirá [compresión](/compresion).
