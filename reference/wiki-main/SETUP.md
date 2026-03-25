# Cómo configurar tu propia wiki

Esta plataforma es un template open-source. Solo necesitás editar la carpeta `content/` y dos variables de entorno para tener tu propia wiki.

## Estructura del proyecto

```
├── content/              ← Tus artículos van acá
│   ├── mi-articulo.md
│   ├── otro-tema.md
│   └── ...
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   └── lib/
├── .env.local            ← Variables de entorno
└── package.json
```

## 1. Crear un artículo

Cada artículo es un archivo `.md` dentro de `content/`. El nombre del archivo se convierte en la URL. Por ejemplo, `mi-tema.md` se accede en `/mi-tema`.

```markdown
---
title: "Nombre del concepto"
description: "Una descripción corta para las cards."
category: "Mi Categoría"
icon: "brain"
order: 1
question: "¿Qué pregunta responde este artículo?"
related: ["otro-articulo", "otro-mas"]
---

## Contenido del artículo

Escribí en Markdown normal. Podés usar **negrita**,
[links](/otro-articulo), listas, y bloques de código.
```

## 2. Campos del frontmatter

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| `title` | Sí | Nombre que aparece en el sidebar y en la página |
| `description` | Sí | Texto corto para las cards de la home |
| `category` | Sí | Agrupa el artículo en una sección. Si la categoría no existe, se crea automáticamente |
| `icon` | No | Ícono del sidebar para la categoría. Usá el nombre de [Lucide](https://lucide.dev/icons/) en kebab-case (ej: `message-square`, `brain`). Solo hace falta ponerlo en un artículo por categoría |
| `order` | No | Número para ordenar dentro de la categoría. Default: 99 |
| `question` | No | Pregunta que se muestra como título principal en las cards de la home |
| `related` | No | Lista de slugs de artículos relacionados. Se muestran al final de cada artículo |

## 3. Variables de entorno

Creá un archivo `.env.local` en la raíz del proyecto:

```bash
# Requerido para el chat con IA
OPENAI_API_KEY=sk-tu-api-key-aqui

# Opcional: modelo a usar (default: gpt-4o-mini)
OPENAI_MODEL=gpt-4o-mini
```

Si no necesitás el chat con IA, podés omitir la variable y el chat simplemente no va a funcionar. El resto del sitio funciona igual.

## 4. Instalación y desarrollo

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/tu-wiki.git
cd tu-wiki

# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build de producción
npm run build && npm start
```

## 5. Categorías e íconos

Las categorías se crean automáticamente a partir del campo `category` de tus artículos. No hace falta declararlas en ningún lado.

Para asignar un ícono a una categoría, agregá `icon: "nombre-del-icono"` en el frontmatter de cualquier artículo de esa categoría. Solo necesitás hacerlo en un artículo — el primero que tenga el campo define el ícono para toda la categoría.

Los nombres disponibles están en [lucide.dev/icons](https://lucide.dev/icons/). Usá el nombre en kebab-case: `brain`, `message-square`, `folder-open`.

## 6. Links entre artículos

Para linkear a otro artículo dentro del contenido, usá Markdown con la ruta del slug:

```markdown
Esto se conecta con la [base de datos](/base-de-datos)
y usa [autenticación](/autenticacion) para validar.
```

Para que se muestren como "conceptos relacionados" al final del artículo, agregalos al campo `related` del frontmatter.

## 7. Deploy

Al ser un proyecto Next.js estándar, podés desplegarlo en cualquier plataforma que soporte Node.js:

- **Vercel** — Conectá el repo y configurá las variables de entorno. Listo.
- **Netlify** — Funciona con el adaptador de Next.js.
- **Docker** — `npm run build` + `npm start` en cualquier servidor.
