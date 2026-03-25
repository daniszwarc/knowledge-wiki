---
title: "Onboarding"
description: "El proceso de guiar a un usuario nuevo para que entienda y empiece a usar tu aplicación."
category: "Usuarios"
order: 7
question: "¿Cómo se guía a un usuario nuevo?"
related: ["ux", "feedback", "retencion"]
---

El **onboarding** es la primera experiencia que tiene un usuario con tu aplicación. Es el proceso de guiarlo desde que se registra hasta que entiende cómo usar el producto y obtiene valor de él. Si el onboarding es malo, el usuario se va y no vuelve.

## ¿Por qué importa tanto?

Los estudios muestran que la mayoría de los usuarios que abandonan una app lo hacen en los primeros días. Si no entienden rápido qué hace la app y cómo les sirve, la desinstalan o la olvidan. Un buen onboarding reduce esa pérdida y mejora la [retención](/retencion) a largo plazo.

## Tipos de onboarding

### Product tour

Un recorrido guiado que te muestra las funcionalidades principales paso a paso. Suele usar tooltips (globitos de ayuda que aparecen al lado de un elemento) o modales (ventanas emergentes) que señalan distintas partes de la interfaz:

```javascript
// components/OnboardingTour.jsx

import { useEffect } from 'react';
import Shepherd from 'shepherd.js';

export default function OnboardingTour() {
  useEffect(() => {
    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: 'shadow-md'
      }
    });

    tour.addStep({
      title: 'Your dashboard',
      text: 'Here you will see a summary of all your activity.',
      attachTo: { element: '#dashboard', on: 'bottom' },
      buttons: [{ text: 'Next', action: tour.next }]
    });

    tour.addStep({
      title: 'Create project',
      text: 'Click here to create your first project.',
      attachTo: { element: '#btn-new-project', on: 'bottom' },
      buttons: [{ text: 'Got it', action: tour.complete }]
    });

    tour.start();

    return () => tour.cancel();
  }, []);

  return null;
}
```

### Progressive disclosure

En vez de mostrar todo de una, vas revelando funcionalidades a medida que el usuario las necesita. Es menos abrumador y más natural. Por ejemplo, Slack no te muestra todas las configuraciones de canales hasta que creás tu primer canal.

### Empty states

Cuando un usuario nuevo entra y no tiene datos, en vez de mostrar una pantalla vacía, usás ese espacio para guiarlo. Un buen empty state dice qué hacer:

```
┌─────────────────────────────────┐
│                                 │
│   You don't have any projects   │
│            yet                  │
│   Create your first project     │
│   to start organizing           │
│   your work.                    │
│                                 │
│   [ + Create project ]          │
│                                 │
└─────────────────────────────────┘
```

## Patrones que funcionan

- **Checklist de progreso**: Mostrá una lista de pasos completados ("Completá tu perfil", "Invitá a tu equipo", "Creá tu primer proyecto"). La gente quiere completar listas.
- **Valor inmediato**: Que el usuario obtenga algo útil lo antes posible. No le pidas 10 datos antes de dejarlo usar la app.
- **Personalización temprana**: Preguntá al usuario qué necesita para adaptar la experiencia. "¿Para qué vas a usar la app?" permite mostrar lo relevante primero.

## Métricas para medir el onboarding

Para saber si tu onboarding funciona, medí estas cosas:

- **Tasa de activación**: porcentaje de usuarios que completan una acción clave (por ejemplo, crear su primer proyecto)
- **Time to value**: cuánto tiempo pasa hasta que el usuario obtiene valor real
- **Drop-off por paso**: en qué paso del onboarding se van los usuarios

Todo esto se conecta directamente con la experiencia de usuario ([UX](/ux)) y con cómo recibís [feedback](/feedback) para mejorar el proceso continuamente.
