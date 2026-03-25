---
title: "Cookies"
description: "Pequeños archivos de datos que el navegador almacena para recordar información entre visitas."
category: "Internet"
icon: "globe"
order: 6
question: "¿Cómo recuerda un sitio web quién sos?"
related: ["sesiones", "autenticacion", "http-https"]
---

## Qué son las cookies

Las **cookies** son pequeños fragmentos de texto que un servidor web le envía al navegador, y el navegador los guarda localmente. Cada vez que volvés a visitar ese sitio, el navegador envía las cookies de vuelta al servidor. Así es como un sitio "recuerda" quién sos, qué tenés en el carrito de compras, o que ya iniciaste [sesión](/sesiones).

## Cómo funcionan

El mecanismo es simple. Cuando el servidor quiere guardar algo en tu navegador, incluye un header `Set-Cookie` en la respuesta HTTP:

```
HTTP/1.1 200 OK
Set-Cookie: user=maria; Max-Age=3600; HttpOnly; Secure
```

A partir de ese momento, cada vez que tu navegador haga una petición a ese mismo dominio, va a incluir automáticamente la cookie en el header `Cookie`:

```
GET /profile HTTP/1.1
Cookie: user=maria
```

## Tipos de cookies

- **Cookies de sesión**: No tienen fecha de expiración explícita. Se borran cuando cerrás el navegador. Se usan para cosas temporales como mantener tu sesión activa.
- **Cookies persistentes**: Tienen una fecha de expiración (`Expires`) o un tiempo de vida (`Max-Age`). Sobreviven al cierre del navegador. Se usan para recordar preferencias o mantener sesiones por más tiempo.

## Atributos importantes

Las cookies tienen atributos que controlan su comportamiento y seguridad:

- **HttpOnly**: La cookie no se puede leer desde JavaScript (`document.cookie`). Protege contra ataques XSS (cuando alguien inyecta codigo malicioso en tu pagina).
- **Secure**: La cookie solo se envía por conexiones [HTTPS](/http-https). Nunca viaja en texto plano.
- **SameSite**: Controla si la cookie se envía en peticiones cross-site (de un sitio a otro). Puede ser `Strict`, `Lax` o `None`.
- **Domain / Path**: Definen a qué dominio y rutas aplica la cookie.

## First-party vs third-party

Las **cookies first-party** las setea el mismo sitio que estás visitando. Las **cookies third-party** las setea un dominio distinto (por ejemplo, un script de analytics o publicidad embebido en la página). Las cookies de terceros son las que te "persiguen" por internet mostrándote anuncios de algo que viste en otro sitio.

## Privacidad y regulaciones

Leyes como el **GDPR** (Europa) y la **LGPD** (Brasil) exigen que los sitios pidan consentimiento antes de setear cookies no esenciales. Por eso ves banners de "Aceptar cookies" en todos lados. Las cookies esenciales (como las de [autenticación](/autenticacion)) no requieren consentimiento, pero las de tracking sí.

## Ejemplo en codigo

```js
// pages/api/login.js (Next.js API Route)
export default function handler(req, res) {
  // Set a secure cookie after login
  res.setHeader("Set-Cookie", [
    `sessionId=abc123; HttpOnly; Secure; SameSite=Strict; Max-Age=3600; Path=/`,
  ]);
  res.status(200).json({ message: "Session started" });
}
```

Mirá cómo se combinan `httpOnly`, `secure` y `sameSite` para máxima seguridad. Si querés profundizar en cómo se manejan las [sesiones](/sesiones) del lado del servidor, ahí es donde las cookies se conectan con el sistema de [autenticación](/autenticacion).
