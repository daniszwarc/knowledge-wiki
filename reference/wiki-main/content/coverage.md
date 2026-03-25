---
title: "Coverage"
description: "Una métrica que indica qué porcentaje del código está cubierto por tests automatizados."
category: "Testing"
order: 8
question: "¿Cuánto código están cubriendo los tests?"
related: ["testing", "testing-automatizado", "ci-cd"]
---

## Qué es el code coverage

El code coverage (cobertura de código) es una métrica que te dice qué porcentaje de tu código fuente se ejecuta cuando corrés tus tests. Si tenés un archivo con 100 líneas y tus tests solo pasan por 70 de ellas, tu cobertura de líneas es del 70%. Es una herramienta útil para identificar qué partes de tu aplicación no están siendo testeadas.

## Tipos de coverage

No todo el coverage es igual. Existen distintos tipos que miden cosas diferentes:

- **Line coverage**: porcentaje de lineas de codigo ejecutadas.
- **Branch coverage**: porcentaje de ramas condicionales (if/else, switch, ternarios) que se recorrieron. Es el mas importante porque mide si probaste todos los caminos posibles.
- **Function coverage**: porcentaje de funciones que fueron llamadas al menos una vez.
- **Statement coverage**: porcentaje de sentencias (instrucciones individuales) ejecutadas.

Pensá en branch coverage como el más revelador: podés tener 100% de line coverage y aún así no estar testeando el caso donde un `if` va por el `else`.

## Cómo medir coverage con Jest

Si usás Jest para tu [testing](/testing), medir coverage es tan simple como agregar un flag:

```bash
# Run tests with coverage report
npx jest --coverage
```

Esto genera un reporte en la terminal y una carpeta `coverage/` con un reporte HTML detallado. Podés configurar opciones en tu `package.json` o `jest.config.js`:

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.test.{js,ts}',
    '!src/**/index.{js,ts}',
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

## Leer el reporte de coverage

Cuando corrés `jest --coverage`, vas a ver algo así en la terminal:

```
File           | % Stmts | % Branch | % Funcs | % Lines |
---------------|---------|----------|---------|---------|
users.js       |   95.23 |    87.50 |     100 |   94.73 |
payments.js    |   72.41 |    55.00 |   66.66 |   71.42 |
auth.js        |  100.00 |   100.00 |  100.00 |  100.00 |
```

Mirá las columnas de Branch: si ves un número bajo, significa que hay caminos lógicos en tu código que no estás testeando. Abrí el reporte HTML en `coverage/lcov-report/index.html` para ver exactamente qué líneas faltan.

## Qué porcentaje buscar

No existe un número mágico, pero hay criterios razonables:

- **80%** es un buen objetivo general para la mayoría de los proyectos.
- **90%+** para código crítico (pagos, autenticación, lógica de negocio).
- **100%** es posible pero no siempre práctico ni necesario.

## Coverage no es calidad

Ojo: tener alto coverage no significa que tus tests sean buenos. Podés tener 100% de coverage con tests que no verifican nada útil. El coverage te dice **qué código se ejecutó**, no **si se verificó correctamente**. Siempre priorizá escribir tests con assertions significativas dentro de un flujo sólido de [testing automatizado](/testing-automatizado).

## Integración con CI/CD

Una práctica muy común es integrar el chequeo de coverage en tu pipeline de [CI/CD](/ci-cd). Podés configurar que el build falle si el coverage baja de cierto umbral:

```yaml
# Example in GitHub Actions
- name: Run tests with coverage
  run: npx jest --coverage --ci
- name: Verify coverage threshold
  run: npx jest --coverage --coverageThreshold='{"global":{"branches":80}}'
```

Esto evita que se mergeen cambios que reduzcan la cobertura del proyecto, manteniendo la calidad a lo largo del tiempo.
