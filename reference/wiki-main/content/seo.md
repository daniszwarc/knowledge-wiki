---
title: "SEO"
description: "Técnicas para que tu sitio web aparezca en los primeros resultados de los buscadores."
category: "Internet"
order: 5
question: "¿Cómo aparece un sitio en Google?"
related: ["dominio", "dns", "http-https"]
---

## Qué es SEO

**SEO** (Search Engine Optimization) es el conjunto de técnicas que aplicás para que tu sitio web aparezca lo más arriba posible en los resultados de buscadores como Google. Si tenés un sitio increíble pero nadie lo encuentra, es como tener un local en una calle donde no pasa nadie. El SEO es lo que pone tu sitio en la avenida principal.

## Cómo funcionan los buscadores

Los motores de búsqueda hacen tres cosas con tu sitio:

1. **Crawling**: Robots (llamados "crawlers" o "spiders") recorren la web siguiendo enlaces, descubriendo páginas nuevas. El de Google se llama Googlebot.
2. **Indexing**: Una vez que el crawler encuentra tu página, analiza su contenido y la guarda en un índice gigante (pensalo como el catálogo de una biblioteca).
3. **Ranking**: Cuando alguien busca algo, el buscador revisa su índice y ordena los resultados según cientos de factores: relevancia, calidad, velocidad de carga, etc.

Tu [dominio](/dominio) y la antigüedad de tu sitio también influyen en cómo los buscadores te perciben.

## SEO on-page

El SEO on-page son las optimizaciones que hacés directamente en tu HTML:

- **Title tag**: El título que aparece en la pestaña del navegador y en los resultados de Google. Tiene que ser descriptivo y único por página.
- **Meta description**: El resumen que aparece debajo del título en Google. No afecta el ranking directamente, pero un buen texto aumenta los clics.
- **Headings semánticos**: Usá `h1` para el título principal (uno solo por página), `h2` para secciones, `h3` para subsecciones. Esto le da estructura al contenido.
- **HTML semántico**: Usá `<article>`, `<nav>`, `<main>`, `<section>` en vez de `<div>` para todo. Los buscadores entienden mejor tu contenido.

```jsx
// pages/running-shoes.js — SEO with Next.js Head component
import Head from 'next/head';

export default function RunningShoes() {
  return (
    <>
      <Head>
        <title>Running Shoes - Sports Store</title>
        <meta name="description" content="Find the best running shoes with free shipping nationwide." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://mystore.com/running-shoes" />
      </Head>
      <main>{/* Page content */}</main>
    </>
  );
}
```

## SEO técnico

Más allá del contenido, hay aspectos técnicos que importan mucho:

- **Sitemap XML**: Un archivo que le dice a los buscadores qué páginas tiene tu sitio. Facilita el rastreo.
- **robots.txt**: Un archivo en la raíz de tu sitio que indica qué páginas pueden o no rastrear los bots.
- **Performance**: Google mide la velocidad de tu sitio (Core Web Vitals). Si tu página tarda mucho en cargar, baja en el ranking.
- **HTTPS**: Usar [HTTP seguro](/http-https) es un factor de ranking. Google penaliza sitios que no usan HTTPS.

```
# Example robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Sitemap: https://mysite.com/sitemap.xml
```

## La calidad del contenido

Al final del día, el factor más importante es tener contenido útil y original. Google se volvió muy bueno detectando contenido de baja calidad o copiado. Escribí para personas, no para robots. Si tu contenido responde bien a lo que la gente busca, los buscadores lo van a premiar.
