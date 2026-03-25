---
title: "Formularios"
description: "Los formularios son el principal mecanismo que tienen las aplicaciones para recibir información del usuario."
category: "Interfaz"
order: 3
question: "¿Cómo recibe datos una app?"
related: ["ui", "estado", "api"]
---

## La puerta de entrada de los datos

Cada vez que creás una cuenta, hacés una búsqueda, completás un checkout o enviás un mensaje, estás usando un **formulario**. Son la forma más directa que tiene una aplicación de recibir información de tu parte. Sin formularios, una app solo podría mostrarte datos, pero nunca recibir los tuyos.

## Anatomía de un formulario

Un formulario típico tiene varios elementos que trabajan juntos:

```jsx
// pages/register.js

import { useState } from 'react';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', country: 'ar', terms: false });

  async function handleSubmit(e) {
    e.preventDefault();
    await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Text field */}
      <label htmlFor="name">Full name</label>
      <input
        type="text"
        id="name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />

      {/* Email field */}
      <label htmlFor="email">Email</label>
      <input
        type="email"
        id="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />

      {/* Selector */}
      <label htmlFor="country">Country</label>
      <select
        id="country"
        value={form.country}
        onChange={(e) => setForm({ ...form, country: e.target.value })}
      >
        <option value="ar">Argentina</option>
        <option value="uy">Uruguay</option>
        <option value="cl">Chile</option>
      </select>

      {/* Checkbox */}
      <label>
        <input
          type="checkbox"
          checked={form.terms}
          onChange={(e) => setForm({ ...form, terms: e.target.checked })}
          required
        />
        I accept the terms and conditions
      </label>

      {/* Submit button */}
      <button type="submit">Create account</button>
    </form>
  );
}
```

Hay muchos tipos de campos: texto libre, emails, contraseñas, fechas, selectores, checkboxes, radio buttons, áreas de texto, uploads de archivos, y más.

## Validación: evitar que entre basura

Uno de los trabajos más importantes de un formulario es **validar** lo que el usuario ingresa antes de enviarlo. La validación puede ocurrir en dos momentos:

- **En el frontend** (validación del cliente): se verifica al instante, sin consultar al servidor. Por ejemplo, que un email tenga formato válido o que la contraseña tenga al menos 8 caracteres. Es rápida y mejora la [experiencia del usuario](/ux).
- **En el backend** (validación del servidor): se verifica del lado del [servidor](/servidor-backend). Por ejemplo, que el email no esté ya registrado en la base de datos. Es imprescindible por seguridad, porque alguien podría saltarse la validación del frontend.

```javascript
// lib/validation.js — reusable validation for Next.js forms
export function validateEmail(email) {
  if (!email.includes('@')) {
    return 'Enter a valid email';
  }
  return null; // no errors
}
```

Siempre se necesitan ambas. La del frontend es para comodidad; la del backend es para seguridad.

## El flujo del envío

Cuando tocás "Enviar" en un formulario, pasa lo siguiente:

1. El frontend recopila todos los valores de los campos.
2. Se ejecuta la validación del cliente.
3. Si todo está bien, se envía la información al [backend a través de la API](/api).
4. El backend valida de nuevo, procesa los datos y responde.
5. El frontend muestra el resultado: éxito, error, o instrucciones adicionales.

Durante todo este proceso, el [estado](/estado) del formulario va cambiando: de "vacío" a "completándose", a "enviando", a "enviado con éxito" o "con errores".

## Buenas prácticas

Algunos patrones que hacen que los formularios sean usables y no una tortura:

- **Mostrá errores al lado del campo**, no todos juntos arriba.
- **No borres lo que el usuario escribió** si hay un error: dejá que corrija solo lo que está mal.
- **Usá labels claras**: "Nombre completo" es mejor que solo "Nombre".
- **Deshabilitá el botón** mientras se está enviando para evitar envíos duplicados.
- **Pedí solo lo necesario**: cada campo extra es una razón más para que el usuario abandone el formulario.
