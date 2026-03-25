---
title: "Design patterns"
description: "Soluciones probadas a problemas comunes de diseño de software."
category: "Arquitectura"
order: 8
question: "¿Existen recetas para problemas comunes de código?"
related: ["modularidad", "servicios", "dependencias"]
---

## ¿Qué son los design patterns?

Los **design patterns** (patrones de diseño) son soluciones probadas y reutilizables a problemas que aparecen una y otra vez en el desarrollo de software. No son código que copiás y pegás: son más bien recetas o esquemas que te dicen cómo estructurar tu código para resolver un problema específico de forma limpia. Conocerlos te da un vocabulario compartido con otros desarrolladores y te ahorra reinventar la rueda.

## Singleton: una sola instancia

El **Singleton** garantiza que una clase tenga una única instancia en toda la aplicación. Es útil para cosas como conexiones a bases de datos o configuraciones globales.

```javascript
class Database {
  static instance = null;

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
      Database.instance.connection = createConnection();
    }
    return Database.instance;
  }
}

// Always returns the same instance
const db1 = Database.getInstance();
const db2 = Database.getInstance();
console.log(db1 === db2); // true
```

Usalo con cuidado: el Singleton puede dificultar el testing y esconder [dependencias](/dependencias). Muchas veces es mejor inyectar la dependencia explícitamente.

## Observer: reaccionar a cambios

El **Observer** define una relación de uno a muchos: cuando un objeto cambia de estado, todos los que están "suscritos" se enteran automáticamente. Es la base de los sistemas de [eventos](/eventos).

```javascript
class EventEmitter {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    (this.listeners[event] || []).forEach(cb => cb(data));
  }
}

const emitter = new EventEmitter();
emitter.on('userRegistered', (user) => sendWelcomeEmail(user));
emitter.on('userRegistered', (user) => trackAnalytics(user));
emitter.emit('userRegistered', { name: 'Ana', email: 'ana@mail.com' });
```

## Factory: crear objetos sin exponer la lógica

El **Factory** encapsula la creación de objetos. En vez de usar `new` directamente, llamás a una función que decide qué tipo de objeto crear.

```javascript
function createNotification(type, message) {
  switch (type) {
    case 'email':
      return new EmailNotification(message);
    case 'push':
      return new PushNotification(message);
    case 'sms':
      return new SMSNotification(message);
    default:
      throw new Error(`Unknown type: ${type}`);
  }
}

const notif = createNotification('email', 'Welcome!');
```

## Strategy: intercambiar algoritmos

El **Strategy** te permite cambiar el comportamiento de un objeto en runtime (mientras el programa está corriendo) encapsulando algoritmos en objetos intercambiables. Es ideal cuando tenés varias formas de hacer lo mismo.

```javascript
const strategies = {
  credit: (amount) => chargeCard(amount),
  debit: (amount) => debitAccount(amount),
  crypto: (amount) => sendCrypto(amount),
};

function processPayment(method, amount) {
  const strategy = strategies[method];
  if (!strategy) throw new Error(`Unsupported method: ${method}`);
  return strategy(amount);
}
```

## Cuándo usar (y cuándo no)

Los patrones son herramientas, no reglas. No fuerces un patrón donde no hace falta: si una función simple resuelve el problema, no necesitás una clase con un patrón rebuscado. El código más legible es el que usa la solución más simple posible. Pero cuando el problema crece en complejidad, conocer los patrones te da opciones claras y probadas.

También existen los **anti-patterns**: soluciones que parecen buenas pero generan problemas. El "God Object" (una clase que hace todo) o el "Spaghetti Code" (sin estructura ni [modularidad](/modularidad)) son ejemplos clásicos. Conocer los patrones te ayuda a evitar estas trampas y a mantener tu código organizado a medida que el [servicio](/servicios) crece.
