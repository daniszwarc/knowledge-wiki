---
title: "Roles y permisos"
description: "Un sistema para controlar qué puede hacer cada usuario dentro de una aplicación."
category: "Usuarios"
order: 6
question: "¿Cómo se controla quién puede hacer qué?"
related: ["autorizacion", "autenticacion", "gestion-de-cuentas"]
---

Una cosa es saber **quién** es un usuario ([autenticación](/autenticacion)) y otra muy distinta es definir **qué puede hacer** ([autorización](/autorizacion)). Los roles y permisos son el sistema que resuelve esa segunda pregunta.

## ¿Qué es RBAC?

**RBAC** (Role-Based Access Control, o control de acceso basado en roles) es el modelo más común. En vez de asignar permisos individuales a cada usuario, creás **roles** que agrupan permisos, y después asignás roles a los usuarios.

Por ejemplo, en un blog:

| Permiso | Admin | Editor | Lector |
|---------|-------|--------|--------|
| Ver artículos | Sí | Sí | Sí |
| Crear artículos | Sí | Sí | No |
| Editar cualquier artículo | Sí | Sí | No |
| Eliminar artículos | Sí | No | No |
| Gestionar usuarios | Sí | No | No |

## Roles comunes

La mayoría de las apps tienen al menos estos tres roles:

- **Admin**: puede hacer todo, incluyendo gestionar otros usuarios
- **Editor/Moderador**: puede crear y modificar contenido, pero no tocar configuraciones críticas
- **Viewer/Lector**: solo puede ver, no modificar nada

Dependiendo de la app, podés agregar roles intermedios como **Manager**, **Contributor** o roles personalizados.

## Implementación con middleware

En una API, los permisos se verifican generalmente con **middleware** (funciones que se ejecutan antes de llegar a la lógica principal del endpoint, como un guardia de seguridad en la puerta):

```javascript
// lib/requireRole.js — Helper that verifies the user's role
export function requireRole(user, allowedRoles) {
  if (!user) {
    return { allowed: false, status: 401, error: 'Not authenticated' };
  }
  if (!allowedRoles.includes(user.role)) {
    return { allowed: false, status: 403, error: 'Permission denied' };
  }
  return { allowed: true };
}

// pages/api/articles/index.js — Usage in a Next.js API route
import { requireRole } from '../../../lib/requireRole';

export default async function handler(req, res) {
  const check = requireRole(req.user, ['admin', 'editor', 'reader']);
  if (!check.allowed) {
    return res.status(check.status).json({ error: check.error });
  }

  if (req.method === 'GET') {
    // Return articles...
    return res.status(200).json({ articles: [] });
  }

  if (req.method === 'POST') {
    const writeCheck = requireRole(req.user, ['admin', 'editor']);
    if (!writeCheck.allowed) {
      return res.status(writeCheck.status).json({ error: writeCheck.error });
    }
    // Create article...
    return res.status(201).json({ article: {} });
  }
}
```

## Permisos granulares

A veces los roles no alcanzan. Imaginá que un editor puede editar **solo sus propios** artículos, no los de otros. Ahí necesitás permisos más granulares:

```javascript
// pages/api/articles/[id].js — Granular permissions in a Next.js API route
import { requireRole } from '../../../lib/requireRole';
import { getArticleById } from '../../../lib/articles';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const check = requireRole(req.user, ['admin', 'editor']);
  if (!check.allowed) {
    return res.status(check.status).json({ error: check.error });
  }

  const article = await getArticleById(req.query.id);

  // An editor can only edit their own articles
  if (req.user.role === 'editor' && article.authorId !== req.user.id) {
    return res.status(403).json({ error: 'You can only edit your own articles' });
  }

  // Update the article...
  res.status(200).json({ article });
}
```

## Autenticación vs autorización

No confundas estos conceptos. La [autenticación](/autenticacion) responde "¿quién sos?", mientras que la autorización (a través de roles y permisos) responde "¿qué podés hacer?". Primero te autenticás, y después el sistema chequea tus permisos. Si querés profundizar en cómo se gestionan las cuentas de usuario que llevan estos roles, mirá [gestión de cuentas](/gestion-de-cuentas).
