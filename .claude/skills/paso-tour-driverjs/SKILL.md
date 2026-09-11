---
name: paso-tour-driverjs
description: Agrega o modifica un paso de la guía interactiva (driver.js) del panel web de habitos-tracker sin tocar el motor de la guía. Úsala cuando un módulo nuevo tenga UI que explicar o pidan "agregar un paso al tour", "guía interactiva" o "driver.js".
---

# Agregar un paso a la guía

La guía está definida por la spec `specs/002-tour-guiado-driverjs/`. El motor (`web/src/tour/tour.js`) **no se modifica** para agregar pasos.

## 1. Ancla en la UI

Agrega `data-tour="<id>"` al elemento que se va a resaltar (en `web/index.html` o en el renderizado de `web/src/app.js`). Si el elemento se repite (por ejemplo, en cada hábito), ponlo solo en el primero.

## 2. Registrar el paso

En `web/src/tour/pasos.js`:

```js
agregarPaso({
  id: '<id>',
  elemento: '[data-tour="<id>"]',
  titulo: 'Título de 2 a 4 palabras',
  descripcion: 'Una o dos oraciones en español, en segunda persona.',
  alternativa: {                       // opcional: si el elemento puede no existir
    elemento: '[data-tour="lista"]',
    descripcion: 'Qué verá el usuario cuando exista el elemento.',
  },
}, { antesDe: 'ver-guia' });           // el paso "¿Necesitas ayuda?" siempre es el último
```

## 3. Reglas de redacción

- Título corto, sin punto final; descripción de máximo dos oraciones.
- Nombra los botones entre comillas latinas: «Marcar hoy».
- Nada de jerga técnica.

## 4. Actualizar contrato y pruebas

1. Agrega la fila del paso en `specs/002-tour-guiado-driverjs/contracts/tour-contract.md`.
2. En `tests/e2e/tour.spec.js`, verifica el título del paso nuevo en su posición. **No** fijes el total de pasos (usa `/^1 de \d+$/`).
3. Ejecuta:

```bash
npm run test:unit
npx playwright test tests/e2e/tour.spec.js
```

## Hecho cuando

- [ ] Ancla `data-tour` presente
- [ ] Paso registrado con `agregarPaso` (sin cambios en `tour.js`)
- [ ] Contrato y prueba actualizados, en verde en escritorio y móvil
