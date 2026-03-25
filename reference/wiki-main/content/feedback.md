---
title: "Feedback"
description: "El feedback son las señales visuales y mensajes que una aplicación usa para comunicarle al usuario qué está pasando en cada momento."
category: "Interfaz"
order: 5
question: "¿Cómo le avisa la app al usuario qué está pasando?"
related: ["ux", "ui", "procesamiento-asincrono"]
---

## Que la app no te deje en vilo

Imaginá que tocás un botón de "Pagar" y no pasa nada. Ni un mensaje, ni una animación, ni un cambio en la pantalla. ¿Funcionó? ¿Se trabó? ¿Tenés que tocar de nuevo? Esa incertidumbre es exactamente lo que el **feedback** resuelve. Son todas las señales que la aplicación te da para que sepas qué está ocurriendo: que tu acción se registró, que algo está cargando, que hubo un error, o que todo salió bien.

## Tipos de feedback

Hay varias formas de comunicarle cosas al usuario:

### Estados de carga
Cuando la app está procesando algo o esperando una respuesta del [servidor](/servidor-backend), necesita mostrar que está trabajando:

```
- Spinners: a spinning icon that indicates "loading"
- Progress bars: show how much is left (ideal for uploads)
- Skeletons: gray silhouettes that mimic the shape of the content that will appear
- Shimmer effects: shining animations over the skeletons
```

```jsx
// components/ProductList.js

import { useState, useEffect } from 'react';

export default function ProductList() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((products) => setData(products))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Spinner text="Loading products..." />;
  }

  return <Grid products={data} />;
}
```

### Mensajes de error
Cuando algo sale mal, el usuario necesita saber qué pasó y qué puede hacer:

- **Errores de validación**: "El email no tiene un formato válido" (aparecen junto al campo del [formulario](/formularios)).
- **Errores de conexión**: "No pudimos conectar con el servidor. Verificá tu conexión a internet."
- **Errores generales**: "Ocurrió un problema inesperado. Intentá de nuevo."

La regla de oro: nunca mostrar errores técnicos al usuario. "Error 500: Internal Server Error" no le dice nada. "No pudimos procesar tu pedido, intentá más tarde" sí.

### Confirmaciones de éxito
Cuando una acción se completó correctamente:

- **Toasts/Snackbars**: mensajes temporales que aparecen brevemente en un rincón de la pantalla. "Producto agregado al carrito."
- **Páginas de confirmación**: "Tu compra fue procesada con éxito. Número de orden: #4521."
- **Cambios visuales**: un ícono de corazón que se pone rojo cuando le diste "Me gusta".

## Feedback inmediato vs. diferido

Algunas acciones dan feedback al instante (tocar un botón y que cambie de color), mientras que otras necesitan esperar una respuesta del servidor. En este segundo caso, el patrón típico es:

1. Mostrar que algo está cargando (spinner, botón deshabilitado).
2. Cuando llega la respuesta, mostrar éxito o error.

Esto está directamente relacionado con el [procesamiento asíncrono](/procesamiento-asincrono): muchas operaciones no son instantáneas, y el feedback es lo que mantiene al usuario informado durante la espera.

## ¿Por qué es tan importante?

El feedback es uno de los pilares de una buena [UX](/ux). Estudios de usabilidad muestran que los usuarios perciben una app como "rota" si no reciben retroalimentación dentro de unos pocos cientos de milisegundos después de una interacción. No necesitás mostrar el resultado final tan rápido, pero sí necesitás indicar que la app registró la acción. Un simple cambio de color en un botón o un spinner puede ser la diferencia entre un usuario que confía en tu app y uno que la abandona.
