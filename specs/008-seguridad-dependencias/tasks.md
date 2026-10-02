---

description: "Task list for feature implementation"
---

# Tasks: Seguridad de dependencias (módulo extra)

**Input**: Design documents from `/specs/008-seguridad-dependencias/`

**Prerequisites**: plan.md, spec.md; spec 003 (integración continua) implementada

**Tests**: el propio flujo es la verificación; se ejecuta también en local antes de abrir el pull request.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Phase 1: Setup

- [x] T001 Elegir herramienta y fijar versión (`osv-scanner` v2.6.0), dejando registrada la comparación con Snyk en `plan.md`

---

## Phase 2: User Story 1 - Enterarse antes de liberar (Priority: P1) 🎯 MVP

**Goal**: cumplir FR-001 a FR-006.

**Independent Test**: `npm run seguridad:dependencias` y el flujo en un pull request.

- [x] T002 [US1] Crear `.github/workflows/dependencias.yml` con disparadores de push, pull request, programación semanal y manual
- [x] T003 [US1] Analizar el candado con OSV-Scanner en formato SARIF, sin cortar el flujo antes de publicar el reporte
- [x] T004 [US1] Publicar el SARIF en la pestaña *Security* y guardarlo como artefacto 30 días
- [x] T005 [US1] Escribir un resumen legible en el resumen del flujo con el número de hallazgos
- [x] T006 [US1] Fallar el trabajo si hubo hallazgos, después de publicar
- [x] T007 [US1] [P] Añadir el trabajo de segunda opinión con `npm audit --audit-level=high`
- [x] T008 [US1] Crear `scripts/osv-escaneo.mjs` y el script `seguridad:dependencias` en `package.json`, con mensaje claro si falta Docker
- [x] T009 [US1] Ejecutarlo en local y guardar el reporte en `docs/evidencia/osv-scanner.sarif.json`

---

## Phase 3: User Story 2 y 3 - Actualizaciones automáticas (Priority: P2 y P3)

**Goal**: cumplir FR-007 a FR-009.

- [x] T010 [US2] Crear `.github/dependabot.yml` con el ecosistema npm (semanal, contra `develop`, parches agrupados)
- [x] T011 [US3] [P] Agregar el ecosistema `github-actions` (semanal) con la etiqueta `ci`
- [x] T012 [US3] [P] Agregar `docker-compose` para `infra/monitoreo` e `infra/sonarqube` (mensual) con la etiqueta `infraestructura`

---

## Phase 4: Polish & Documentación

- [x] T013 [P] `docs/seguridad-dependencias.md`: qué revisa, cada cuándo, cómo leer el reporte y qué hacer ante un hallazgo
- [x] T014 [P] Registrar en el documento de la actividad por qué se eligió OSV-Scanner en lugar de Snyk

---

## Dependencies

- T002 bloquea T003–T007.
- T008 es independiente de los flujos y puede hacerse en paralelo.
- T010 bloquea T011 y T012 (mismo archivo).
