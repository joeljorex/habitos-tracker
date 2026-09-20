---

description: "Task list for feature implementation"
---

# Tasks: Guía interactiva del panel web

**Input**: Design documents from `/specs/002-tour-guiado-driverjs/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/tour-contract.md; panel de la spec 001

**Tests**: SOLICITADAS (FR-010, constitución principio II).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Agregar `driver.js@1.8.0` como devDependency y el script `vendor:driver` (copia `node_modules/driver.js/dist/driver.js.iife.js`, `driver.css` y `LICENSE` a `web/vendor/driver.js/`) en `package.json`
- [x] T002 Ejecutar `npm run vendor:driver` y versionar `web/vendor/driver.js/`
- [x] T003 Enlazar `vendor/driver.js/driver.css` y `vendor/driver.js/driver.js.iife.js` (antes de `src/app.js`) en `web/index.html`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T004 Agregar las anclas `data-tour` (`nuevo-habito`, `lista`, `marcar` en el botón del primer hábito, `ver-guia`) y el botón `Ver guía` (`data-testid="ver-guia"`) en `web/index.html` y en el renderizado de `web/src/app.js`
- [x] T005 Crear `web/src/tour/pasos.js` con el registro `PASOS` (textos exactos del contrato) y `agregarPaso(paso, { antesDe })`

---

## Phase 3: User Story 1 - Guía en la primera visita (Priority: P1) 🎯 MVP

**Goal**: la guía arranca sola y se recorre completa.

**Independent Test**: CP-11.

### Tests for User Story 1

- [x] T006 [P] [US1] Pruebas unitarias de `resolverPasos` (elemento presente, ausente sin alternativa → se omite, ausente con alternativa → usa alternativa) en `tests/unit/tour.test.mjs`
- [x] T007 [P] [US1] Pruebas e2e `CP-11 El tour se muestra en la primera visita y se recorre completo` (con y sin hábitos) en `tests/e2e/tour.spec.js`

### Implementation for User Story 1

- [x] T008 [US1] Implementar `resolverPasos` e `iniciarTour` con la configuración del contrato (progreso `{{current}} de {{total}}`, botones `Siguiente` / `Anterior` / `Listo`) en `web/src/tour/tour.js`
- [x] T009 [US1] Iniciar la guía tras iniciar sesión (o al cargar con sesión activa) si no se ha visto, en `web/src/app.js`

**Checkpoint**: CP-11 en verde.

---

## Phase 4: User Story 2 - No repetir y poder relanzar (Priority: P1)

**Goal**: recordar la guía como vista y relanzarla con el botón.

**Independent Test**: CP-12.

- [x] T010 [P] [US2] Prueba e2e `CP-12 El tour no reaparece y se relanza con Ver guía` (completar, cerrar con X, cerrar con Esc, relanzar) en `tests/e2e/tour.spec.js`
- [x] T011 [US2] Implementar `tourVisto` y `marcarVisto` (clave `habitos.v1.tourVisto`, tolerante a errores de almacenamiento) y llamar `marcarVisto` en `onDestroyed`, en `web/src/tour/tour.js`
- [x] T012 [US2] Conectar el botón `ver-guia` con `iniciarTour({ forzar: true })` evitando guías superpuestas, y cerrar la guía al cerrar sesión, en `web/src/app.js`

---

## Phase 5: User Story 3 - Guía extensible por módulo (Priority: P2)

**Goal**: agregar pasos sin tocar el motor.

**Independent Test**: prueba unitaria de `agregarPaso` + integración de la spec 004.

- [x] T013 [P] [US3] Prueba unitaria de `agregarPaso` (inserta antes del id indicado; al final si no existe) en `tests/unit/tour.test.mjs`
- [x] T014 [US3] Confirmar que `tests/e2e/tour.spec.js` no fija el total de pasos (usa `1 de N` y el título del último paso)

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T015 [P] Verificar navegación con flechas y Esc en escritorio y que el globo sea visible en el proyecto `movil`
- [x] T016 [P] Documentar la guía en `docs/plan-de-pruebas.md` y `docs/casos-de-prueba.md` (CP-11, CP-12)
- [x] T017 Ejecutar la validación de `quickstart.md`

---

## Dependencies & Execution Order

- Requiere la spec 001 (panel) implementada.
- Setup → Foundational → US1 → US2 → US3 → Polish.

### Parallel Opportunities

- T006 y T007; T010 junto con T011; T013 en cualquier momento después de T005.

## Implementation Strategy

MVP = US1 (la guía aparece y se recorre). Después US2 (recordar/relanzar) y US3 (extensible),
que se valida de verdad cuando la spec 004 agrega el paso de rachas.

## Notes

- Commit sugerido: `feat(web): guía interactiva con driver.js (spec 002)`.

## Notas de implementación

- **T001**: el paquete publica la licencia como `license` (minúsculas); `scripts/vendor-driver.mjs` la busca sin distinguir mayúsculas y la copia como `LICENSE`.
- **T003**: global verificado en el dist: `window.driver.js.driver`.
- **T008**: opciones de presentación adicionales: `popoverClass`, `animate` (se desactiva con `prefers-reduced-motion`), `disableActiveInteraction` y etiqueta accesible en español para el botón de cierre.
- **T011 (hallazgo)**: driver.js 1.8.0 solo invoca `onDestroyed` si ya terminó la animación del paso; quien cerraba rápido (Listo, X o Esc) no quedaba registrado y la guía reaparecía. CP-11 y CP-12 lo detectaron en rojo. Se agregó `onDestroyStarted`, que marca la guía como vista en todo cierre iniciado por el usuario.
- **T012**: al cerrar sesión, `cerrarTour()` cierra la guía y la deja como vista.
- **T015**: la navegación con flechas se prueba con `page.clock`, porque driver.js ignora las teclas mientras anima.
- **T016**: la documentación se actualizó en este mismo PR.
- **Contrato**: `.driver-popover-next-btn` y `.driver-popover-prev-btn` no tienen reglas propias en `driver.css`, pero driver.js las asigna a los botones y las pruebas las usan.
