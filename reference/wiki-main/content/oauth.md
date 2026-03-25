---
title: "OAuth"
description: "Un protocolo que permite a los usuarios iniciar sesión con sus cuentas de Google, GitHub u otros servicios."
category: "Usuarios"
order: 5
question: "¿Cómo funciona 'Iniciar sesión con Google'?"
related: ["autenticacion", "autorizacion", "sesiones"]
---

Seguro viste el botón de "Iniciar sesión con Google" en muchas apps. Detrás de ese botón hay un protocolo llamado **OAuth** que permite que un usuario se autentique usando una cuenta que ya tiene en otro servicio, sin compartir su contraseña con la aplicación.

## ¿Cómo funciona el flujo?

Pensá en OAuth como un proceso de cuatro pasos. Cuando hacés clic en "Iniciar sesión con Google":

1. **Redirect**: La app te redirige a Google (o el proveedor que sea)
2. **Consentimiento**: Google te muestra una pantalla preguntando si le das permiso a la app para acceder a tu información básica
3. **Callback**: Si aceptás, Google te redirige de vuelta a la app con un **código de autorización**
4. **Token**: La app usa ese código para pedirle a Google un **token de acceso**

```
User → App → Google (login + consent)
                    ↓
Google → App (authorization code)
                    ↓
App → Google (code → access token)
                    ↓
App → Google API (token → user data)
```

## OAuth vs OAuth 2.0

OAuth 1.0 era más complejo y requería firmas criptográficas en cada request. **OAuth 2.0** simplificó todo usando HTTPS y tokens. Hoy cuando alguien dice "OAuth", casi siempre se refiere a OAuth 2.0.

## Access tokens vs refresh tokens

Cuando la app recibe un **token de acceso** (una especie de "pase temporal" que demuestra que el usuario dio permiso), lo usa para hacer peticiones a la API del proveedor. Pero estos tokens **expiran** (generalmente en una hora). Para no obligar al usuario a loguearse de nuevo, existe el **refresh token**: un token de larga duración que sirve exclusivamente para pedir un nuevo access token cuando el actual expira.

```javascript
// Simplified example with NextAuth.js
// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Find or create the user in your database
      // profile contains name, email, photo, etc.
      return true;
    },
  },
});

// In any page or component, use the session
// pages/dashboard.js
import { useSession, signIn } from 'next-auth/react';

export default function Dashboard() {
  const { data: session } = useSession();

  if (!session) {
    return <button onClick={() => signIn('google')}>Sign in with Google</button>;
  }

  return <p>Welcome, {session.user.name}</p>;
}
```

## Proveedores comunes

Los más usados son **Google**, **GitHub**, **Facebook**, **Apple** y **Microsoft**. Cada uno tiene sus particularidades, pero el flujo base es el mismo. La mayoría de las apps ofrecen varios para que el usuario elija el que le resulte más cómodo.

## ¿Cuándo usar OAuth?

Si tu app necesita que los usuarios se registren, OAuth reduce la fricción enormemente: no tienen que crear otra contraseña más. Además, delegás la seguridad del login a empresas que invierten millones en proteger credenciales.

Mirá cómo se relaciona con el proceso general de [autenticación](/autenticacion) y cómo los tokens se mantienen vivos a través de las [sesiones](/sesiones).
