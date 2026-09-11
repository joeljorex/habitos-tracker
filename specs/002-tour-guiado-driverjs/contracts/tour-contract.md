# Contrato: Guía interactiva

## 1. Pasos (orden y textos exactos)

| # | id | Ancla | Título | Descripción |
|---|---|---|---|---|
| 1 | `nuevo-habito` | `[data-tour="nuevo-habito"]` (formulario) | `Crea un hábito` | `Escribe algo que quieras hacer a diario, por ejemplo «Tomar agua», y pulsa Agregar.` |
| 2 | `lista` | `[data-tour="lista"]` (contenedor de la lista) | `Tus hábitos` | `Aquí aparecen tus hábitos con los días que llevas cumplidos.` |
| 3 | `marcar` | `[data-tour="marcar"]` (botón del primer hábito) | `Marca tu avance` | `Pulsa «Marcar hoy» cuando completes el hábito. Solo cuenta una vez por día.` |
| — | `racha` | agregado por la spec 004 antes de `ver-guia` | — | — |
| 4 | `ver-guia` | `[data-tour="ver-guia"]` (botón) | `¿Necesitas ayuda?` | `Puedes repetir esta guía cuando quieras desde aquí.` |

**Alternativa del paso 3** (sin hábitos): ancla `[data-tour="lista"]`, descripción
`Cuando tengas hábitos, cada uno tendrá un botón «Marcar hoy» para registrar tu avance.`

## 2. Configuración de driver.js

| Opción | Valor |
|---|---|
| `showProgress` | `true` |
| `progressText` | `{{current}} de {{total}}` |
| `nextBtnText` / `prevBtnText` / `doneBtnText` | `Siguiente` / `Anterior` / `Listo` |
| `allowClose` | `true` (X y Esc) |
| `allowKeyboardControl` | `true` |
| `onDestroyed` | `marcarVisto()` |

## 3. API de los módulos

```text
// web/src/tour/pasos.js
PASOS: Paso[]                                   // registro en orden
agregarPaso(paso: Paso, { antesDe?: string })   // inserta antes del id indicado (o al final)

// web/src/tour/tour.js
resolverPasos(pasos: Paso[], existe: (selector) => boolean) -> PasoResuelto[]   // pura
tourVisto() -> boolean
marcarVisto() -> void
iniciarTour({ forzar = false } = {}) -> boolean  // false si ya estaba abierta o (sin forzar) ya vista
```

## 4. Contrato con las pruebas

- Selectores del globo: `.driver-popover`, `.driver-popover-title`, `.driver-popover-description`,
  `.driver-popover-progress-text`, `.driver-popover-next-btn`, `.driver-popover-prev-btn`,
  `.driver-popover-close-btn` (verificar contra `driver.css` de la versión 1.8.0).
- Las pruebas **no** fijan el número total de pasos: verifican `1 de N` con una expresión regular,
  el título del primer paso y el del último (`¿Necesitas ayuda?`), para que la spec 004 pueda
  agregar su paso sin reescribirlas.
- Para las pruebas que no son de la guía, `sembrar(page, { tourVisto: true })` evita que la guía
  tape el panel.
