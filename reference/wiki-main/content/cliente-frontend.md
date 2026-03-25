---
title: "Cliente (Frontend)"
description: "El cliente o frontend es todo lo que corre en el dispositivo del usuario: lo que ve, toca e interactúa en una aplicación."
category: "Fundamentos"
order: 2
question: "¿Qué es lo que ve el usuario?"
related: ["servidor-backend", "ui", "navegacion"]
---

## El lado del usuario

Cuando abrís una aplicación web en tu navegador, todo lo que aparece en tu pantalla (los botones, el texto, las imágenes, los colores) es el **frontend**. También se le dice "cliente" porque es la parte del software que corre en *tu* dispositivo: tu computadora, tu celular, tu tablet. Es literalmente el "lado del cliente" de la ecuación.

## Las tecnologías base

El frontend web se construye con tres tecnologías fundamentales que trabajan juntas:

```html
<!-- HTML: the structure -->
<button class="btn-purchase">Add to cart</button>
```

```css
/* CSS: the appearance */
.btn-purchase {
  background-color: #2563eb;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
}
```

```jsx
// JavaScript (React/Next.js): the behavior

function PurchaseButton({ product }) {
  function handleClick() {
    addToCart(product);
    showNotification('Product added');
  }

  return (
    <button className="btn-purchase" onClick={handleClick}>
      Add to cart
    </button>
  );
}
```

- **HTML** define la estructura y el contenido (qué elementos hay).
- **CSS** define el estilo visual (cómo se ven).
- **JavaScript** define el comportamiento (qué pasa cuando interactuás).

## ¿Qué es un navegador en todo esto?

El navegador (Chrome, Firefox, Safari, Edge) es el programa que sabe interpretar HTML, CSS y JavaScript. Cuando visitás una URL, el navegador le pide los archivos al [servidor](/servidor-backend), los descarga, y los ejecuta en tu dispositivo. Es como un traductor universal que convierte código en la [interfaz visual](/ui) que ves en pantalla.

## Frameworks y herramientas modernas

Hoy casi nadie escribe frontend solo con HTML, CSS y JavaScript puro. Se usan **frameworks** y **librerías** que simplifican el trabajo:

- **React** (Meta): el más popular, basado en componentes reutilizables.
- **Vue** (comunidad): conocido por ser fácil de aprender.
- **Angular** (Google): muy usado en aplicaciones empresariales.
- **Svelte**: compila todo antes de enviarlo al navegador, lo que lo hace muy rápido.

Estos frameworks te ayudan a organizar el código, manejar el [estado](/estado) de la aplicación y construir interfaces complejas sin volverte loco.

## ¿Por qué se separa del backend?

Separar el frontend del [backend](/servidor-backend) permite que equipos distintos trabajen en paralelo. Un diseñador o desarrollador frontend se enfoca en la experiencia visual y la interacción, mientras que otro equipo se encarga de la lógica del servidor, las bases de datos y la seguridad. Además, un mismo backend puede servir a múltiples clientes: una app web, una app móvil y hasta un reloj inteligente, todos consumiendo la misma información.
