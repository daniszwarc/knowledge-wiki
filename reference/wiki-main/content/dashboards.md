---
title: "Dashboards"
description: "Paneles visuales que muestran métricas y datos clave de la aplicación en tiempo real."
category: "Analytics"
order: 6
question: "¿Cómo se visualizan las métricas del producto?"
related: ["metricas", "eventos-analytics", "monitoreo"]
---

## ¿Qué es un dashboard?

Un **dashboard** es un panel visual que muestra las [métricas](/metricas) más importantes de tu producto en un solo lugar. Pensá en él como el tablero de un auto: de un vistazo, tenés que poder saber si todo anda bien o si hay algo que necesita atención. Un buen dashboard te ahorra tener que buscar datos en distintos lugares y te da contexto rápido para tomar decisiones.

## Tipos de dashboards

No todos los dashboards sirven para lo mismo. Los más comunes son:

- **Operacionales**: muestran el estado actual del sistema en tiempo real. Errores, latencia, uso de CPU, requests por segundo. Son los que mira el equipo de ingeniería y están muy ligados al [monitoreo](/monitoreo).
- **De producto/negocio**: muestran métricas como usuarios activos, conversión, retención, ingresos. Se actualizan diariamente o semanalmente. Los mira el equipo de producto, marketing o la dirección.
- **De investigación**: dashboards temporales para explorar datos específicos, como el impacto de una feature nueva o una campaña de marketing.

## Herramientas comunes

Hay muchas opciones para armar dashboards:

```
Tool                 Primary use
─────────────────────────────────────────────
Grafana              Technical monitoring, infra metrics
Mixpanel             Product analytics, user events
Google Analytics     Web traffic, acquisition, behavior
Amplitude            Product analytics, cohorts, funnels
Metabase             Visualized SQL queries, internal reports
Looker / Data Studio Business reports, data from multiple sources
Custom (React, D3)   Custom dashboards integrated into your app
```

## Cómo diseñar un buen dashboard

El error más común es meter demasiada información. Un dashboard sobrecargado es peor que no tener ninguno, porque nadie lo mira. Seguí estas reglas:

- **Menos es más**: 5-8 métricas clave como máximo. Si necesitás más, hacé dashboards separados.
- **Jerarquía visual**: lo más importante arriba y más grande. Los detalles abajo.
- **Contexto**: mostrá comparaciones (vs. semana pasada, vs. mes pasado) para que los números tengan significado.
- **Alertas, no solo datos**: configurá alertas para que el dashboard te avise cuando algo se sale del rango normal, en vez de depender de que alguien lo mire constantemente.

## Tiempo real vs. histórico

Un dashboard de [monitoreo](/monitoreo) técnico necesita datos en tiempo real (o casi). Si el servidor se cae, querés saberlo ya, no mañana. Pero un dashboard de [métricas](/metricas) de negocio generalmente funciona bien con datos actualizados cada hora o cada día. No toda métrica necesita ser en tiempo real, y forzar actualización constante puede complicar la infraestructura sin un beneficio real.

La clave es que el dashboard se use. Un dashboard que nadie mira es código desperdiciado. Empezá simple, iterá según lo que el equipo realmente necesita ver, y eliminá lo que no aporta.
