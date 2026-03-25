---
title: "Cohortes"
description: "Grupos de usuarios agrupados por una característica o momento en común para analizar su comportamiento."
category: "Analytics"
order: 5
question: "¿Cómo se compara el comportamiento entre grupos de usuarios?"
related: ["metricas", "retencion", "funnels"]
---

## ¿Qué es una cohorte?

Una **cohorte** es un grupo de usuarios que comparten una característica o un momento en común. Por ejemplo, "todos los usuarios que se registraron en enero de 2024" son una cohorte.

La idea es agrupar usuarios para comparar cómo se comportan a lo largo del tiempo. En vez de mirar promedios generales que mezclan todo, las cohortes te dejan ver patrones reales: ¿los usuarios nuevos se quedan más que los de hace tres meses? ¿El cambio que hiciste en el onboarding (el proceso de bienvenida para usuarios nuevos) mejoró la [retención](/retencion)?

## Cohortes temporales

Las cohortes más comunes son las **temporales**: agrupás usuarios por cuándo hicieron algo (generalmente, cuándo se registraron). Esto te permite comparar "generaciones" de usuarios entre sí.

```
January Cohort:  100 users → Week 1: 60% active → Week 4: 25% active
February Cohort: 120 users → Week 1: 65% active → Week 4: 32% active
March Cohort:    150 users → Week 1: 70% active → Week 4: 38% active
```

En este ejemplo, cada cohorte retiene mejor que la anterior. Eso te dice que algo está mejorando, ya sea el producto, el onboarding o la calidad de los usuarios que estás adquiriendo.

## Cohortes de comportamiento

No todas las cohortes son temporales. También podés crear **cohortes de comportamiento**: agrupar usuarios por lo que hacen (o no hacen). Por ejemplo, "usuarios que completaron el tutorial" vs. "usuarios que lo saltearon". Si los que completaron el tutorial tienen mejor retención a 30 días, tenés un dato muy valioso para decidir cómo mejorar tu [funnel](/funnels) (embudo de conversión) de activación.

## Tablas de retención por cohorte

La herramienta más poderosa del análisis de cohortes es la **tabla de retención**. Es una matriz donde las filas son las cohortes (por semana o mes de registro) y las columnas son los períodos siguientes (semana 1, semana 2, etc.). Cada celda muestra el porcentaje de usuarios que seguían activos en ese período.

```
              Week 0    Week 1    Week 2    Week 3    Week 4
Jan 1-7       100%       45%       30%       22%       18%
Jan 8-14      100%       50%       35%       28%       23%
Jan 15-21     100%       55%       40%       33%       28%
Jan 22-28     100%       58%       43%       35%       --
```

Mirá cómo las cohortes más nuevas retienen mejor en cada columna. Eso confirma una tendencia positiva.

## ¿Por qué son útiles las cohortes?

Las cohortes te sacan de la trampa de los promedios. Si mirás solo [métricas](/metricas) globales, podés pensar que la retención general está estable cuando en realidad las cohortes nuevas retienen mucho mejor pero las viejas están cayendo (o al revés). Sin análisis de cohortes, estás volando a ciegas.

Pensá en las cohortes como un microscopio para tu producto: te dejan ver detalles que los números agregados esconden. Si estás tomando decisiones basadas en datos, las cohortes deberían ser una de tus herramientas principales junto con los [funnels](/funnels) y las métricas de retención.
