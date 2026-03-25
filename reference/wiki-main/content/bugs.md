---
title: "Bugs"
description: "Un bug es un error en el software que hace que se comporte de forma inesperada o incorrecta."
category: "Testing"
order: 3
question: "¿Qué es un bug?"
related: ["testing", "logs", "monitoreo"]
---

## ¿Qué es un bug?

Un **bug** es un error en el código que hace que tu app se comporte de una forma que no esperabas. El nombre viene de los primeros tiempos de la computación, cuando literalmente un bicho (bug en inglés) se metió en una computadora y causó una falla. Hoy el término se usa para cualquier problema en el software: desde un botón que no funciona hasta un cálculo que da mal.

## Tipos de bugs

No todos los bugs son iguales. Algunos son obvios y otros son sutiles y difíciles de encontrar:

- **Bugs de lógica**: el código corre sin errores, pero el resultado está mal. Por ejemplo, una función que calcula un descuento del 20% pero en realidad aplica el 2%.
- **Bugs de UI**: algo se ve mal en la interfaz. Un texto cortado, un botón que se superpone con otro, colores incorrectos.
- **Bugs de performance**: la app funciona, pero es lenta. Una página que tarda 10 segundos en cargar o una lista que se traba al hacer scroll.
- **Bugs de seguridad**: vulnerabilidades que permiten accesos no autorizados o exponen datos sensibles.

```javascript
// Example of a logic bug
function calculateDiscount(price, percentage) {
  // Bug: missing multiplication by price
  return percentage / 100; // Returns 0.2 instead of 20
}

// Fixed version
function calculateDiscount(price, percentage) {
  return price * (percentage / 100); // Returns 20 for price=100, percentage=20
}
```

## Debugging: encontrar y corregir bugs

**Debugging** es el proceso de encontrar la causa de un bug y arreglarlo. Es como ser detective: tenés un síntoma ("el botón no funciona") y tenés que investigar hasta encontrar la causa real. Las herramientas más comunes son:

- **Console.log / print**: la forma más básica. Imprimís valores en distintos puntos del código para ver dónde las cosas dejan de funcionar como esperabas.
- **Debugger**: una herramienta que te permite pausar la ejecución del código y explorar el estado paso a paso.
- **[Logs](/logs)**: registros que tu app genera mientras corre, útiles para entender qué pasó cuando un usuario reporta un problema.

## Bug reports: reportar bien un bug

Cuando encontrás un bug, es importante reportarlo bien para que alguien pueda arreglarlo. Un buen reporte de bug incluye:

1. **Descripción clara**: qué esperabas que pasara y qué pasó en realidad.
2. **Pasos para reproducir**: cómo llegaste a ese error, paso a paso.
3. **Contexto**: navegador, dispositivo, sistema operativo, usuario de prueba.
4. **Evidencia**: capturas de pantalla, videos, mensajes de error.

La **reproducibilidad** es clave. Si no podés reproducir un bug de forma consistente, es mucho más difícil de arreglar. Los bugs que solo pasan "a veces" son los más complicados.

## Convivir con los bugs

Acá va una verdad incómoda: todo software tiene bugs. La idea no es tener cero bugs (es prácticamente imposible), sino tener procesos para detectarlos rápido y corregirlos antes de que afecten a muchos usuarios. Para eso existen el [testing](/testing), el [monitoreo](/monitoreo) y los equipos de [QA](/qa). Cuanto más temprano encontrés un bug, más barato y fácil es arreglarlo.
