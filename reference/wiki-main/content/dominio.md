---
title: "Dominio"
description: "Un dominio es el nombre legible que identifica a un sitio web en internet, como google.com o miapp.com.ar."
category: "Internet"
order: 1
question: "¿Qué es un dominio?"
related: ["dns", "servidores", "deploy"]
---

## La dirección de tu sitio

Cada sitio web en internet tiene una dirección numérica llamada **dirección IP** (algo como `142.250.185.14`). Pero a nadie le resulta fácil recordar números así. Un **dominio** es simplemente un nombre legible que apunta a esa dirección. En vez de escribir números en el navegador, escribís `google.com` y listo. El sistema de [DNS](/dns) se encarga de traducir ese nombre a la IP correspondiente.

## Partes de un dominio

Un dominio tiene varias partes, y entender cada una te ayuda a no confundirte cuando tengas que configurar uno:

```
https://blog.myapp.com.ar
         │     │     │  │
         │     │     │  └─ Country TLD (.ar = Argentina)
         │     │     └──── Generic TLD (.com)
         │     └────────── Second-level domain (myapp)
         └──────────────── Subdomain (blog)
```

- **TLD (Top-Level Domain)**: Es la extensión final. Las más comunes son `.com`, `.org`, `.net`. También hay TLDs de país como `.ar`, `.mx`, `.co`, y modernos como `.io`, `.dev`, `.app`.
- **Dominio de segundo nivel**: Es el nombre que vos elegís, como `miapp` o `tuempresa`. Es la parte más importante porque es tu identidad en la web.
- **Subdominio**: Es un prefijo que va antes del dominio principal. Por ejemplo, `blog.miapp.com` o `api.miapp.com`. Podés crear los subdominios que quieras sin pagar extra.

## Cómo comprar un dominio

Los dominios se registran a través de **registradores** (registrars). No estás comprando el dominio para siempre; lo alquilás por períodos (generalmente 1 año) y tenés que renovarlo. Algunos registradores populares son:

- **Namecheap**: Buena relación precio/funcionalidades.
- **Cloudflare Registrar**: Vende dominios al costo, sin markup.
- **Google Domains** (ahora Squarespace Domains): Simple y bien integrado.
- **NIC Argentina** (nic.ar): Para dominios `.com.ar` y `.ar`.

Cuando elegís un dominio, verificás que esté disponible, lo registrás y después lo apuntás a tu [servidor](/servidores) configurando los registros [DNS](/dns).

## TLDs: ¿cuál elegir?

Si tu proyecto es una empresa o producto, `.com` sigue siendo el estándar porque la gente lo escribe por instinto. Si es un proyecto tech o una startup, `.io` y `.dev` son muy populares. Si apuntás al mercado argentino, `.com.ar` genera confianza local. Lo importante es que el nombre sea corto, memorable y fácil de escribir.

## Dominio y marca

El dominio es una de las primeras cosas que elegís cuando arrancás un proyecto. No necesitás el dominio perfecto el día uno: muchos productos exitosos arrancaron con nombres provisorios. Pero cuando llega el momento de lanzar, tener un buen dominio ayuda a que la gente te encuentre y te recuerde. Una vez que lo tenés registrado, podés configurar el [DNS](/dns) para que apunte a tu aplicación ya deployada.
