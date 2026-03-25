---
title: "DNS"
description: "El DNS es el sistema que traduce nombres de dominio legibles (como google.com) a direcciones IP numéricas que las computadoras entienden."
category: "Internet"
order: 2
question: "¿Cómo se traduce un nombre a una dirección?"
related: ["dominio", "http-https", "servidores"]
---

## La guía telefónica de internet

Cuando escribís `miapp.com` en el navegador, tu computadora no tiene idea de dónde queda ese sitio. Necesita una dirección IP (como `104.21.34.56`) para conectarse al [servidor](/servidores) correcto. El **DNS** (Domain Name System) es el sistema que se encarga de esa traducción. Funciona como una enorme guía telefónica distribuida: vos buscás por nombre y te devuelve el número.

## Cómo funciona la resolución DNS

Cuando visitás un sitio web, pasan varios pasos en milisegundos:

1. **Tu navegador** revisa si ya tiene la IP guardada en su caché local.
2. Si no la tiene, le pregunta al **resolver DNS** de tu proveedor de internet (o al que hayas configurado, como `8.8.8.8` de Google).
3. El resolver consulta a los **servidores raíz** que le dicen dónde buscar el TLD (Top-Level Domain: `.com`, `.ar`, etc.).
4. Luego consulta al **servidor del TLD** que lo redirige al servidor autoritativo del [dominio](/dominio).
5. El **servidor autoritativo** responde con la IP final.
6. Tu navegador se conecta a esa IP usando [HTTP/HTTPS](/http-https).

Todo este proceso se llama **resolución DNS** y normalmente tarda entre 20 y 120 milisegundos.

## Tipos de registros DNS

Cuando configurás el DNS de tu dominio, creás **registros** que le dicen al sistema qué hacer con las consultas:

```
Type     Name            Value                  Use
──────── ─────────────── ────────────────────── ──────────────────────────
A        myapp.com       104.21.34.56           Points to an IPv4
AAAA     myapp.com       2606:4700::6811:2238   Points to an IPv6
CNAME    www             myapp.com              Alias to another domain
MX       myapp.com       mail.myapp.com         Email server
TXT      myapp.com       "v=spf1 ..."           Verification, SPF, DKIM
```

Los más importantes para un desarrollador web son:

- **A**: Apunta tu dominio a la dirección IP de tu servidor.
- **CNAME**: Crea un alias. Por ejemplo, que `www.miapp.com` apunte a `miapp.com`. También se usa para apuntar a servicios como Vercel o Netlify.
- **MX**: Configura el correo electrónico de tu dominio.

## Propagación y TTL

Cuando cambiás un registro DNS, el cambio no se refleja instantáneamente en todo el mundo. Los servidores DNS cachean (guardan temporalmente) las respuestas durante un tiempo definido por el **TTL** (Time To Live, o "tiempo de vida"), expresado en segundos. Si tu registro tiene un TTL de 3600, los servidores van a guardar la respuesta anterior hasta una hora.

Por eso, cuando migrás un sitio, es buena práctica bajar el TTL antes del cambio para que la **propagación** (el tiempo que tardan todos los servidores DNS del mundo en enterarse del cambio) sea más rápida.

## DNS en la práctica

Si estás arrancando un proyecto y querés que tu [dominio](/dominio) apunte a tu app, el flujo típico es: comprás el dominio en un registrador, entrás al panel de DNS (puede ser del registrador o de un servicio como Cloudflare), y creás un registro A o CNAME apuntando a donde tengas deployada tu aplicación. Plataformas como Vercel o Netlify te dan instrucciones claras de qué registros crear. Una vez configurado, podés verificar que funciona con herramientas como `dig` o `nslookup` desde la terminal:

```bash
dig myapp.com

# Simplified response:
# myapp.com.    300    IN    A    104.21.34.56
```
