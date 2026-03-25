---
title: "Accesibilidad (a11y)"
description: "Prácticas para hacer que una aplicación sea usable por todas las personas, incluyendo aquellas con discapacidades."
category: "Interfaz"
icon: "layout"
order: 8
question: "¿Cómo se hace una app usable para todos?"
related: ["ui", "ux", "formularios"]
---

## Una app para todas las personas

La **accesibilidad** (abreviada como **a11y**, porque hay 11 letras entre la "a" y la "y" de "accessibility") es el conjunto de prácticas que garantizan que cualquier persona pueda usar tu aplicación, incluyendo personas con discapacidades visuales, auditivas, motrices o cognitivas. No es un feature opcional ni un "nice to have": es parte fundamental de una buena [experiencia de usuario](/ux).

## HTML semántico: la base de todo

La herramienta más poderosa para la accesibilidad es usar el HTML correcto. Los lectores de pantalla (software que lee en voz alta lo que hay en pantalla para personas ciegas) dependen de las etiquetas HTML para entender la estructura de la página:

```html
<!-- Bad: all generic divs -->
<div class="header">News of the day</div>
<div class="paragraph">Today it was announced that...</div>
<div class="button" onclick="send()">Send</div>

<!-- Good: semantic tags -->
<h2>News of the day</h2>
<p>Today it was announced that...</p>
<button onclick="send()">Send</button>
```

La diferencia es enorme. Un `<button>` es navegable con teclado, anunciado como botón por el lector de pantalla, y activable con Enter o Espacio. Un `<div>` no hace nada de eso por sí solo.

## Atributos ARIA

Cuando el HTML semántico no alcanza, existen los atributos **ARIA** (Accessible Rich Internet Applications). Le dan información extra a las tecnologías asistivas:

```html
<!-- An icon that works as a close button -->
<button aria-label="Close modal">
  <svg><!-- X icon --></svg>
</button>

<!-- A section that expands and collapses -->
<button aria-expanded="false" aria-controls="detail">
  See more details
</button>
<div id="detail" hidden>Expandable content...</div>
```

Sin el `aria-label`, el lector de pantalla no sabría qué hace ese botón con solo un ícono. La regla general: usá HTML semántico primero, y ARIA solo cuando sea necesario.

## Navegación por teclado

Muchas personas no usan mouse: navegan con el teclado usando Tab para moverse entre elementos, Enter para activar botones y Escape para cerrar modales. Tu app tiene que funcionar completamente con teclado. Esto significa:

- Todos los elementos interactivos deben ser enfocables.
- El orden de tabulación debe ser lógico.
- El foco debe ser visible (nunca pongás `outline: none` sin un reemplazo).

## Contraste y contenido visual

El texto tiene que tener suficiente **contraste** con el fondo para que personas con baja visión puedan leerlo. La relación mínima recomendada es de 4.5:1 para texto normal. Además, toda imagen que transmita información necesita un texto alternativo:

```html
<!-- Informative: describe what it shows -->
<img src="sales-chart.png" alt="Sales chart: 30% growth in March" />

<!-- Decorative: leave alt empty -->
<img src="separator.png" alt="" />
```

## Por qué deberías empezar ahora

La accesibilidad no es solo un tema ético, aunque ya eso debería alcanzar. Mejora la [interfaz](/ui) para todos: los subtítulos ayudan a quien ve un video sin sonido, el buen contraste ayuda a quien usa el celular bajo el sol, la navegación por teclado ayuda a quien tiene el mouse roto. Además, en muchos países es un requerimiento legal. Hacé de la accesibilidad un hábito desde el primer [formulario](/formularios) que construyas, no algo que se "agrega después".
