---

description: "Task list for feature implementation"
---

# Tasks: Panel web de hábitos verificado con pruebas end-to-end

**Input**: Design documents from `/specs/001-panel-web-e2e/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md

**Tests**: SOLICITADAS explícitamente por la spec (FR-011, FR-012) y por la constitución
(principio II). Se escriben primero y deben fallar antes de implementar.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Crear `package.json` (privado, `"type": "module"`, `engines.node >= 22`) con devDependency `@playwright/test@1.63.0` y los scripts `test:unit`, `test:e2e`, `test:smoke`, `test`, `serve` del contrato
- [x] T002 [P] Implementar `scripts/serve.mjs`: servidor estático sin dependencias que lee `SERVE_DIR` (defecto `web`) y `PORT` (defecto `4173`), resuelve `index.html` en directorios, envía tipos MIME correctos, responde 404 y bloquea rutas fuera de la carpeta
- [x] T003 [P] Crear `playwright.config.js`: `testDir: tests/e2e`, `baseURL` desde `BASE_URL` o `http://127.0.0.1:${PORT}/`, `webServer` solo sin `BASE_URL`, proyectos `escritorio` (Desktop Chrome) y `movil` (Pixel 7), `locale: es-MX`, `timezoneId: America/Hermosillo`, reporter `list` + `html` (sin abrir), `trace: on-first-retry`, 2 reintentos en CI

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T004 Crear `web/index.html` semántico (`lang="es"`): vista de acceso y vista de panel (encabezado, formulario, lista), `css/estilos.css` y `src/app.js` (módulo) con rutas relativas, `data-testid` del contrato
- [x] T005 [P] Crear `web/css/estilos.css` mobile-first, con foco visible y contraste AA
- [x] T006 [P] Implementar `web/src/almacen.js`: leer y escribir las claves `habitos.v1.*`; JSON inválido se trata como vacío
- [x] T007 [P] Crear `tests/e2e/helpers.js` con `iniciarSesion(page)` y `sembrar(page, datos)` (escribe solo si la clave no existe)

**Checkpoint**: estructura lista; `npm run serve` muestra la página.

---

## Phase 3: User Story 1 - Acceso al panel (Priority: P1) 🎯 MVP

**Goal**: entrar con la cuenta de demostración y cerrar sesión.

**Independent Test**: CP-05 y CP-10.

### Tests for User Story 1

- [x] T008 [P] [US1] Pruebas e2e `CP-05 Login con credenciales inválidas` y `CP-10 Login válido muestra el panel y cerrar sesión regresa al acceso @smoke` en `tests/e2e/autenticacion.spec.js`

### Implementation for User Story 1

- [x] T009 [US1] Implementar `web/src/auth.js`: validar la cuenta `demo@habitos.app` / `Habitos123`, guardar la sesión en `sessionStorage`, cerrar sesión
- [x] T010 [US1] Conectar en `web/src/app.js` las vistas de acceso y panel, el mensaje `Correo o contraseña incorrectos.` y el botón `logout`

**Checkpoint**: US1 funcional y probada.

---

## Phase 4: User Story 2 - Registrar y ver hábitos (Priority: P1)

**Goal**: crear hábitos válidos y verlos en la lista, también tras recargar.

**Independent Test**: CP-01, CP-07, CP-08, CP-09.

### Tests for User Story 2

- [x] T011 [P] [US2] Pruebas unitarias de `validarNombre` y `crearHabito` (vacío, solo espacios, 60 y 61 caracteres, duplicado sin distinguir mayúsculas ni espacios) en `tests/unit/habitos.test.mjs`
- [x] T012 [P] [US2] Pruebas e2e `CP-01 … @smoke`, `CP-07 …`, `CP-08 …`, `CP-09 …` en `tests/e2e/habitos.spec.js`

### Implementation for User Story 2

- [x] T013 [US2] Implementar `fechaLocal`, `validarNombre` y `crearHabito` en `web/src/dominio/habitos.js` con los mensajes exactos del contrato ("nombre recortado, longitud 1–60, único sin distinguir mayúsculas")
- [x] T014 [US2] Renderizar en `web/src/app.js` la lista en orden de creación, el estado vacío y los errores con `aria-live`

**Checkpoint**: US1 y US2 funcionan de forma independiente.

---

## Phase 5: User Story 3 - Marcar un hábito como hecho hoy (Priority: P1)

**Goal**: marcar una vez por día, sin duplicados.

**Independent Test**: CP-02.

### Tests for User Story 3

- [x] T015 [P] [US3] Pruebas unitarias de `marcarHecho` (idempotencia: "como máximo un registro por (habitoId, fecha)"), `estaHechoHoy` y `diasCumplidos` en `tests/unit/habitos.test.mjs`
- [x] T016 [P] [US3] Prueba e2e `CP-02 Marcar hábito completado dos veces el mismo día` en `tests/e2e/habitos.spec.js`

### Implementation for User Story 3

- [x] T017 [US3] Implementar `marcarHecho`, `estaHechoHoy` y `diasCumplidos` en `web/src/dominio/habitos.js`
- [x] T018 [US3] Botón `Marcar hoy` / `Hecho hoy ✓` (deshabilitado al estar hecho) y texto de días cumplidos en `web/src/app.js`

---

## Phase 6: User Story 5 - Suite end-to-end automatizada y trazable (Priority: P1)

**Goal**: un comando, dos dispositivos, reporte y smoke contra cualquier URL.

**Independent Test**: quickstart.md completo.

- [x] T019 [US5] Verificar que cada prueba inicia con su `CP-xx` y que `@smoke` marca CP-01 y CP-10
- [x] T020 [US5] Ejecutar `npm test` en verde en los proyectos `escritorio` y `movil` y generar `playwright-report/`
- [x] T021 [US5] Ejecutar `npm run test:smoke` con `SERVE_DIR=web` y con `BASE_URL` apuntando a un servidor levantado aparte

---

## Phase 7: User Story 4 - Eliminar un hábito (Priority: P2)

**Goal**: eliminar con confirmación, incluyendo su historial.

**Independent Test**: CP-06.

### Tests for User Story 4

- [x] T022 [P] [US4] Prueba unitaria de `eliminarHabito` (cascada de registros) en `tests/unit/habitos.test.mjs` y e2e `CP-06 Eliminar hábito` (confirmar y cancelar) en `tests/e2e/habitos.spec.js`

### Implementation for User Story 4

- [x] T023 [US4] Implementar `eliminarHabito` en `web/src/dominio/habitos.js` y el botón con confirmación `¿Eliminar «{nombre}»? También se borrará su historial.` en `web/src/app.js`

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T024 [P] Revisión con teclado (Tab, Enter, Espacio, Esc) y de etiquetas accesibles en `web/index.html`
- [x] T025 [P] Actualizar `docs/plan-de-pruebas.md` y `docs/casos-de-prueba.md` con la suite y la trazabilidad CP → prueba
- [x] T026 Ejecutar la validación de `quickstart.md`

---

## Dependencies & Execution Order

- Setup → Foundational → US1 → (US2, US3, US4 en orden de prioridad) → US5 → Polish.
- US3 depende de US2 (necesita hábitos); US4 depende de US2.
- US5 se valida al final porque recorre todas las pruebas.

### Parallel Opportunities

- T002 y T003; T005, T006 y T007.
- Dentro de cada historia, pruebas unitarias y e2e en paralelo (archivos distintos).

## Parallel Example: User Story 2

```bash
Task: "Pruebas unitarias de validarNombre y crearHabito en tests/unit/habitos.test.mjs"
Task: "Pruebas e2e CP-01, CP-07, CP-08, CP-09 en tests/e2e/habitos.spec.js"
```

## Implementation Strategy

### MVP First

Setup + Foundational + US1 + US2 → demostrar acceso y creación de hábitos con sus pruebas.

### Incremental Delivery

US3 (marcar) → US5 (suite completa en CI) → US4 (eliminar) → la spec 002 agrega la guía y la
spec 004 agrega las rachas sobre esta base.

## Notes

- Commit sugerido: `feat(web): panel de hábitos con suite e2e Playwright (spec 001)`.

## Notas de implementación

- **T001**: `test:unit` es `node --test "tests/unit/*.test.mjs"`. En Node 24, un directorio como argumento se interpreta como archivo; el patrón entre comillas lo expande Node y funciona igual en cmd (Windows) y en sh (CI).
- **T002 / T006**: pruebas extra `tests/unit/serve.test.mjs` (6) y `tests/unit/almacen.test.mjs` (11). El servidor redirige a la barra final igual que GitHub Pages y responde 403 ante *path traversal*.
- **T003**: la configuración agrega la barra final a `BASE_URL` si falta (sin ella, `./` saldría de la subruta).
- **T024**: la revisión con teclado quedó automatizada en `CP-10 El flujo principal (acceso, crear, marcar, eliminar y salir) se completa solo con teclado`.
- **T025**: la documentación se actualizó en este mismo PR (`docs/plan-de-pruebas.md`, `docs/casos-de-prueba.md`).
- **Resultado**: 48/48 pruebas unitarias y 34/34 e2e (17 en `escritorio` + 17 en `movil`); smoke 4/4 en local y 4/4 bajo `/habitos-tracker/`. Las pruebas unitarias se escribieron primero y fallaron antes de implementar el dominio.
