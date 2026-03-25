---
title: "Navegación"
description: "La navegación es el sistema que permite al usuario moverse entre las distintas secciones y páginas de una aplicación."
category: "Interfaz"
order: 4
question: "¿Cómo se mueve el usuario por la app?"
related: ["ui", "cliente-frontend"]
---

## Encontrar el camino

Cuando abrís una app como MercadoLibre, podés ir a tu perfil, ver tus compras, buscar productos, entrar a una categoría y volver al inicio. Todo eso es posible gracias al sistema de **navegación**. Es el equivalente digital de los carteles y pasillos en un shopping: te indican dónde estás y cómo llegar a donde querés ir.

## URLs y rutas

En las aplicaciones web, cada pantalla suele tener una **URL** (dirección) propia. Esto se llama **routing** (enrutamiento):

```
https://mystore.com/              → Home page
https://mystore.com/products      → Product listing
https://mystore.com/products/42   → Product #42 detail
https://mystore.com/cart          → Shopping cart
https://mystore.com/account       → User profile
```

Cada URL se mapea a una "ruta" dentro de la aplicación. El sistema de routing del [frontend](/cliente-frontend) lee la URL y decide qué contenido mostrar. En frameworks modernos como React (con React Router) o Next.js, las rutas se definen en el código:

```javascript
// In Next.js, routes are defined by the file structure inside pages/
// pages/index.js         → /
// pages/products/index.js → /products
// pages/products/[id].js → /products/:id
// pages/cart.js          → /cart

// pages/products/[id].js
import { useRouter } from 'next/router';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query; // Access the dynamic parameter

  return <div>Product #{id}</div>;
}
```

## Patrones de navegación comunes

Hay varios patrones que vas a encontrar en casi cualquier aplicación:

- **Barra de navegación (navbar)**: el menú principal, generalmente arriba o al costado. Contiene los links más importantes.
- **Menú hamburguesa**: en dispositivos móviles, el menú se esconde detrás de un ícono (tres líneas horizontales) para ahorrar espacio.
- **Breadcrumbs (migas de pan)**: muestran el camino recorrido. Por ejemplo: `Inicio > Electrónica > Celulares > Samsung Galaxy`.
- **Tabs (pestañas)**: dividen el contenido de una misma sección. Por ejemplo: "Descripción | Opiniones | Preguntas" en la página de un producto.
- **Sidebar (barra lateral)**: navegación secundaria, muy común en dashboards y paneles de administración.
- **Footer links**: links adicionales al pie de la página (ayuda, términos, contacto).

## Navegación y experiencia de usuario

Una buena navegación es clave para la [experiencia del usuario](/ux). Si una persona no puede encontrar lo que busca en pocos segundos, probablemente abandone la app. Algunos principios:

- **El usuario siempre debe saber dónde está**: resaltá la sección activa en el menú.
- **Debe poder volver fácilmente**: un logo que lleve al inicio o un botón de "volver" claro.
- **Menos clics, mejor**: las funciones más usadas deberían estar a uno o dos clics de distancia.
- **Consistencia**: el menú no debería cambiar de lugar o forma entre pantallas.

## SPA vs. navegación tradicional

En un sitio web tradicional, cada vez que hacés clic en un link, el navegador carga una página completamente nueva desde el servidor. Es como cambiar de canal en una tele vieja: se pone todo en negro un instante antes de mostrar lo nuevo.

En una **SPA** (Single Page Application, aplicación de página única), el [frontend](/cliente-frontend) solo actualiza la parte de la pantalla que cambia, sin recargar toda la página. Esto hace que la navegación se sienta más fluida y rápida, similar a una app nativa del celular. La mayoría de las apps modernas (Gmail, Twitter, Spotify Web) funcionan así.
