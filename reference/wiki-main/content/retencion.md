---
title: "Retención"
description: "La retención mide si los usuarios vuelven a usar tu producto después de su primera visita."
category: "Analytics"
order: 4
question: "¿Cómo se mide si los usuarios vuelven?"
related: ["metricas", "funnels", "producto"]
---

## ¿Qué es la retención?

La **retención** mide cuántos usuarios siguen usando tu producto a lo largo del tiempo. Podés atraer miles de usuarios nuevos, pero si la mayoría no vuelve después del primer día, tenés un problema serio. La retención es una de las [métricas](/metricas) más importantes porque refleja si tu producto realmente le aporta valor a la gente. Un producto con buena retención crece de forma sustentable; uno con mala retención es como un balde con agujeros.

## Análisis de cohortes

La forma más común de medir retención es con un **análisis de cohortes**. Un cohorte es un grupo de usuarios que comparten algo en común, generalmente la fecha en que empezaron a usar el producto. Por ejemplo, "los usuarios que se registraron en la semana del 10 de marzo".

```
Example retention table by cohort:

Cohort           Week 0     Week 1     Week 2     Week 3     Week 4
Mar 3 - Mar 9     1,000       420        310        280        260
Mar 10 - Mar 16   1,200       500        380        340          -
Mar 17 - Mar 23   1,100       480        350          -          -

Read as: of the 1,000 users who signed up the first week,
420 returned the following week (42% retention at week 1).
```

Este análisis te permite comparar cohortes entre sí: ¿la retención mejora con el tiempo? ¿un cambio en el producto tuvo impacto? ¿los usuarios que vienen de una campaña específica retienen mejor?

## Curvas de retención

Si graficás la retención en el tiempo, obtenés una **curva de retención**. La forma ideal es que la curva se "aplane" en algún momento, lo que significa que hay un grupo de usuarios que se queda de forma estable. Si la curva sigue bajando sin aplanarse, significa que eventualmente vas a perder a todos tus usuarios. La meta es encontrar ese punto de estabilización y trabajar para que sea lo más alto posible.

## Churn: la otra cara de la retención

El **churn** (abandono) es el opuesto de la retención: el porcentaje de usuarios que dejan de usar tu producto en un período dado. Si tu retención mensual es del 85%, tu churn es del 15%.

Parece poco, pero compuesto a lo largo de varios meses es devastador. Un 15% de churn mensual significa que en un año perdés más del 80% de tus usuarios si no los reponés. Reducir el churn aunque sea un poco tiene un impacto enorme a largo plazo.

## Estrategias para mejorar la retención

No hay una fórmula mágica, pero hay estrategias probadas:

- **Mejorar el onboarding**: asegurate de que los usuarios nuevos entiendan rápidamente el valor de tu producto. Si no lo "entienden" en las primeras sesiones, es probable que no vuelvan.
- **Notificaciones y recordatorios**: emails, push notifications o mensajes in-app que traigan al usuario de vuelta (sin ser invasivos).
- **Analizar los [funnels](/funnels) de activación**: ¿qué acciones hacen los usuarios que se quedan y que no hacen los que se van? Encontrar ese "momento aha" es clave.
- **Escuchar a los usuarios**: los [eventos de analytics](/eventos-analytics) te dicen qué hacen, pero a veces necesitás hablar con ellos para entender por qué se van.
