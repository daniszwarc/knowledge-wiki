---
title: "Responsive design"
description: "Técnicas para que una interfaz se adapte a cualquier tamaño de pantalla."
category: "Interfaz"
order: 7
question: "¿Cómo se adapta una app a distintos dispositivos?"
related: ["ui", "ux", "componentes"]
---

## Una app, muchas pantallas

Hoy una persona puede acceder a tu aplicación desde un celular de 5 pulgadas, una tablet, una notebook o un monitor ultra ancho. El **responsive design** (diseño responsivo) es el conjunto de técnicas que hacen que la [interfaz](/ui) se vea y funcione bien en cualquiera de esos tamaños, sin necesidad de crear una versión distinta para cada dispositivo.

## Mobile first: empezar por lo chico

La estrategia más recomendada es diseñar primero para la pantalla más chica (el celular) y después ir adaptando hacia pantallas más grandes. Esto se llama **mobile first**. La razón es práctica: es más fácil agregar cosas cuando tenés más espacio que tratar de meter todo en una pantalla chica después. Además, más de la mitad del tráfico web global viene de dispositivos móviles, así que tiene sentido priorizar esa experiencia.

## Media queries: las reglas que adaptan el diseño

Las **media queries** son instrucciones de CSS que aplican estilos diferentes según las características de la pantalla. La más común es el ancho:

```css
/* Base styles: for mobile phones (mobile first) */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Tablets: from 768px */
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: from 1024px */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

En este ejemplo, los productos se muestran en una columna en celulares, dos en tablets y tres en escritorio. Los valores 768px y 1024px son **breakpoints**: los puntos donde el diseño cambia.

## Flexbox y Grid: las herramientas del layout

CSS tiene dos sistemas de layout que hacen posible el responsive design moderno:

- **Flexbox**: ideal para distribuir elementos en una fila o columna. Perfecto para barras de navegación, alinear botones, centrar contenido.
- **Grid**: ideal para layouts en dos dimensiones (filas y columnas). Perfecto para grillas de productos, dashboards, estructuras de página completas.

Ambos son inherentemente flexibles: los elementos se estiran, encogen y reacomodan según el espacio disponible.

## El viewport meta tag

Para que el responsive design funcione en móviles, necesitás esta línea en tu HTML:

```jsx
// In Next.js, add the viewport meta tag in pages/_document.js
// (Next.js includes it by default, but here's how to customize it)
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

Sin esto, el navegador móvil va a asumir que tu página fue diseñada para escritorio y la va a mostrar en miniatura. Es una sola línea, pero es fundamental.

## Por qué importa

El responsive design no es un extra ni un lujo. Si tu app no se ve bien en un celular, estás dejando afuera a la mayoría de tus usuarios. Y más allá de los números, es una cuestión de [experiencia](/ux): nadie quiere hacer zoom para leer un texto o tocar un botón diminuto con el dedo. Una interfaz que se adapta es una interfaz que respeta a la persona que la usa, sin importar desde dónde la abra.
