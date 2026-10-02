---

description: "Task list for feature implementation"
---

# Tasks: Visor de trazabilidad (registros y trazas)

**Input**: Design documents from `/specs/006-visor-trazabilidad/`

**Prerequisites**: plan.md, spec.md, contracts/trazabilidad-contract.md; spec 005 implementada (depósito y marco del visor)

**Tests**: SOLICITADAS (FR-011, constitución principio II). Primero las pruebas, que deben fallar.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Reutilizar `web/src/observabilidad/deposito.js` (spec 005) para los buffers circulares de bitácora y trazas

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T002 Crear `web/src/observabilidad/trazas.js` y `web/src/observabilidad/bitacora.js` con las firmas del contrato (sin implementar) para que las pruebas fallen por el motivo correcto

---

## Phase 3: User Story 1 - Seguir una operación completa (Priority: P1) 🎯 MVP

**Goal**: cumplir FR-004 a FR-007.

**Independent Test**: crear un hábito y ver su traza con los tres pasos y sus duraciones.

### Tests for User Story 1

- [x] T003 [US1] Pruebas unitarias de trazas: jerarquía de pasos, duraciones, estado de error, traza incompleta, paso huérfano, filtros y recorte en `tests/unit/observabilidad-trazas.test.mjs`

### Implementation for User Story 1

- [x] T004 [US1] Implementar `trazas.js`: `iniciarTraza`, `iniciarSpan`, `terminarSpan`, `terminarTraza`, `conTraza`, `conSpan`, `leerTrazas`, con reloj monótono y máximo de 100 trazas
- [x] T005 [US1] Envolver las operaciones de `web/src/app.js` en `conTraza`/`conSpan` (iniciar sesión, cerrar sesión, crear, marcar y eliminar hábito), dejando los diálogos de confirmación fuera de la traza

---

## Phase 4: User Story 2 - Correlacionar registros con su operación (Priority: P1)

**Goal**: cumplir FR-001 a FR-003 y FR-009.

**Independent Test**: elegir una traza y ver la bitácora filtrada por su identificador.

### Tests for User Story 2

- [x] T006 [US2] Pruebas unitarias de bitácora: niveles, orden, filtros, correlación con la traza en curso, recorte, entradas corruptas y almacenamiento bloqueado en `tests/unit/observabilidad-bitacora.test.mjs`

### Implementation for User Story 2

- [x] T007 [US2] Implementar `bitacora.js`: `registrar` con los cuatro niveles, estampado de `trazaId`/`spanId`, filtros y `exportarJSON`, con máximo de 300 entradas
- [x] T008 [US2] Escribir los registros **dentro** de la traza en `web/src/app.js`, para que cada entrada quede correlacionada
- [x] T009 [US2] Construir la pestaña Trazabilidad (`web/src/observabilidad/visor/trazabilidad-vista.js`): lista de trazas con sus pasos, tabla de bitácora, selección de traza y aviso con el identificador

---

## Phase 5: User Story 3 - Buscar en la bitácora (Priority: P2)

**Goal**: cumplir FR-009 y FR-010.

**Independent Test**: filtrar por nivel y por texto del contexto.

### Implementation for User Story 3

- [x] T010 [US3] Filtros de nivel, texto y estado de traza en la vista, con mensaje de lista vacía propio
- [x] T011 [US3] Botones de exportar la bitácora en JSON y de limpiar registros y trazas
- [x] T012 [US3] Prueba end-to-end de la correlación y de los filtros en `tests/e2e/observabilidad.spec.js`

---

## Phase 6: Polish & Documentación

- [x] T013 [P] Estilos de la pestaña en `web/css/estilos.css` (tarjetas de traza, jerarquía de pasos, niveles de la bitácora)
- [x] T014 [P] `docs/visor-trazabilidad.md`: cómo se lee una traza y cómo se usa en soporte
- [x] T015 [P] Evidencia en `docs/evidencia/visor-trazabilidad.png`

---

## Dependencies

- T002 bloquea T004 y T007.
- T003 antes de T004; T006 antes de T007 (pruebas primero).
- T009 depende de T004 y T007; T012 depende de T009.
