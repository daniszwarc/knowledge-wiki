---
title: "Eventos de analytics"
description: "Los eventos de analytics son registros de las acciones que los usuarios realizan en tu app, usados para entender su comportamiento."
category: "Analytics"
order: 1
question: "¿Cómo se mide lo que hacen los usuarios?"
related: ["metricas", "funnels", "feedback-de-usuarios"]
---

## ¿Qué son los eventos de analytics?

Cada vez que un usuario hace algo en tu app (hace clic en un botón, visita una página, completa un formulario), podés registrar esa acción como un **evento**. Un evento es simplemente un dato que dice "tal cosa pasó, en tal momento, con tales características". Estos eventos, recolectados de forma masiva, te permiten entender cómo se comportan los usuarios: qué usan, qué ignoran, dónde se traban, en qué momento abandonan.

## Herramientas de analytics

Hay muchas herramientas para recolectar y analizar eventos. Las más conocidas son:

- **Google Analytics**: la más popular. Tiene una versión gratuita que cubre las necesidades de la mayoría de los proyectos. Se enfoca en tráfico web y conversiones.
- **Mixpanel**: muy buena para análisis de producto. Permite hacer seguimiento detallado de usuarios individuales y crear [funnels](/funnels) complejos.
- **Amplitude**: similar a Mixpanel, con foco en análisis de comportamiento y retención.
- **Segment**: no es una herramienta de análisis en sí, sino un "hub" que recolecta eventos y los manda a múltiples herramientas a la vez.

## Anatomía de un evento

Un evento bien definido tiene un **nombre** y **propiedades** que lo describen. El nombre dice qué pasó, y las propiedades dan contexto.

```jsx
// components/ProductCard.js

import analytics from '../lib/analytics';

export default function ProductCard({ product }) {
  function handleAddToCart() {
    // Track the event with Mixpanel
    analytics.track('Product Added to Cart', {
      product_id: product.id,
      name: product.name,
      price: product.price,
      currency: 'ARS',
      category: product.category,
      origin: 'search page'
    });
  }

  return (
    <button onClick={handleAddToCart}>Add to cart</button>
  );
}
```

Las propiedades son lo que te permite después filtrar y segmentar: "¿cuántos usuarios agregaron productos de más de $10.000?" o "¿desde qué página agregan más productos?".

## Convenciones de nombres

Algo que parece menor pero es importantísimo: cómo nombrás tus eventos. Si una persona del equipo trackea `"click_comprar"`, otra trackea `"boton_compra_click"` y otra `"purchase_button_clicked"`, después es un caos analizar los datos. Lo ideal es definir una convención desde el principio:

- Usá un formato consistente: `Objeto + Acción` (ej: "Producto Visto", "Carrito Actualizado", "Checkout Completado").
- Mantené un documento centralizado con todos los eventos y sus propiedades.
- Revisá que los nombres sean claros para alguien que no escribió el código.

## ¿Qué trackear?

No necesitás trackear absolutamente todo. Empezá por lo que importa: las acciones clave de tu producto. Si tenés un e-commerce, trackeá el flujo de compra completo. Si tenés una app de contenido, trackeá qué se lee, qué se comparte, cuánto tiempo pasan los usuarios. Los datos que recolectes acá van a alimentar tus [métricas](/metricas) y te van a ayudar a tomar mejores decisiones de producto.
