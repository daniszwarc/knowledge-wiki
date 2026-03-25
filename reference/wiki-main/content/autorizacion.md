---
title: "Autorización"
description: "El proceso de determinar qué acciones o recursos tiene permitido acceder un usuario ya autenticado."
category: "Usuarios"
order: 2
question: "¿Cómo sabe la app qué podés hacer?"
related: ["autenticacion", "sesiones", "api"]
---

## ¿Qué es la autorización?

Una cosa es saber **quién sos** (eso es [autenticación](/autenticacion)) y otra muy distinta es saber **qué podés hacer** (eso es autorización). Pensalo así: cuando entrás a un edificio, mostrar tu documento es la autenticación. Pero que puedas entrar a ciertas oficinas y a otras no, eso es autorización. En una app, después de que el usuario se logueó, el sistema necesita decidir qué funcionalidades puede usar y a qué datos puede acceder.

## Autenticación vs Autorización

Es muy común confundir estos dos conceptos, así que aclaremos:

| | Autenticación | Autorización |
|---|---|---|
| **Pregunta** | ¿Quién sos? | ¿Qué podés hacer? |
| **Cuándo pasa** | Al iniciar sesión | En cada acción dentro de la app |
| **Ejemplo** | Ingresar usuario y contraseña | Intentar acceder al panel de admin |
| **Si falla** | "Credenciales incorrectas" | "No tenés permiso para hacer esto" |

Primero te autenticás, después la app te autoriza (o no) según tu rol y permisos.

## Roles y permisos

La forma más común de manejar autorización es con **roles**. Cada usuario tiene un rol asignado, y cada rol tiene un conjunto de permisos:

```javascript
// lib/roles.js
const roles = {
  admin: {
    permissions: ['read', 'create', 'edit', 'delete', 'manage_users']
  },
  editor: {
    permissions: ['read', 'create', 'edit']
  },
  viewer: {
    permissions: ['read']
  }
};

module.exports = { roles };
```

Cuando un usuario intenta hacer algo, la app chequea si su rol tiene el permiso necesario:

```javascript
// lib/auth.js
const { roles } = require('./roles');

function hasPermission(user, permission) {
  const role = roles[user.role];
  return role.permissions.includes(permission);
}

// pages/api/posts/[id].js
export default function handler(req, res) {
  if (req.method === 'DELETE') {
    // Check authorization before executing the action
    if (!hasPermission(req.user, 'delete')) {
      return res.status(403).json({ error: 'You do not have permission for this action' });
    }

    // Delete the post...
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
```

## RBAC: Control de acceso basado en roles

Este patrón se llama **RBAC** (Role-Based Access Control) y es el más usado por su simplicidad. Pero hay variantes más sofisticadas:

- **RBAC**: Asignás roles a usuarios, y permisos a roles. Simple y efectivo para la mayoría de las apps.
- **ABAC** (Attribute-Based): Los permisos dependen de atributos del usuario, del recurso y del contexto. Ejemplo: "Un usuario puede editar un post solo si es el autor".
- **ACL** (Access Control List, o lista de control de acceso): Cada recurso tiene una lista de quién puede hacer qué con él.

Para la mayoría de los proyectos, RBAC es más que suficiente. Solo considerá modelos más complejos si realmente los necesitás.

## En la práctica

La autorización tiene que validarse tanto en el frontend (para mostrar u ocultar botones y secciones) como en el backend (para proteger las rutas de la [API](/api)). Nunca confíes solo en esconder un botón en el frontend: cualquiera puede hacer un request directo a tu API. Por eso, las [sesiones](/sesiones) llevan información del usuario y su rol, y cada endpoint del servidor verifica los permisos antes de ejecutar la acción.
