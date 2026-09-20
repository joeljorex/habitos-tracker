---

description: "Task list for feature implementation"
---

# Tasks: Módulo de rachas de hábitos

**Input**: Design documents from `/specs/004-logica-rachas/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rachas-contract.md; specs 001 y 002 implementadas

**Tests**: SOLICITADAS (FR-011, constitución principio II). Primero las pruebas, que deben fallar.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Agregar el script `test:cobertura` (`node --test --experimental-test-coverage` limitado a `web/src/dominio/`) en `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T002 Crear `web/src/dominio/rachas.js` exportando `calcularRachas` (sin implementar) para que las pruebas fallen por el motivo correcto

---

## Phase 3: User Story 1 - Reglas de racha correctas (Priority: P1) 🎯 MVP

**Goal**: el cálculo cumple FR-001 a FR-008.

**Independent Test**: los 13 casos del contrato.

### Tests for User Story 1

- [x] T003 [US1] Pruebas unitarias con los casos V01–V13 del contrato (una prueba por caso, nombrada con su ID) en `tests/unit/rachas.test.mjs`

### Implementation for User Story 1

- [x] T004 [US1] Implementar `calcularRachas(fechas, hoy)` en `web/src/dominio/rachas.js`: fechas únicas, ignorar "fecha posterior a hoy", conversión con `Date.UTC`, racha actual que termina hoy o ayer, mejor racha ≥ actual
- [x] T005 [US1] Ejecutar `npm run test:cobertura` y confirmar ≥ 90 % de líneas en `rachas.js`

**Checkpoint**: dominio correcto y probado.

---

## Phase 4: User Story 2 - Ver la racha en el panel (Priority: P1)

**Goal**: "Racha" y "Mejor" visibles y actualizados al marcar.

**Independent Test**: CP-04 y CP-13.

### Tests for User Story 2

- [x] T006 [P] [US2] Pruebas e2e `CP-04 Cálculo de racha tras un día saltado` y `CP-13 La racha sigue viva si el último día cumplido fue ayer y se rompe si fue antes` con `page.clock.setFixedTime()` y datos sembrados, en `tests/e2e/rachas.spec.js`

### Implementation for User Story 2

- [x] T007 [US2] Mostrar `habit-streak-current` y `habit-streak-max` (textos del contrato, singular/plural) en cada hábito y recalcular al pulsar "Marcar hoy", en `web/src/app.js`
- [x] T008 [P] [US2] Estilos de las insignias de racha en `web/css/estilos.css`

---

## Phase 5: User Story 3 - Explicación y contrato compartido (Priority: P2)

**Goal**: la guía explica la racha; el contrato queda listo para Kotlin y PHP.

- [x] T009 [US3] Registrar el paso `racha` con `agregarPaso(..., { antesDe: 'ver-guia' })` y agregar `data-tour="racha"` a la racha del primer hábito, en `web/src/tour/pasos.js` y `web/src/app.js`
- [x] T010 [US3] Extender `tests/e2e/tour.spec.js` para comprobar que el paso "Tu racha" aparece justo antes de "¿Necesitas ayuda?"
- [x] T011 [P] [US3] Documentar en `docs/casos-de-prueba.md` los casos V01–V13 como referencia para JUnit (app) y PHPUnit (API)

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T012 [P] Actualizar `docs/plan-de-pruebas.md` (cobertura de rachas) y la trazabilidad
- [x] T013 Ejecutar la validación de `quickstart.md` y la suite completa `npm test`

---

## Dependencies & Execution Order

- Requiere las specs 001 (panel) y 002 (guía) integradas.
- US1 → US2 (la UI usa el cálculo) → US3 (la guía apunta a la insignia de racha).

### Parallel Opportunities

- T006 junto con T004 (archivos distintos); T008 y T011 en cualquier momento.

## Implementation Strategy

MVP = US1 (dominio con 13 casos en verde). Después US2 (UI) y US3 (guía + documentación).

## Notes

- Commit sugerido: `feat(web): módulo de rachas con casos de referencia (spec 004)`.

## Notas de implementación

- **T001**: `test:cobertura` = `node --test --experimental-test-coverage "--test-coverage-include=web/src/dominio/**" --test-coverage-lines=90 "tests/unit/*.test.mjs"`. El umbral del 90 % hace fallar el script si la cobertura baja; se mide sobre todo `web/src/dominio/` (95,97 %).
- **T003**: además de V01–V13 hay 4 casos adicionales: pureza, cambio de horario de verano, fechas con formato inválido y "hoy" inválido.
- **T005**: `rachas.js` tiene 100 % de líneas, ramas y funciones.
- **T009**: el paso «Tu racha» ocupa 9 líneas nuevas en `pasos.js` y no toca el motor, con lo que cumple el SC-004 de la spec 002 (menos de 10).
- **T011 / T012**: la documentación se actualizó en este mismo PR (`docs/casos-de-prueba.md`, `docs/plan-de-pruebas.md`, `docs/trazabilidad.md`).
- **Cambio adicional (spec 002)**: `web/src/tour/tour.js` pasa el foco de la X a «Siguiente»/«Listo» al resaltar cada paso; con la X enfocada, un Enter cerraba la guía. Lo cubre `CP-11 La guía se recorre con las flechas del teclado y conserva el foco`.
- **Resultado**: 65/65 unitarias y 40/40 e2e. Las 16 unitarias y 8 e2e nuevas fallaron antes de implementar.
