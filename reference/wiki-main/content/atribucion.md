---
title: "Atribución"
description: "El proceso de identificar de dónde vienen los usuarios y qué los llevó a convertir."
category: "Analytics"
icon: "bar-chart-3"
order: 7
question: "¿Cómo se sabe de dónde vienen los usuarios?"
related: ["funnels", "metricas", "eventos-analytics"]
---

## ¿Qué es la atribución?

La **atribución** es el proceso de identificar qué canales, campañas o acciones llevaron a un usuario a tu producto y, eventualmente, a convertir (registrarse, comprar, suscribirse). Si tenés anuncios en Instagram, posts en un blog y una campaña de email, la atribución te dice cuál de esos canales trajo a cada usuario. Sin atribución, estás gastando plata en marketing sin saber qué funciona y qué no.

## Canales de adquisición

Los usuarios llegan a tu producto por distintos caminos, llamados **canales**:

- **Orgánico**: te encuentran por Google u otro buscador sin que pagues por eso.
- **Pago (Paid)**: anuncios en Google Ads, Meta Ads, TikTok Ads, etc.
- **Social**: llegan desde redes sociales (sin ser anuncios pagos).
- **Referral**: vienen porque alguien compartió un link a tu producto.
- **Email**: llegan desde una campaña de email marketing.
- **Directo**: escriben tu URL directamente en el navegador.

## Parámetros UTM

Los **UTM** (Urchin Tracking Module) son parámetros que agregás a las URLs para rastrear de dónde viene el tráfico. Son el estándar de la industria y los lee cualquier herramienta de analytics.

```
https://myapp.com/register?utm_source=instagram&utm_medium=paid&utm_campaign=launch_2024&utm_content=video_demo
```

Los parámetros principales son:

- `utm_source`: de dónde viene (instagram, google, newsletter).
- `utm_medium`: el tipo de canal (paid, organic, email, social).
- `utm_campaign`: el nombre de la campaña específica.
- `utm_content`: variante del contenido (útil para A/B tests en ads).
- `utm_term`: término de búsqueda (para campañas de search).

## Modelos de atribución

Acá es donde la cosa se pone interesante. Un usuario puede interactuar con varios canales antes de convertir: ve un anuncio en Instagram, después busca en Google, después hace clic en un email. ¿A quién le atribuís la conversión?

- **First-touch (primer toque)**: todo el crédito va al primer canal que trajo al usuario. Útil para entender qué genera awareness (reconocimiento de marca).
- **Last-touch (último toque)**: todo el crédito va al último canal antes de la conversión. Es el modelo más simple y el que usan muchas herramientas por defecto.
- **Multi-touch**: distribuye el crédito entre todos los canales que participaron. Es más justo pero más complejo de implementar.

## Implementación básica

Para trackear atribución, necesitás capturar los parámetros UTM cuando el usuario llega y guardarlos (en una cookie, en localStorage o en tu backend). Después, cuando el usuario convierte, asociás esos datos al evento de conversión en tu [funnel](/funnels).

```jsx
// pages/register.js

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    const attribution = {
      source: router.query.utm_source,
      medium: router.query.utm_medium,
      campaign: router.query.utm_campaign,
    };

    if (attribution.source) {
      localStorage.setItem('attribution', JSON.stringify(attribution));
    }
  }, [router.query]);

  return <div>{/* Registration form */}</div>;
}
```

Combiná la atribución con tus [métricas](/metricas) de conversión para saber no solo cuántos usuarios convierten, sino de dónde vienen los que mejor convierten. Eso te permite invertir más en los canales que realmente funcionan.
