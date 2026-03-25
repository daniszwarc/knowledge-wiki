---
title: "Monitoreo"
description: "El monitoreo es la práctica de observar continuamente una aplicación para detectar problemas antes de que afecten a los usuarios."
category: "Infraestructura"
order: 5
question: "¿Cómo se vigila que todo funcione?"
related: ["logs", "servidores", "metricas"]
---

## ¿Por qué monitorear?

Tu aplicación puede estar andando perfecto ahora y romperse en cinco minutos. Sin monitoreo, te enterás de los problemas cuando un usuario te escribe "che, no anda la app". Con monitoreo, te enterás antes que el usuario, o al menos al mismo tiempo. Monitorear es tener ojos puestos en tu sistema 24/7, detectando anomalías y avisándote cuando algo no está bien.

## ¿Qué se monitorea?

Hay varias capas que necesitás vigilar:

- **Uptime:** ¿La aplicación responde? ¿Los endpoints principales devuelven 200? Esto es lo más básico.
- **Latencia:** ¿Cuánto tarda en responder? Si normalmente tarda 200ms y de repente tarda 3 segundos, algo pasa.
- **Tasa de errores:** ¿Qué porcentaje de requests falla? Un pico de errores 500 es señal de alarma.
- **Recursos del servidor:** CPU, memoria, disco. Si el [servidor](/servidores) está al 95% de CPU, pronto se va a caer.
- **Métricas de negocio:** Cantidad de registros, ventas por hora, conversiones. Si caen de golpe, puede haber un bug.

## Alertas

De nada sirve tener dashboards hermosos si nadie los mira. Las **alertas** son notificaciones automáticas que se disparan cuando una métrica cruza un umbral:

```yaml
# Conceptual alert example
alert: "High error rate"
condition: error_rate_5xx > 5%
duration: 5 minutes
notify:
  - channel: slack, destination: "#alerts-prod"
  - channel: email, destination: "oncall@team.com"
  - channel: pagerduty, destination: "backend-team"
```

Las buenas alertas son accionables: te dicen qué está pasando y te dan contexto para que puedas actuar. Las malas alertas son ruidosas y terminás ignorándolas (alert fatigue).

## Herramientas de monitoreo

El ecosistema de herramientas es amplio:

- **Uptime monitoring:** UptimeRobot, Better Stack, Pingdom. Hacen ping a tu app cada minuto y te avisan si no responde.
- **APM (Application Performance Monitoring):** Datadog, New Relic, Sentry. Rastrean cada request a través de tu aplicación, miden tiempos y detectan errores.
- **Error tracking:** Sentry es el estándar. Captura errores con todo su contexto (stack trace, datos del usuario, request) y los agrupa.
- **Dashboards:** Grafana te permite crear paneles visuales que muestran tus métricas en tiempo real.

## Monitoreo vs. logs

Los [logs](/logs) y el monitoreo son complementarios. Los logs te cuentan la historia detallada de qué pasó ("el request del usuario X falló en la línea 42 con este error"). El monitoreo te da la vista panorámica ("el 8% de los requests están fallando desde hace 10 minutos"). Cuando una alerta de monitoreo te avisa de un problema, vas a los logs para investigar la causa. Los dos juntos son esenciales para operar una aplicación en producción.

## Observabilidad

El término más amplio es **observabilidad**, que combina tres pilares: **logs** (qué pasó), **métricas** (cuánto/cuándo) y **traces** (el rastro que deja un request a medida que pasa por múltiples servicios, para que puedas seguir su camino completo). Una aplicación observable es una que podés entender y debuggear desde afuera, sin necesidad de poner breakpoints ni reproducir el problema localmente. Cuanto más crece tu sistema, más importante se vuelve esto.
