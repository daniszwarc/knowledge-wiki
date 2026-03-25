---
title: "Anatomía de un proyecto"
description: "Los archivos y carpetas que vas a encontrar en cualquier proyecto de código, y para qué sirve cada uno."
category: "Fundamentos"
order: 9
question: "¿Qué son todos esos archivos en un proyecto?"
related: ["componentes", "navegacion", "modularidad", "dependencias"]
---

## La estructura de un proyecto

Cuando abrís un proyecto de código por primera vez, ves un montón de archivos y carpetas con nombres que parecen crípticos. Pero cada uno tiene un propósito claro. Esta guía te explica los más comunes para que puedas orientarte en cualquier proyecto de código.

Si te sirve una imagen mental, un proyecto web con Next.js y Node.js suele verse más o menos así:

```text
mi-app/
├── package.json
├── .env.local
├── public/
│   └── logo.svg
└── src/
    ├── pages/
    │   ├── index.jsx
    │   └── api/
    │       └── users.js
    ├── components/
    │   └── Header.jsx
    ├── lib/
    │   └── db.js
    └── styles/
        └── globals.css
```

No hace falta memorizar este árbol. Lo importante es entender la lógica: `pages/` define rutas, `components/` guarda piezas reutilizables, `lib/` concentra lógica compartida y `public/` contiene archivos estáticos.

## Componentes comunes de interfaz

Estos son nombres que vas a encontrar una y otra vez en la carpeta `components/` o `src/`:

| Nombre en código | Qué es | Qué hace |
|---|---|---|
| **Header** / **Navbar** | Barra superior | Navegación principal, logo, menú, botones de acción |
| **Footer** | Pie de página | Links secundarios, copyright, redes sociales |
| **Sidebar** | Barra lateral | Navegación secundaria, filtros, menú colapsable |
| **Layout** | Estructura base | Envuelve todas las páginas con header, footer, sidebar |
| **Modal** / **Dialog** | Ventana emergente | Confirmaciones, formularios, alertas que aparecen encima del contenido |
| **Card** | Tarjeta | Bloque visual que agrupa información (producto, artículo, usuario) |
| **Button** | Botón | Acción clickeable con variantes (primary, secondary, danger) |
| **Input** / **TextField** | Campo de texto | Donde el usuario escribe datos |
| **Form** | Formulario | Agrupa inputs y maneja el envío de datos |
| **Avatar** | Imagen de perfil | Foto circular del usuario |
| **Badge** | Etiqueta | Indicador pequeño (conteo de notificaciones, estado) |
| **Tooltip** | Texto emergente | Información extra al pasar el mouse sobre algo |
| **Dropdown** / **Select** | Menú desplegable | Lista de opciones que se abre al hacer click |
| **Tabs** | Pestañas | Navegación entre secciones dentro de una misma vista |
| **Breadcrumb** | Migas de pan | Muestra la ruta de navegación (Home > Productos > Detalle) |
| **Spinner** / **Loader** | Indicador de carga | Animación mientras se carga contenido |
| **Toast** / **Snackbar** | Notificación temporal | Mensaje que aparece brevemente y desaparece solo |
| **Pagination** | Paginador | Controles para navegar entre páginas de resultados |

## Archivos de configuración

En la raíz del proyecto vas a encontrar archivos que no son código de la app, sino configuración:

| Archivo | Para qué sirve |
|---|---|
| **package.json** | Lista de [dependencias](/dependencias) y scripts del proyecto |
| **.env** / **.env.local** | [Variables de entorno](/variables-de-entorno) (claves de API, configuración secreta) |
| **README.md** | Documentación del proyecto — qué es, cómo instalarlo, cómo usarlo |
| **.gitignore** | Archivos que Git debe ignorar (node_modules, .env, etc.) |
| **tsconfig.json** | Configuración de TypeScript |
| **next.config.js** | Configuración de Next.js |
| **tailwind.config.js** | Configuración de Tailwind CSS |
| **Dockerfile** | Instrucciones para crear un [contenedor](/contenedores) |
| **.eslintrc** | Reglas de estilo de código |

## Carpetas típicas

| Carpeta | Qué contiene |
|---|---|
| **src/** | Todo el código fuente de la aplicación |
| **components/** | Componentes reutilizables de interfaz |
| **pages/** o **app/** | Las rutas/páginas de la aplicación |
| **api/** | Endpoints del [backend](/servidor-backend) |
| **lib/** o **utils/** | Funciones auxiliares y lógica compartida |
| **hooks/** | Hooks personalizados (lógica reutilizable en React) |
| **contexts/** | Contextos de React para [estado](/estado) global |
| **styles/** | Archivos CSS y estilos |
| **public/** | Archivos estáticos (imágenes, favicons, fuentes) |
| **tests/** o **__tests__/** | [Tests](/testing) del proyecto |
| **node_modules/** | Dependencias instaladas (no se toca manualmente) |

## ¿Por qué importa?

Cuando le pedís a una AI que te ayude con tu proyecto, saber cómo se llaman las cosas hace toda la diferencia. No es lo mismo decir "quiero un cosito arriba" que "necesito un Header con navegación y un botón de dark mode". Los nombres son un lenguaje compartido entre programadores — y ahora también entre vos y tu modelo de AI.
