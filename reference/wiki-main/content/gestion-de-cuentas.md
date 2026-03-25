---
title: "Gestión de cuentas"
description: "El conjunto de funcionalidades que permiten a los usuarios crear, modificar y eliminar sus cuentas dentro de una aplicación."
category: "Usuarios"
order: 4
question: "¿Cómo se administran los usuarios?"
related: ["autenticacion", "autorizacion", "base-de-datos"]
---

## ¿Qué incluye la gestión de cuentas?

Cuando hablamos de gestión de cuentas nos referimos a todo el ciclo de vida de un usuario en tu app: desde que se registra hasta que (eventualmente) borra su cuenta. Parece simple, pero tiene muchas partes: registro, verificación de email, edición de perfil, cambio de contraseña, recuperación de contraseña, y eliminación de cuenta. Son esas funcionalidades que toda app necesita y que muchas veces se subestiman.

## Registro de usuarios

El registro es la puerta de entrada. En su forma más básica, pedís email y contraseña. Pero hay varias cosas que tenés que considerar:

```javascript
// pages/api/register.js
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name } = req.body;

  // 1. Validate data
  if (!email || !password || password.length < 8) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  // 2. Verify that the email is not already registered
  const existing = await db.users.findByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'Email is already registered' });
  }

  // 3. Hash the password (NEVER store it in plain text)
  const passwordHash = await bcrypt.hash(password, 12);

  // 4. Create the user
  const user = await db.users.create({
    email,
    name,
    password: passwordHash,
    verified: false
  });

  // 5. Send verification email
  await sendVerificationEmail(user);

  res.status(201).json({ message: 'Account created. Verify your email.' });
}
```

Lo más importante: **nunca guardes contraseñas en texto plano**. Siempre usá un algoritmo de hashing (una función que convierte la contraseña en un texto irreversible, imposible de convertir de vuelta) como bcrypt. Si alguien accede a tu [base de datos](/base-de-datos), las contraseñas seguirán protegidas.

## Recuperación y cambio de contraseña

Los usuarios se olvidan las contraseñas todo el tiempo. El flujo estándar de recuperación es:

1. El usuario pide un "reset" ingresando su email.
2. Tu app genera un **token único** con expiración (por ejemplo, 1 hora).
3. Le mandás un email con un link tipo `https://mi-app.com/reset?token=xyz123`.
4. El usuario hace clic, ingresa su nueva contraseña.
5. Tu app verifica el token, hashea la nueva contraseña y la guarda.

Nunca le digas al usuario si el email existe o no en tu sistema (eso es una filtración de información). Siempre respondé algo genérico como "Si el email está registrado, vas a recibir un correo".

## Edición de perfil y preferencias

Permitirle al usuario cambiar su nombre, foto, idioma u otras preferencias parece trivial, pero tenés que cuidar los detalles. Si cambia el email, pedile que verifique el nuevo. Si cambia la contraseña, pedile la actual primero. Y siempre verificá la [autorización](/autorizacion): un usuario solo puede editar **su propio** perfil.

```javascript
// pages/api/profile.js
import { authenticate } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await authenticate(req, res);
  if (!user) return;

  const { name, language } = req.body;

  // Can only edit their own profile
  await db.users.update(user.id, { name, language });

  res.json({ message: 'Profile updated' });
}
```

## Eliminación de cuenta y GDPR

Hoy en día es obligatorio (legal y éticamente) permitir que un usuario elimine su cuenta y sus datos. Regulaciones como el **GDPR** (en Europa) y leyes similares exigen el "derecho al olvido". Cuando un usuario pide borrar su cuenta:

- Eliminá o anonimizá sus datos personales.
- Cancelá suscripciones activas.
- Borrá tokens y [sesiones](/sesiones) activas.
- Enviá un email de confirmación.
- Considerá un período de gracia (por ejemplo, 30 días) por si cambia de opinión.

No te olvides de tener un registro de estas operaciones. La gestión de cuentas es una de esas áreas donde la [autenticación](/autenticacion), la autorización y el manejo de datos se cruzan, y hacerlo bien desde el principio te ahorra muchos dolores de cabeza.
