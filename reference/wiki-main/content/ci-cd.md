---
title: "CI/CD"
description: "Prácticas de integración continua y deploy continuo que automatizan el camino del código a producción."
category: "Automatización"
icon: "bot"
order: 4
question: "¿Cómo se automatiza el proceso de publicar código?"
related: ["pipelines", "deploy", "testing-automatizado", "repositorio"]
---

## ¿Qué es CI/CD?

Imaginate que cada vez que hacés un cambio en el código, alguien tiene que manualmente correr los tests, verificar que todo funcione, empaquetar la aplicación y subirla al servidor. Con un equipo chico capaz zafa, pero cuando tenés decenas de desarrolladores haciendo cambios todo el día, ese proceso manual se vuelve un cuello de botella enorme.

**CI/CD** automatiza todo ese camino para que el código llegue a producción de forma segura y rápida.

**CI (Continuous Integration)** significa que cada vez que alguien sube código al [repositorio](/repositorio), automáticamente se ejecutan los tests y verificaciones. Si algo se rompe, te enterás en minutos, no en días.

**CD (Continuous Delivery/Deployment)** va un paso más allá: si todos los tests pasan, el código se [despliega](/deploy) automáticamente a producción (o queda listo para hacerlo con un solo clic).

## Las etapas de un pipeline CI/CD

Un [pipeline](/pipelines) típico tiene varias etapas que se ejecutan en orden:

1. **Build**: se compila el código y se instalan las dependencias
2. **Test**: se corren los tests unitarios, de integración y cualquier otro [testing automatizado](/testing-automatizado)
3. **Análisis**: se revisa la calidad del código (linting, seguridad, cobertura)
4. **Deploy**: si todo pasó, se despliega al ambiente correspondiente

## Ejemplo con GitHub Actions

GitHub Actions es una de las herramientas más populares para CI/CD. Definís tu pipeline en un archivo YAML dentro del repositorio:

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm install

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

  deploy:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: npm run deploy
```

Cada vez que alguien hace push a `main` o abre un pull request, este pipeline se ejecuta automáticamente. El job `deploy` solo corre si `build-and-test` pasó exitosamente y estás en la rama `main`.

## ¿Por qué usar CI/CD?

- **Menos errores humanos**: no dependés de que alguien se acuerde de correr los tests antes de deployar
- **Releases más rápidos**: podés publicar cambios varias veces al día con confianza
- **Feedback inmediato**: si rompiste algo, te enterás en minutos
- **Consistencia**: el proceso es siempre el mismo, sin importar quién haga el cambio

## Herramientas populares

- **GitHub Actions**: integrado directamente en GitHub, ideal si ya usás esa plataforma
- **GitLab CI/CD**: viene incluido en GitLab, muy potente y bien documentado
- **CircleCI**: rápido y flexible, con buen soporte para Docker
- **Jenkins**: el veterano del CI/CD, open source y extremadamente configurable

Pensá en CI/CD como una red de seguridad automática. Cada cambio pasa por las mismas verificaciones, siempre. Si querés profundizar en cómo se estructuran estas etapas, mirá [pipelines](/pipelines). Y si querés entender mejor el proceso de poner código en producción, revisá [deploy](/deploy).
