---
title: "UI (Interfaz de usuario)"
description: "La UI es el conjunto de elementos visuales e interactivos que permiten a una persona usar una aplicación."
category: "Interfaz"
order: 1
question: "¿Qué es una interfaz de usuario?"
related: ["ux", "cliente-frontend", "formularios"]
---

## La cara visible de la aplicación

La **UI** (User Interface, o interfaz de usuario) es todo lo que ves y con lo que interactuás cuando usás una app: botones, textos, imágenes, íconos, menús, [formularios](/formularios), colores, tipografías. Es el puente entre vos y el software. Sin una interfaz, una aplicación sería solo código corriendo en segundo plano, invisible e inutilizable para la mayoría de las personas.

## Los elementos que la componen

Una interfaz se construye con **componentes**, que son piezas reutilizables. Algunos ejemplos comunes:

- **Botones**: ejecutan acciones (enviar, cancelar, eliminar).
- **Campos de texto**: permiten que el usuario escriba datos.
- **Listas y tablas**: muestran colecciones de información.
- **Modales**: ventanas emergentes que piden atención inmediata.
- **Barras de [navegación](/navegacion)**: permiten moverse por la app.
- **Tarjetas (cards)**: agrupan información relacionada de forma visual.

```jsx
// components/ProductCard.js — A simple Next.js component
export default function ProductCard({ name, price, image }) {
  return (
    <div className="card">
      <img src={image} alt={name} />
      <h3>{name}</h3>
      <p className="price">${price}</p>
      <button className="btn-primary">Add to cart</button>
    </div>
  );
}

// Usage: <ProductCard name="Running Shoes Pro" price="45.990" image="/product.jpg" />
```

## Sistemas de diseño

Las empresas grandes suelen tener un **sistema de diseño**: un conjunto de reglas, componentes y estilos predefinidos que garantizan que toda la aplicación se vea y se comporte de manera consistente. Ejemplos conocidos son Material Design (Google), Human Interface Guidelines (Apple), y Fluent (Microsoft). En el mundo del desarrollo web, existen librerías de componentes como Chakra UI, Shadcn, Ant Design o Bootstrap que te dan elementos preconstruidos para armar interfaces rápidamente.

## La relación con el frontend y la UX

La UI es una parte central del [frontend](/cliente-frontend). Un desarrollador frontend toma los diseños de la interfaz (generalmente hechos en herramientas como Figma) y los convierte en código real que funciona en el navegador. Pero la UI no es solo "que se vea lindo". Está profundamente conectada con la [UX (experiencia de usuario)](/ux): una interfaz puede ser visualmente atractiva pero confusa de usar, o puede ser simple y funcional. Lo ideal es que sea ambas cosas.

## Principios básicos de una buena UI

Hay algunos principios que hacen que una interfaz funcione bien:

- **Jerarquía visual**: lo más importante se ve más grande o destacado.
- **Consistencia**: los mismos elementos se ven y se comportan igual en toda la app.
- **Contraste y legibilidad**: el texto se puede leer sin esfuerzo.
- **Espaciado**: los elementos no están amontonados; hay espacio para respirar.
- **Accesibilidad**: personas con discapacidades visuales, motrices u otras también pueden usar la interfaz.
