---
title: "Sesiones"
description: "El mecanismo que permite a una aplicación recordar que un usuario ya inició sesión mientras navega entre páginas."
category: "Usuarios"
order: 3
question: "¿Cómo recuerda la app que ya iniciaste sesión?"
related: ["autenticacion", "estado", "cache"]
---

## ¿Qué es una sesión?

HTTP es un protocolo **sin estado** (stateless): cada request es independiente, el servidor no recuerda quién le habló antes. Entonces, ¿cómo hace la app para saber que ya te logueaste y no pedirte la contraseña en cada página? Para eso existen las **sesiones**. Una sesión es una forma de mantener información sobre el usuario entre requests, como si el servidor tuviera una memoria temporal de quién sos y qué estás haciendo.

## Cookies: la forma clásica

La forma más tradicional de manejar sesiones es con **cookies**. Cuando te logueás, el servidor crea una sesión, la guarda en memoria (o en una [base de datos](/base-de-datos)), y te manda un identificador en una cookie:

```http
HTTP/1.1 200 OK
Set-Cookie: session_id=abc123; HttpOnly; Secure; SameSite=Strict
```

A partir de ahí, tu navegador manda esa cookie automáticamente en cada request. El servidor recibe el `session_id`, busca la sesión correspondiente, y sabe quién sos.

```javascript
// pages/api/login.js — Next.js API route with iron-session
import { getIronSession } from 'iron-session';

const sessionOptions = {
  password: process.env.SESSION_SECRET, // At least 32 characters
  cookieName: 'myapp_session',
  cookieOptions: {
    httpOnly: true,   // Not accessible from client-side JavaScript
    secure: true,     // Only over HTTPS
    maxAge: 3600,     // Expires in 1 hour
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = await getIronSession(req, res, sessionOptions);

  // ...validate credentials...
  session.userId = user.id;
  session.role = user.role;
  await session.save();

  res.json({ message: 'Login successful' });
}
```

## Tokens JWT: la forma moderna

Otra forma muy popular es usar **JWT** (JSON Web Tokens). En vez de guardar la sesión en el servidor, toda la información va dentro del token:

```javascript
// pages/api/login.js — Next.js API route with JWT
import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // ...validate credentials...

  // On login, you generate a token
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token });
  // The client sends it with every request
  // Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
}
```

La ventaja de JWT es que el servidor no necesita guardar nada: el token ya contiene la información y está firmado para que nadie lo pueda alterar. La desventaja es que no podés "cerrar" una sesión fácilmente: el token es válido hasta que expire.

| | Cookies + sesión en servidor | JWT |
|---|---|---|
| **Dónde se guarda** | En el servidor | En el cliente |
| **Escalabilidad** | Necesitás compartir sesiones entre servidores | Cada servidor puede verificar el token solo |
| **Cerrar sesión** | Fácil: borrás la sesión del servidor | Complicado: el token sigue siendo válido |
| **Tamaño** | Cookie chica (solo el ID) | Token puede ser grande |

## Expiración y renovación

Las sesiones no deberían durar para siempre. Imaginate que te olvidás la sesión abierta en una computadora pública. Por eso siempre tienen una **expiración**. Hay dos estrategias comunes:

- **Expiración fija**: La sesión dura X tiempo (por ejemplo, 1 hora) sin importar qué.
- **Expiración deslizante**: Cada vez que hacés algo, el tiempo se renueva. Si estás 30 minutos sin actividad, se cierra.

Para JWT, es común usar un **refresh token**: un token de larga duración que sirve solo para pedir un nuevo token de acceso cuando el actual expira.

## Seguridad en sesiones

Mantener las sesiones seguras es fundamental:

- Usá siempre `HttpOnly` en las cookies para que JavaScript no pueda acceder a ellas (esto previene ataques XSS, donde un atacante intenta leer tus datos desde el navegador).
- Usá `Secure` para que solo viajen por HTTPS.
- Si trabajás con [autenticación](/autenticacion), asegurate de que la información en la sesión se combine correctamente con tu sistema de [autorización](/autorizacion) para controlar qué puede hacer cada usuario.
