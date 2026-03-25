---
title: "A/B Testing"
description: "El A/B testing es una técnica para comparar dos versiones de algo y determinar cuál funciona mejor con datos reales."
category: "Testing"
icon: "flask-conical"
order: 5
question: "¿Cómo se elige entre dos opciones?"
related: ["metricas", "funnels", "ux"]
---

## ¿Qué es un A/B test?

Un **A/B test** es un experimento donde mostrás dos versiones diferentes de algo a distintos grupos de usuarios para ver cuál funciona mejor.

Por ejemplo, imaginá que tenés un botón de "Comprar" en tu tienda online. La versión A es verde y dice "Comprar ahora", la versión B es azul y dice "Agregar al carrito". Mostrás cada versión al 50% de los usuarios y medís cuál genera más ventas. Así dejás que los datos decidan, en lugar de discutir opiniones en una reunión.

## ¿Cómo funciona?

El proceso de un A/B test tiene pasos bien definidos:

1. **Hipótesis**: definís qué querés probar y por qué. "Creemos que un botón más grande va a aumentar las conversiones."
2. **Variantes**: creás las versiones (A = control, B = variante). Puede haber más de dos variantes.
3. **Segmentación**: dividís el tráfico de usuarios de forma aleatoria entre las variantes.
4. **Medición**: dejás correr el experimento recolectando datos con [eventos de analytics](/eventos-analytics).
5. **Análisis**: evaluás los resultados y decidís si hay un ganador.

## Feature flags: la herramienta detrás del A/B testing

Para poder mostrar distintas versiones a distintos usuarios, se usan **feature flags** (banderas de funcionalidad). Son configuraciones que te permiten activar o desactivar funcionalidades sin hacer un nuevo deploy. Herramientas como LaunchDarkly, Unleash o incluso una configuración simple en tu backend te permiten decir "al usuario X mostrale la versión A, al usuario Y la versión B".

```jsx
// pages/product.js

import { useEffect, useState } from 'react';

export default function ProductPage({ userId }) {
  const [variant, setVariant] = useState('A');

  useEffect(() => {
    fetch(`/api/feature-flag?flag=new-purchase-button&userId=${userId}`)
      .then(res => res.json())
      .then(data => setVariant(data.variant));
  }, [userId]);

  return (
    <button
      style={{
        backgroundColor: variant === 'A' ? 'green' : 'blue',
      }}
    >
      {variant === 'A' ? 'Buy now' : 'Add to cart'}
    </button>
  );
}
```

## Significancia estadística

Acá viene la parte que muchos ignoran: no alcanza con que una variante tenga "más clics" que la otra. Necesitás que la diferencia sea **estadísticamente significativa**, es decir, que no sea simplemente producto del azar. Si solo 20 personas vieron tu test, la diferencia puede ser casualidad. Generalmente necesitás cientos o miles de usuarios para sacar conclusiones confiables. Herramientas como Optimizely o VWO calculan esto automáticamente y te dicen cuándo podés confiar en los resultados.

## Optimización de conversiones

El A/B testing es una pieza clave de la **optimización de conversiones** (CRO, Conversion Rate Optimization: el proceso de mejorar el porcentaje de usuarios que completan una acción deseada). Junto con el análisis de [funnels](/funnels) y las [métricas](/metricas) de producto, te permite mejorar tu app de forma incremental y basada en datos. No se trata de rediseñar todo de una vez, sino de hacer cambios chicos, medirlos y quedarte con lo que funciona. Un botón acá, un texto allá, un cambio en el flujo de checkout. Cada mejora chica se acumula con el tiempo.
