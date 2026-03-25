---
title: "User stories"
description: "Descripciones cortas de funcionalidades escritas desde la perspectiva del usuario."
category: "Producto"
order: 8
question: "¿Cómo se definen las funcionalidades desde el usuario?"
related: ["mvp", "iteracion", "validacion"]
---

## Qué son las user stories

Las **user stories** (historias de usuario) son descripciones cortas y simples de una funcionalidad, escritas desde la perspectiva de la persona que la va a usar. En vez de escribir especificaciones técnicas largas que nadie lee, las user stories se enfocan en el **valor** que la funcionalidad le da al usuario. Son la unidad básica de trabajo en metodologías ágiles y una herramienta clave para definir tu [MVP](/mvp).

## El formato

La estructura clásica de una user story es:

```
As a [user role],
I want [action],
so that [benefit].
```

Veamos ejemplos concretos:

```
✅ Good:
As a buyer, I want to filter products by price,
so that I can find options within my budget.

✅ Good:
As an admin, I want to export reports to CSV,
so that I can analyze them in a spreadsheet.

❌ Bad:
As a user, I want a blue button in the upper right corner.
(Does not state the why or the value it delivers)

❌ Bad:
Implement endpoint POST /api/reports with pagination.
(This is a technical task, not a user story)
```

Fijate que las buenas historias hablan del **problema del usuario**, no de la implementación técnica. El "cómo" se define después, cuando el equipo de desarrollo las toma.

## Criterios de aceptación

Cada user story necesita **criterios de aceptación**: condiciones concretas que definen cuándo la historia está "terminada". Son el acuerdo entre producto y desarrollo sobre qué significa que la funcionalidad funciona.

```
Story: As a buyer, I want to filter products by price.

Acceptance criteria:
- I can select a minimum and maximum price range
- Results update without reloading the page
- If there are no products in the range, a message is shown
- Filters persist when navigating between pages
```

Los criterios de aceptación eliminan ambigüedades. Sin ellos, cada persona interpreta la historia diferente y terminás con algo que nadie pidió.

## Story points

Los equipos ágiles estiman el esfuerzo de cada historia usando **story points**: una medida relativa de complejidad, no de tiempo. En vez de decir "esto lleva 3 días", decís "esto es un 5" (comparado con otras historias que ya hiciste).

La escala más común usa la secuencia de Fibonacci: 1, 2, 3, 5, 8, 13, 21. Si una historia es un 13 o más, probablemente es demasiado grande y deberías dividirla.

## Épicas, stories y tareas

Las user stories viven dentro de una jerarquía:

- **Épica**: Un objetivo grande que agrupa varias historias. Ejemplo: "Sistema de pagos".
- **Story**: Una funcionalidad específica dentro de la épica. Ejemplo: "Como comprador, quiero pagar con tarjeta de crédito".
- **Tarea**: Un paso técnico concreto para implementar la story. Ejemplo: "Integrar SDK de Stripe" o "Crear formulario de tarjeta".

Las épicas se completan a lo largo de varias [iteraciones](/iteracion). Las stories deberían completarse dentro de una iteración. Las tareas se completan en horas o días.

## Consejos para escribir buenas stories

- Escribí desde la perspectiva del usuario, no del desarrollador.
- Que sean independientes: una historia no debería depender de que otra se complete primero.
- Que sean negociables: los detalles se definen en conversación con el equipo.
- Que sean pequeñas: si no entra en un sprint, dividila.
- Validá tus stories con usuarios reales. Las mejores historias nacen del proceso de [validación](/validacion).
