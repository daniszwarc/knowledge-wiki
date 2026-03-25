---
title: "Animaciones"
description: "Transiciones y movimientos visuales que mejoran la experiencia del usuario en una interfaz."
category: "Interfaz"
order: 9
question: "¿Cómo se agrega movimiento a una interfaz?"
related: ["ui", "ux", "feedback", "componentes"]
---

## Movimiento con propósito

Las **animaciones** en una [interfaz](/ui) no son adornos: son una herramienta de comunicación. Un botón que cambia de color al pasar el mouse, un menú que se desliza al abrirse, una notificación que aparece suavemente en lugar de "flashear" de golpe. Todo eso le da al usuario pistas sobre qué está pasando y hace que la [experiencia](/ux) se sienta más fluida y natural.

## Transiciones CSS: el primer paso

La forma más simple de animar es con **transiciones**. Le decís al navegador "cuando esta propiedad cambie, hacelo gradualmente en vez de instantáneamente":

```css
.button {
  background-color: #3b82f6;
  transform: scale(1);
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.button:hover {
  background-color: #2563eb;
  transform: scale(1.05);
}
```

Con solo agregar `transition`, el botón ya no salta bruscamente de un color a otro: se desliza suavemente. La propiedad `transform` con `scale` lo agranda levemente, dando una sensación táctil muy satisfactoria.

## Animaciones con keyframes: control total

Cuando necesitás movimientos más complejos, usás `@keyframes` para definir una secuencia de pasos:

```css
@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.notification {
  animation: fadeIn 0.3s ease-out forwards;
}
```

Esta animación hace que una notificación aparezca deslizándose hacia abajo mientras se hace visible. Es mucho más expresiva que un simple "ahora se ve, antes no se veía".

## Cuándo animar (y cuándo no)

No todo necesita animación. Usá movimiento cuando tenga un propósito claro:

- **[Feedback](/feedback)**: un botón que reacciona al toque confirma que registró la acción.
- **Atención**: una animación sutil puede guiar la vista hacia algo importante, como una notificación nueva.
- **Transiciones de contexto**: al cambiar de pantalla o abrir un modal, la animación ayuda a entender de dónde viene y a dónde va la información.

Evitá animaciones puramente decorativas que no aportan información. Si algo se mueve sin razón, distrae en vez de ayudar.

## Rendimiento: que no se trabe

Una animación que se ve entrecortada es peor que no tener animación. Para que sean fluidas (60 fotogramas por segundo), seguí estas reglas:

- **Animá solo `transform` y `opacity`**: estas propiedades las maneja la GPU directamente, sin recalcular el layout de la página.
- **Evitá animar `width`, `height`, `margin` o `top`**: fuerzan al navegador a recalcular posiciones de todos los elementos.
- **Usá `will-change` con cuidado**: le avisa al navegador que un elemento va a animarse, permitiéndole optimizar.

```css
.animated-element {
  will-change: transform, opacity;
}
```

## Respetá las preferencias del usuario

Algunas personas sufren mareos o molestias con el movimiento excesivo. Los sistemas operativos permiten activar una opción de "reducir movimiento", y vos podés respetar esa preferencia:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Esto desactiva prácticamente todas las animaciones para quienes lo necesiten. Es un detalle chico que marca una gran diferencia en la [experiencia](/ux) de esas personas.
