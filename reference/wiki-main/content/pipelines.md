---
title: "Pipelines"
description: "Un pipeline es una cadena de tareas que se ejecutan en secuencia, donde la salida de una etapa es la entrada de la siguiente."
category: "Automatización"
order: 2
question: "¿Cómo se encadenan tareas?"
related: ["workflows", "deploy", "colas-de-tareas"]
---

## ¿Qué es un pipeline?

Un pipeline es una secuencia de etapas donde los datos fluyen de una a otra. Cada etapa toma algo como entrada, lo transforma o procesa, y pasa el resultado a la siguiente. Pensalo como una línea de producción en una fábrica: cada estación hace su parte y le pasa el producto a la siguiente. Este concepto aparece en muchos contextos del desarrollo de software, desde el procesamiento de datos hasta la publicación de aplicaciones.

## Pipelines de datos (ETL)

Uno de los usos más comunes es el **ETL** (Extract, Transform, Load):

1. **Extract (Extraer):** Sacás datos de una fuente (API, base de datos, archivo CSV).
2. **Transform (Transformar):** Limpiás, filtrás y reformateás los datos.
3. **Load (Cargar):** Guardás los datos procesados en su destino final.

```
Sales database
        │
        ▼
   Extract monthly sales
        │
        ▼
   Calculate totals by region
        │
        ▼
   Generate report in the data warehouse
```

Herramientas como Apache Airflow, Dagster o dbt son populares para armar estos pipelines.

## Pipelines de CI/CD

En el mundo del [deploy](/deploy), los pipelines de **CI/CD** (Continuous Integration / Continuous Deployment) automatizan todo el proceso desde que hacés un cambio en el código hasta que llega a producción:

1. **Build:** Se compila o construye la aplicación.
2. **Test:** Se corren los tests automáticos.
3. **Deploy:** Si todo pasa, se publica en el servidor.

```yaml
# Example pipeline in GitHub Actions
name: CI/CD Pipeline
on: push
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm test
      - run: npm run build
      - run: ./deploy.sh
```

Si alguna etapa falla, el pipeline se detiene y te avisa. Así evitás que código roto llegue a producción.

## Etapas y dependencias

Lo clave de un pipeline es que las etapas son **secuenciales y dependientes**: si la etapa 2 falla, la etapa 3 no se ejecuta. Esto es diferente a un [workflow](/workflows), donde puede haber caminos alternativos y lógica condicional. Algunos pipelines permiten etapas en paralelo cuando no dependen entre sí, lo cual acelera el proceso total.

## ¿Cuándo usar un pipeline?

Usá pipelines cuando tengas un proceso que siempre sigue los mismos pasos en orden. Procesamiento de datos, compilación de código, generación de reportes, migración de bases de datos... cualquier tarea que puedas descomponer en "hacé A, después B, después C" es candidata a ser un pipeline. Si necesitás lógica condicional compleja, probablemente te convenga más un workflow.
