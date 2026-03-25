---
title: "Modularidad"
description: "La modularidad es el principio de organizar el código en partes independientes y reutilizables, cada una con una responsabilidad clara."
category: "Arquitectura"
order: 3
question: "¿Cómo se organiza el código en partes?"
related: ["dependencias", "monolito", "repositorio"]
---

## ¿Qué es la modularidad?

La **modularidad** es la práctica de dividir tu código en partes (módulos) que sean independientes entre sí, cada una con una responsabilidad clara. Pensalo como los cajones de una cómoda: cada cajón guarda un tipo de cosa, y podés abrir uno sin afectar a los demás. En software, un módulo puede ser un archivo, una carpeta, un paquete o una biblioteca, dependiendo de la escala.

## Separación de responsabilidades

El principio detrás de la modularidad es la **separación de responsabilidades** (separation of concerns). Cada módulo debería hacer una cosa y hacerla bien. Si tenés un módulo que maneja autenticación, no debería también enviar emails. Si tenés un componente de UI que muestra una lista, no debería hacer llamadas a la [API](/api) directamente.

```javascript
// pages/products.js
import { useEffect, useState } from "react";

function ProductsPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then((response) => response.json())
      .then(setProducts);
  }, []);

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  );
}
```

Ese ejemplo funciona, pero mezcla acceso a datos, estado y presentación en un solo archivo. Una versión más modular suele separarlo así:

```text
pages/products.js              -> arma la pantalla
hooks/useProducts.js           -> carga y guarda el estado
components/ProductList.jsx     -> renderiza la lista
lib/products.js                -> centraliza las llamadas a la API
```

```javascript
// pages/products.js
import { useProducts } from "../hooks/useProducts";
import { ProductList } from "../components/ProductList";

export default function ProductsPage() {
  const { products, loading } = useProducts();

  if (loading) return <p>Cargando...</p>;
  return <ProductList products={products} />;
}
```

Fijate en el cambio: la página ya no sabe cómo se hace el `fetch`, solo sabe qué necesita mostrar.

## Niveles de modularidad

La modularidad aplica a distintos niveles:

- **Funciones**: la unidad más chica. Cada función hace una cosa específica.
- **Archivos/módulos**: agrupan funciones relacionadas. En JavaScript usás `import`/`export` para definir qué expone cada módulo.
- **Carpetas/paquetes**: agrupan módulos relacionados. Por ejemplo, una carpeta `auth/` con todo lo relacionado a autenticación.
- **Bibliotecas**: módulos empaquetados para ser reutilizados en otros proyectos. Los publicás en un registro como npm o PyPI.
- **Servicios**: la modularidad llevada al extremo, donde cada módulo se convierte en un [servicio](/servicios) independiente.

## Beneficios de un código modular

Un código bien modularizado tiene ventajas enormes a medida que el proyecto crece:

- **Legibilidad**: es más fácil entender 10 archivos de 50 líneas que un archivo de 500 líneas.
- **Reutilización**: un módulo bien diseñado se puede usar en distintas partes del proyecto, o incluso en otros proyectos.
- **Testeabilidad**: es mucho más fácil escribir [tests](/testing) para un módulo que hace una sola cosa.
- **Mantenibilidad**: podés modificar un módulo sin miedo de romper otros, siempre que mantengas la misma interfaz.
- **Trabajo en equipo**: distintas personas pueden trabajar en distintos módulos sin pisarse.

## ¿Cómo empezar a modularizar?

Si tu código es un [monolito](/monolito) donde todo está mezclado, no trates de reorganizarlo todo de una. Empezá por las partes más claras: extraé la lógica de acceso a datos a un módulo separado, mové los componentes de UI a su propia carpeta, agrupá las utilidades.

Una buena regla: si abrís un archivo y te cuesta encontrar lo que buscás, probablemente ese archivo está haciendo demasiadas cosas. Las [dependencias](/dependencias) entre módulos deberían ser claras y explícitas, no implícitas y escondidas.
