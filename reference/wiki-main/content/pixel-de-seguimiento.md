---
title: "Pixel de seguimiento"
description: "Un pixel es un fragmento de código que registra las acciones de los usuarios en tu sitio para medir y optimizar tus campañas publicitarias."
category: "Marketing"
order: 5
question: "¿Qué es el pixel de Facebook y para qué sirve?"
related: ["retargeting", "campanas-publicitarias", "eventos-analytics", "publicidad-digital"]
---

## Qué es un pixel de seguimiento

Un **pixel de seguimiento** es un pequeño fragmento de código (JavaScript) que instalás en tu sitio web y que envía información a una plataforma publicitaria cada vez que un usuario hace algo. El más conocido es el **Meta Pixel** (antes Facebook Pixel), pero Google, TikTok, LinkedIn y otras plataformas tienen el suyo. Sin un pixel, tus campañas publicitarias son ciegas: gastás plata pero no sabés qué funciona.

## Cómo funciona

1. Instalás el código del pixel en tu sitio (generalmente en el `<head>` de todas las páginas).
2. Cuando un usuario visita tu sitio, el pixel se carga y envía un evento a la plataforma.
3. La plataforma asocia esa visita con el perfil del usuario (si está logueado en Facebook, Google, etc.).
4. Si ese usuario llegó desde un anuncio, la plataforma registra la conversión y la atribuye a la campaña correcta.

```jsx
// pages/_app.js — Load Meta Pixel across all pages
import Script from 'next/script';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', 'YOUR_PIXEL_ID');
            fbq('track', 'PageView');
          `,
        }}
      />
      <Component {...pageProps} />
    </>
  );
}
```

## Eventos estándar

Las plataformas definen **eventos estándar** que podés trackear. Son acciones comunes que el algoritmo ya entiende:

| Evento | Cuándo se dispara |
|--------|------------------|
| `PageView` | Cada vez que alguien carga una página |
| `ViewContent` | Cuando ve un producto o artículo |
| `AddToCart` | Cuando agrega algo al carrito |
| `InitiateCheckout` | Cuando empieza el proceso de pago |
| `Purchase` | Cuando completa una compra |
| `Lead` | Cuando deja sus datos (formulario) |
| `CompleteRegistration` | Cuando se registra |
| `Search` | Cuando usa el buscador de tu sitio |

```javascript
// Track a purchase with the Meta Pixel
fbq('track', 'Purchase', {
  value: 29.99,
  currency: 'USD',
  content_ids: ['product-123'],
  content_type: 'product'
});
```

## Eventos personalizados

Además de los estándar, podés crear **eventos custom** para acciones específicas de tu producto:

```javascript
// A user completed the onboarding
fbq('trackCustom', 'OnboardingCompleted', {
  plan: 'free',
  steps_completed: 5
});
```

## Para qué sirve el pixel

### 1. Medir conversiones

Sin el pixel, si alguien hace clic en tu anuncio y después compra, no tenés forma de saber que esa compra vino del anuncio. El pixel conecta el clic con la conversión. Esto te permite calcular tu [ROAS](/publicidad-digital) real y saber qué campañas generan plata y cuáles la queman.

### 2. Optimizar campañas

Cuando le decís a Meta "quiero conversiones", el algoritmo usa los datos del pixel para aprender qué tipo de personas convierten y buscar más personas similares. Cuantos más datos tiene, mejor optimiza. Por eso es clave instalar el pixel desde el día uno, incluso antes de hacer publicidad.

### 3. Crear audiencias

El pixel te permite crear audiencias basadas en comportamiento real:

- Todos los que visitaron tu sitio en los últimos 30 días.
- Los que vieron un producto pero no compraron.
- Los que compraron más de una vez (clientes VIP).

Estas audiencias son la base del [retargeting](/retargeting) y de las audiencias lookalike (personas similares a tus clientes).

### 4. Atribución

El pixel ayuda a entender el **camino de conversión**: ¿el usuario vio un anuncio en Instagram, después buscó en Google y compró 3 días después? La atribución conecta esos puntos para que sepas qué canales contribuyeron a la venta.

## Conversiones API (CAPI)

Los navegadores cada vez bloquean más las **cookies de terceros** (pequeños archivos que las plataformas publicitarias guardan en tu navegador para rastrearte entre sitios), lo que hace que los pixels pierdan datos. La solución es la **Conversions API (CAPI)**: en vez de enviar datos desde el navegador, los enviás desde tu servidor.

```javascript
// pages/api/conversions.js — Send event from your backend via Next.js API route
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, purchaseData } = req.body;

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${process.env.META_PIXEL_ID}/events`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [{
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          user_data: {
            em: hashEmail(user.email), // SHA-256 hash
            ph: hashPhone(user.phone)
          },
          custom_data: {
            value: purchaseData.value,
            currency: purchaseData.currency
          }
        }],
        access_token: process.env.META_ACCESS_TOKEN
      })
    }
  );

  const data = await response.json();
  res.status(200).json(data);
}
```

La mejor práctica es usar **ambos** (pixel + CAPI) para maximizar los datos capturados. Las plataformas deduplican los eventos automáticamente.

## Privacidad y consentimiento

Con regulaciones como GDPR (Europa) y leyes de privacidad locales, no podés trackear usuarios sin su consentimiento. Las buenas prácticas son:

- Mostrar un banner de cookies claro y no manipulativo.
- Solo activar el pixel después de que el usuario acepte.
- Permitir rechazar el tracking sin perder funcionalidad.
- Documentar qué datos recopilás y para qué.

```jsx
// components/PixelLoader.js — Only load the pixel if the user gave consent

import Script from 'next/script';

export default function PixelLoader({ userConsent }) {
  if (!userConsent.marketing) return null;

  return (
    <Script
      id="meta-pixel-consent"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          fbq('init', 'YOUR_PIXEL_ID');
          fbq('track', 'PageView');
        `,
      }}
    />
  );
}
```
