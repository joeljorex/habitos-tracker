---

description: "Task list for feature implementation"
---

# Tasks: Métricas y alarmas de monitoreo

**Input**: Design documents from `/specs/005-metricas-monitoreo/`

**Prerequisites**: plan.md, spec.md, contracts/metricas-contract.md; specs 001 y 003 implementadas

**Tests**: SOLICITADAS (FR-012, constitución principio II). Primero las pruebas, que deben fallar.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Crear `web/src/observabilidad/deposito.js` con lectura y escritura tolerantes a fallos de `localStorage`, identificadores cortos y reloj monótono
- [x] T002 [P] Extraer los ayudantes de DOM a `web/src/ui/dom.js` (`crear`, `porTestId`) y usarlos desde `web/src/app.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T003 Crear `web/src/observabilidad/metricas.js` exportando `incrementar`, `observar`, `leerMetricas` y `exportarPrometheus` (sin implementar) para que las pruebas fallen por el motivo correcto

---

## Phase 3: User Story 2 - Medir lo que la gente hace en el panel (Priority: P1) 🎯 MVP

**Goal**: cumplir FR-001 a FR-006.

**Independent Test**: usar el panel y ver crecer los contadores en la pestaña Métricas.

### Tests for User Story 2

- [x] T004 [US2] Pruebas unitarias de contadores, etiquetas sin orden, resúmenes de duración y exposición Prometheus en `tests/unit/observabilidad-metricas.test.mjs`

### Implementation for User Story 2

- [x] T005 [US2] Implementar `metricas.js`: clave estable con etiquetas ordenadas, contadores, resumen de duración (cuenta, suma, mínimo, máximo, promedio) y `exportarPrometheus` con `_count`/`_sum`/`_max` en segundos
- [x] T006 [US2] Instrumentar `web/src/app.js`: envoltorio `accion()` que cuenta, mide y registra el error de cada operación; contadores de creación, marcado, eliminación, accesos y fallos de almacenamiento

---

## Phase 4: User Story 3 - Alarmas en el panel (Priority: P2)

**Goal**: cumplir FR-007 a FR-009.

**Independent Test**: fallar cuatro accesos y ver la regla en alarma, con el punto rojo en el encabezado.

### Tests for User Story 3

- [x] T007 [US3] Pruebas unitarias de las cuatro reglas y del estado general en `tests/unit/observabilidad-alarmas.test.mjs`

### Implementation for User Story 3

- [x] T008 [US3] Implementar `web/src/observabilidad/alarmas.js`: umbrales en un solo lugar, evaluación pura y estado general
- [x] T009 [US3] Construir la pestaña Métricas (`web/src/observabilidad/visor/metricas-vista.js`): tarjetas de alarma, tablas de contadores y duraciones, exposición Prometheus y descarga
- [x] T010 [US3] Marco del visor con pestañas accesibles (`web/src/observabilidad/visor.js`), botón en el encabezado con el estado general y estilos en `web/css/estilos.css`
- [x] T011 [US3] Pruebas end-to-end del visor y de la alarma de accesos rechazados en `tests/e2e/observabilidad.spec.js`

---

## Phase 5: User Story 1 - Monitoreo del entorno de liberación (Priority: P1)

**Goal**: cumplir FR-010 y FR-011.

**Independent Test**: levantar el stack, ver el tablero y provocar la alerta apagando el panel local.

### Implementation for User Story 1

- [x] T012 [US1] `infra/monitoreo/docker-compose.yml` con Prometheus, Alertmanager, Blackbox y Grafana (puertos, volúmenes, healthchecks e imágenes fijadas)
- [x] T013 [US1] `infra/monitoreo/prometheus/prometheus.yml`: intervalos, objetivos del panel publicado y local, y reetiquetado de las sondas
- [x] T014 [US1] [P] `infra/monitoreo/prometheus/reglas.yml`: `PanelCaido`, `RespuestaNoExitosa`, `ObjetivoSinDatos`, `LatenciaAlta`, `LatenciaMuyAlta` y `CertificadoPorVencer`
- [x] T015 [US1] [P] `infra/monitoreo/alertmanager/alertmanager.yml`: agrupación, repetición e inhibición de latencia cuando ya hay caída
- [x] T016 [US1] [P] `infra/monitoreo/blackbox/blackbox.yml` con los módulos `http_2xx` y `http_panel`
- [x] T017 [US1] Aprovisionamiento de Grafana (fuente de datos y tablero) y tablero versionado en `grafana/tableros/habitos-tracker.json`
- [x] T018 [US1] Scripts `monitoreo:levantar`, `monitoreo:apagar`, `monitoreo:estado` y `monitoreo:validar` en `package.json`, con `scripts/monitoreo-validar.mjs`
- [x] T019 [US1] Flujo `.github/workflows/monitoreo.yml`: valida configuración, reglas, Alertmanager, tablero y compose, levanta el stack y comprueba las sondas

---

## Phase 6: Polish & Documentación

- [x] T020 [P] `infra/monitoreo/README.md` con el procedimiento de arranque y la comprobación de alertas
- [x] T021 [P] `docs/monitoreo-entorno.md`: métricas, alarmas, umbrales y relación con los niveles de servicio
- [x] T022 [P] Evidencia en `docs/evidencia/`: tablero de Grafana, objetivos y reglas de Prometheus, Alertmanager con la alerta disparada y el visor de métricas

---

## Dependencies

- T001 y T003 bloquean todo lo demás del panel.
- T004 antes de T005; T007 antes de T008 (pruebas primero).
- T009 y T010 dependen de T005 y T008.
- T012 bloquea T013–T017; T019 depende de T018.
