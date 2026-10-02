---

description: "Task list for feature implementation"
---

# Tasks: Visor de auditoría

**Input**: Design documents from `/specs/007-visor-auditoria/`

**Prerequisites**: plan.md, spec.md, contracts/auditoria-contract.md; specs 005 y 006 implementadas

**Tests**: SOLICITADAS (FR-011, constitución principio II). Primero las pruebas, que deben fallar.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Reutilizar `web/src/observabilidad/deposito.js` y el marco del visor (specs 005 y 006)

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T002 Crear `web/src/observabilidad/auditoria.js` con las firmas del contrato (sin implementar) para que las pruebas fallen por el motivo correcto

---

## Phase 3: User Story 1 - Saber quién hizo qué (Priority: P1) 🎯 MVP

**Goal**: cumplir FR-001, FR-002 y FR-008.

**Independent Test**: iniciar sesión, crear un hábito y ver los dos eventos con su actor y su hora.

### Tests for User Story 1

- [x] T003 [US1] Pruebas unitarias del formato del evento, la normalización del resultado y el orden y los filtros de lectura en `tests/unit/observabilidad-auditoria.test.mjs`

### Implementation for User Story 1

- [x] T004 [US1] Implementar `registrarEvento` y `leerAuditoria` en `auditoria.js`
- [x] T005 [US1] Llamar a `auditar()` desde `web/src/app.js` en acceso aceptado y rechazado, cierre de sesión, creación aceptada y rechazada, marcado y eliminación
- [x] T006 [US1] Construir la pestaña Auditoría (`web/src/observabilidad/visor/auditoria-vista.js`) con la tabla, los filtros y el resumen

---

## Phase 4: User Story 2 - Comprobar que el registro no fue alterado (Priority: P1)

**Goal**: cumplir FR-003 a FR-007.

**Independent Test**: editar un evento en el almacenamiento y ver que la verificación lo señala.

### Tests for User Story 2

- [x] T007 [US2] Pruebas unitarias de la cadena: encadenado, detección de contenido modificado, detección de evento borrado y escrituras concurrentes en `tests/unit/observabilidad-auditoria.test.mjs`

### Implementation for User Story 2

- [x] T008 [US2] Implementar el texto canónico y `calcularHash` con `crypto.subtle` (SHA-256 recortado a 16 caracteres)
- [x] T009 [US2] Implementar `verificarIntegridad` devolviendo posición, identificador y motivo del primer evento alterado o faltante
- [x] T010 [US2] Encolar las escrituras dentro del módulo para que varias llamadas sin esperar conserven la cadena
- [x] T011 [US2] Recorte a 500 eventos marcando `inicioDeCadena` en el primero que queda
- [x] T012 [US2] Botón «Verificar integridad» en la vista, con estado visible (pendiente, verificando, verificada, alterada)
- [x] T013 [US2] Pruebas end-to-end: verificación correcta y detección de manipulación del almacenamiento en `tests/e2e/observabilidad.spec.js`

---

## Phase 5: User Story 3 - Llevarse la evidencia (Priority: P2)

**Goal**: cumplir FR-009 y FR-010.

**Independent Test**: exportar el CSV y revisar su encabezado y sus filas.

### Implementation for User Story 3

- [x] T014 [US3] Implementar `exportarCSV` con encabezado, escapado de comillas y el hash de cada evento
- [x] T015 [US3] Implementar `limpiarAuditoria(actor)`: exporta, borra y registra `auditoria.limpiada` como primer eslabón de la cadena nueva

---

## Phase 6: Polish & Documentación

- [x] T016 [P] Estilos de la pestaña en `web/css/estilos.css` (estado de integridad, insignias de resultado, columna de hash)
- [x] T017 [P] `docs/visor-auditoria.md`: qué se audita, cómo funciona la cadena y cuál es su alcance real
- [x] T018 [P] Evidencia en `docs/evidencia/`: auditoría verificada y auditoría alterada

---

## Dependencies

- T002 bloquea T004 y T008.
- T003 y T007 antes de su implementación (pruebas primero).
- T009 depende de T008; T010 depende de T004.
- T012 depende de T009; T013 depende de T012.
