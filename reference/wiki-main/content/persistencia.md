---
title: "Persistencia"
description: "La capacidad de almacenar datos de forma duradera para que sobrevivan al cierre de la aplicación o del servidor."
category: "Datos"
order: 2
question: "¿Cómo se asegura que los datos no se pierdan?"
related: ["base-de-datos", "estado", "almacenamiento-de-archivos"]
---

## ¿Qué es la persistencia de datos?

Cuando cerrás una app o se reinicia un servidor, ¿qué pasa con la información? Si los datos estaban solo en la memoria RAM, se pierden. La **persistencia** es lo que garantiza que los datos sobrevivan a esos eventos. Cada vez que un usuario crea una cuenta, sube una foto o escribe un mensaje, esos datos necesitan guardarse en algún lugar permanente, generalmente una [base de datos](/base-de-datos) o un sistema de archivos.

## Tipos de almacenamiento

No todos los datos se persisten de la misma forma. Dependiendo de qué tan duradero y accesible necesitás que sea, hay diferentes opciones:

| Tipo | Duración | Ejemplo | Uso típico |
|------|----------|---------|------------|
| **Memoria (RAM)** | Mientras corre el proceso | Variables en tu código | Datos temporales, cálculos |
| **Base de datos** | Permanente | PostgreSQL, MongoDB | Datos del negocio |
| **Sistema de archivos** | Permanente | Disco del servidor, S3 | Imágenes, PDFs, videos |
| **LocalStorage** | Permanente (en el navegador) | `localStorage.setItem()` | Preferencias del usuario |
| **SessionStorage** | Mientras dure la pestaña | `sessionStorage.setItem()` | Datos de la sesión actual |

```javascript
// Data in memory: lost on restart
let counter = 0;

// Data persisted in database: survives
await db.query(
  'INSERT INTO visits (page, date) VALUES ($1, $2)',
  ['/home', new Date()]
);

// Data in localStorage: persists in the browser
localStorage.setItem('theme', 'dark');
```

## Transacciones: todo o nada

Cuando una operación involucra guardar varios datos relacionados, necesitás **transacciones**. Una transacción agrupa varias operaciones y garantiza que se ejecuten todas o ninguna. Pensá en una transferencia bancaria: tenés que restar plata de una cuenta y sumar en otra. Si falla a la mitad, no querés que se reste pero no se sume.

```javascript
const trx = await db.transaction();

try {
  await trx.query(
    'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
    [1000, originAccount]
  );
  await trx.query(
    'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
    [1000, destinationAccount]
  );
  await trx.commit(); // Everything went well, changes are saved
} catch (error) {
  await trx.rollback(); // Something failed, undo everything
}
```

Las bases de datos relacionales como PostgreSQL garantizan propiedades **ACID** (Atomicidad, Consistencia, Aislamiento, Durabilidad). En criollo: que las operaciones se hagan completas o no se hagan (atomicidad), que los datos queden en un estado válido (consistencia), que dos operaciones al mismo tiempo no se pisen (aislamiento), y que una vez guardado, el dato no se pierda (durabilidad).

## Backups: el plan B

La persistencia no es solo guardar datos, sino también protegerlos. Los **backups** (copias de seguridad) son esenciales. Las estrategias más comunes son:

- **Backup completo**: Copia de toda la base de datos. Simple pero puede ser lento si es grande.
- **Backup incremental**: Solo copia lo que cambió desde el último backup. Más rápido y eficiente.
- **Replicación**: Mantener una copia sincronizada en otro servidor en tiempo real.

La regla de oro es la **regla 3-2-1**: tener 3 copias de tus datos, en 2 tipos de almacenamiento diferentes, con 1 copia fuera del sitio (por ejemplo, en otra región de la nube).

## Cuándo y dónde persistir

No todo necesita persistirse, y elegir dónde hacerlo importa. Los datos críticos del negocio van a una [base de datos](/base-de-datos) robusta. Archivos grandes como imágenes o videos van a un servicio de almacenamiento como S3. Datos temporales que necesitás que sean rápidos pueden ir a un [cache](/cache) como Redis. Y las preferencias del usuario en el frontend pueden ir tranquilamente en `localStorage`. La clave es entender la naturaleza de cada dato y elegir el tipo de almacenamiento que mejor se ajuste.
