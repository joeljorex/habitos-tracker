# Implementation Plan: Guía interactiva del panel web

**Branch**: `feature/panel-web-e2e-tour` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-tour-guiado-driverjs/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Agregar al panel de la spec 001 una guía paso a paso con **driver.js 1.8.0** servida desde
`web/vendor/` (sin CDN). Los pasos viven en un registro (`web/src/tour/pasos.js`); el motor
(`web/src/tour/tour.js`) resuelve qué pasos aplican según los elementos presentes, arranca solo
tras el primer inicio de sesión, recuerda que se vio en `localStorage` y se relanza con "Ver
guía". Pruebas: unitarias de la resolución de pasos y e2e de CP-11 y CP-12.

## Technical Context

**Language/Version**: JavaScript ES2022 (módulos ES) sobre el panel de la spec 001.

**Primary Dependencies**: driver.js 1.8.0 (MIT), build IIFE copiado a `web/vendor/driver.js/`
(expone `window.driver.js.driver`); desarrollo: `driver.js@1.8.0` como devDependency para
actualizar la copia con `npm run vendor:driver`.

**Storage**: `localStorage` clave `habitos.v1.tourVisto` = `"1"`.

**Testing**: `node --test` para `resolverPasos` (función pura); Playwright para CP-11 y CP-12.

**Target Platform**: los mismos navegadores del panel (escritorio y móvil).

**Project Type**: módulo de frontend dentro de `web/`.

**Performance Goals**: la guía abre en menos de 300 ms tras iniciar sesión; driver.js pesa ~5 KB
comprimido.

**Constraints**: sin CDN; textos en español; no bloquea el panel si falla el almacenamiento.

**Scale/Scope**: 4 pasos en la spec 002 (5 con la spec 004).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento | Nota |
|---|---|---|
| I. Especificación primero | ✅ | spec, plan y tasks previos. |
| II. Pruebas como criterio de aceptación | ✅ | CP-11 y CP-12 automatizados; `resolverPasos` con pruebas unitarias. |
| III. Offline-first e idempotencia | ✅ | Recursos locales; relanzar con la guía abierta no duplica. |
| IV. Dominio aislado | ✅ | La resolución de pasos es una función pura separada del motor. |
| V. Infraestructura como código | ✅ | Versión exacta y copia versionada de la librería. |
| VI. Trazabilidad y simplicidad | ✅ | Un registro de pasos; sin framework adicional. |

## Project Structure

### Documentation (this feature)

```text
specs/002-tour-guiado-driverjs/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── tour-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
web/
├── index.html                 # + <link> driver.css y <script> driver.js.iife.js; botón Ver guía
├── vendor/
│   └── driver.js/
│       ├── driver.js.iife.js  # copia de node_modules/driver.js/dist (1.8.0)
│       ├── driver.css
│       └── LICENSE
└── src/
    └── tour/
        ├── pasos.js           # Registro de pasos + agregarPaso()
        └── tour.js            # resolverPasos(), iniciarTour(), tourVisto(), marcarVisto()
tests/
├── unit/
│   └── tour.test.mjs
└── e2e/
    └── tour.spec.js
```

**Structure Decision**: la guía es un módulo propio en `web/src/tour/`; `app.js` solo la invoca
tras el inicio de sesión y desde el botón "Ver guía".

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones.
