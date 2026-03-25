---
title: "Estado"
description: "El estado es la información que una aplicación necesita recordar en un momento dado para funcionar correctamente."
category: "Fundamentos"
order: 4
question: "¿Cómo recuerda cosas una app?"
related: ["cliente-frontend", "sesiones", "cache"]
---

## ¿Qué es el estado?

Imaginá que estás llenando un formulario largo en una app. Escribiste tu nombre, elegiste tu país, subiste una foto de perfil. Toda esa información que la app está "recordando" mientras la usás es lo que se llama **estado**. Es como la memoria a corto plazo de la aplicación: los datos que necesita tener presentes para mostrarte lo correcto en pantalla y responder a tus acciones.

## Estado local vs. estado global

No todo el estado es igual. En el [frontend](/cliente-frontend), se suele distinguir entre dos tipos:

- **Estado local**: pertenece a una parte específica de la pantalla. Por ejemplo, si un menú desplegable está abierto o cerrado, o qué texto escribiste en un campo de búsqueda. Solo le importa a ese componente.
- **Estado global**: es información que necesitan varias partes de la aplicación al mismo tiempo. Por ejemplo, los datos del usuario logueado, el idioma elegido, o los productos en el carrito de compras.

```javascript

import { useState, useContext } from 'react';

// Local state: only matters to this component
const [menuOpen, setMenuOpen] = useState(false);

// Global state: needed by many parts of the app
// (logged-in user, shopping cart, visual theme)
const { user } = useContext(AuthContext);
```

## ¿Dónde vive el estado?

El estado puede vivir en distintos lugares:

- **En la memoria del navegador** (variables de JavaScript): se pierde cuando cerrás la pestaña.
- **En el almacenamiento local** (localStorage/sessionStorage): sobrevive entre recargas de la página.
- **En [cookies o sesiones](/sesiones)**: el servidor puede recordar quién sos entre visitas.
- **En el [caché](/cache)**: datos guardados temporalmente para no pedirlos de nuevo.
- **En el servidor**: la fuente de verdad definitiva, guardada en una base de datos.

## Herramientas para manejar el estado

Cuando una aplicación crece, manejar el estado se vuelve complicado. Por eso existen herramientas especializadas:

- **useState / useReducer** (React): para estado local de componentes.
- **Context API** (React): para compartir estado entre componentes sin pasarlo manualmente.
- **Redux / Zustand / Pinia**: librerías dedicadas a manejar estado global de forma predecible.

La idea central es siempre la misma: tener un lugar claro donde vive la información y reglas claras sobre cómo se puede modificar.

## ¿Por qué es tan importante?

La mayoría de los bugs en una aplicación vienen de problemas con el estado. Un botón que debería estar deshabilitado pero no lo está, un carrito que muestra un producto que ya borraste, un formulario que se resetea solo. Todo eso pasa cuando el estado no se maneja bien. Entender este concepto es fundamental para construir aplicaciones que funcionen de forma predecible y no le den sorpresas al usuario.
