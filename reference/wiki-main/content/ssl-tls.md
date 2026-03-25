---
title: "SSL/TLS"
description: "Protocolos de seguridad que cifran la comunicación entre el navegador y el servidor."
category: "Infraestructura"
order: 8
question: "¿Cómo se protege la comunicación en internet?"
related: ["http-https", "dominio", "servidores"]
---

## ¿Qué es SSL/TLS?

Cuando entrás a una página web y ves el candadito en la barra del navegador, eso significa que la conexión está protegida por **SSL/TLS**. Son protocolos de seguridad que cifran toda la comunicación entre tu navegador y el [servidor](/servidores), para que nadie en el medio pueda leer o modificar los datos.

**SSL** (Secure Sockets Layer) fue el protocolo original, pero ya está obsoleto. **TLS** (Transport Layer Security) es su sucesor moderno y el que realmente se usa hoy. Cuando alguien dice "SSL", en la práctica casi siempre se refiere a TLS, pero el nombre quedó por costumbre.

## La "S" de HTTPS

[HTTP](/http-https) envía datos en texto plano: cualquiera que intercepte la comunicación puede leer todo. **HTTPS** es simplemente HTTP + TLS. Agrega una capa de cifrado que hace que los datos sean ilegibles para cualquier tercero:

```
HTTP (no encryption):
Browser ──── "user: juan, password: 1234" ────→ Server
              ↑ An attacker can read this

HTTPS (with TLS):
Browser ──── "x8Kp2#mLq9..." ────→ Server
              ↑ An attacker only sees encrypted data
```

## ¿Cómo funciona? El handshake TLS

Antes de intercambiar datos, el navegador y el servidor hacen un "apretón de manos" (handshake) para establecer una conexión segura:

1. **Cliente saluda**: el navegador le dice al servidor "quiero una conexión segura" y le manda las versiones de TLS y algoritmos de cifrado que soporta
2. **Servidor responde**: elige el algoritmo y envía su **certificado digital** (que contiene su clave pública)
3. **Verificación**: el navegador verifica que el certificado sea válido y emitido por una autoridad confiable
4. **Intercambio de claves**: ambos generan una clave secreta compartida usando criptografía asimétrica (un sistema donde hay dos claves: una pública que todos pueden ver y una privada que solo tiene el dueño)
5. **Comunicación cifrada**: a partir de ahí, todo se cifra con esa clave compartida

Todo esto pasa en milisegundos, antes de que se cargue la primera letra de la página.

## Certificados y autoridades certificantes

Un **certificado SSL/TLS** es como un documento de identidad para tu sitio web. Lo emite una **Autoridad Certificante (CA)** que verifica que vos realmente controlás ese [dominio](/dominio). Cuando el navegador recibe el certificado, le pregunta a la CA: "¿Este certificado es legítimo?" Si la respuesta es sí, muestra el candadito.

## Let's Encrypt: certificados gratis

Antes, los certificados costaban plata y eran complicados de instalar. **Let's Encrypt** cambió todo eso: es una autoridad certificante gratuita y automática. Con herramientas como **Certbot**, podés obtener y renovar certificados en segundos:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get a certificate for your domain
sudo certbot --nginx -d my-site.com -d www.my-site.com

# It renews automatically, but you can force it
sudo certbot renew
```

Certbot configura todo automáticamente: obtiene el certificado, configura Nginx para usarlo y programa la renovación automática cada 90 días.

## ¿Por qué HTTPS es obligatorio hoy?

Los navegadores modernos marcan los sitios sin HTTPS como "No seguro", lo que espanta a los usuarios. Además, Google favorece los sitios con HTTPS en los resultados de búsqueda. No hay excusa para no usar HTTPS: con Let's Encrypt es gratis y con servicios como Vercel o Netlify viene configurado de fábrica.

Si querés entender más sobre cómo funciona la comunicación entre navegador y servidor, mirá [HTTP/HTTPS](/http-https). Y para aprender a configurar tu propio [dominio](/dominio), ese es el primer paso antes de instalar un certificado.
