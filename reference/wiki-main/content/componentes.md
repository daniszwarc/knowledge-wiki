---
title: "Componentes"
description: "Piezas reutilizables e independientes que conforman la interfaz de una aplicación."
category: "Interfaz"
order: 6
question: "¿Cómo se construye una interfaz pieza por pieza?"
related: ["ui", "navegacion", "estado", "modularidad"]
---

## Bloques de construcción

Pensá en los bloques de LEGO. Cada pieza es simple por sí sola, pero combinándolas podés armar lo que quieras. Los **componentes** funcionan igual: son piezas independientes de la [interfaz](/ui) que podés combinar para construir pantallas completas. Un botón es un componente. Una barra de navegación es un componente. Una tarjeta de producto es un componente. Toda la app es, en definitiva, un árbol de componentes anidados unos dentro de otros.

## El árbol de componentes

Una aplicación se organiza como un árbol. En la raíz tenés el componente principal (la "App"), y dentro de él se van anidando componentes más específicos:

```text
App
├── Header
│   ├── Logo
│   └── NavigationMenu
├── MainContent
│   ├── SearchBar
│   └── ProductList
│       ├── ProductCard
│       ├── ProductCard
│       └── ProductCard
└── Footer
```

Cada componente se encarga de su propia parte de la pantalla. Esto hace que el código sea más fácil de entender, mantener y modificar, aplicando el mismo principio de [modularidad](/modularidad) que se usa en el resto del software.

## Props: la comunicación entre componentes

Los componentes necesitan recibir datos para saber qué mostrar. Esos datos se llaman **props** (propiedades). Son como los parámetros de una función: el componente padre le pasa información al componente hijo.

```jsx

// The Button component receives props to customize itself
function Button({ text, variant, onClick }) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {text}
    </button>
  );
}

// It is used like this in different places of the app
<Button text="Add to cart" variant="primary" onClick={addProduct} />
<Button text="Cancel" variant="secondary" onClick={closeModal} />
<Button text="Delete" variant="danger" onClick={deleteItem} />
```

Fijate cómo el mismo componente `Button` se adapta a tres situaciones diferentes simplemente cambiando sus props. Esa es la magia de la reutilización.

## Estado dentro de un componente

Además de recibir datos de afuera (props), un componente puede tener su propio [estado](/estado) interno: información que maneja por sí mismo y que puede cambiar con el tiempo. Por ejemplo, un componente de acordeón necesita recordar si está abierto o cerrado:

```jsx
import { useState } from 'react';

function Accordion({ title, content }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setOpen(!open)}>{title}</button>
      {open && <div className="content">{content}</div>}
    </div>
  );
}
```

El estado `open` es local: solo le importa a ese acordeón en particular, no al resto de la app.

## Reutilización: escribir una vez, usar muchas

La gran ventaja de pensar en componentes es que los construís una vez y los usás en todos lados. Si tu aplicación muestra tarjetas de producto en la home, en los resultados de búsqueda y en la página de favoritos, no escribís el código tres veces. Creás un componente `TarjetaProducto` y lo reutilizás pasándole distintas props. Si mañana necesitás cambiar el diseño de esa tarjeta, lo modificás en un solo lugar y el cambio se refleja en toda la app. Menos código, menos bugs, más consistencia en la [interfaz](/ui).
