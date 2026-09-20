# Implementation Plan: Panel web de hábitos verificado con pruebas end-to-end

**Branch**: `feature/panel-web-e2e-tour` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-panel-web-e2e/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Construir un panel web estático (HTML + CSS + JavaScript con módulos ES, sin compilación) para
acceder con una cuenta de demostración, crear, marcar y eliminar hábitos, con las reglas de
negocio aisladas en un módulo de dominio puro. Verificarlo con pruebas unitarias (`node --test`)
y una suite end-to-end con Playwright que cubre los casos CP-01, CP-02 y CP-05 a CP-10 en
tamaño escritorio y móvil, ejecutable local, en CI y contra cualquier URL (smoke). Decisiones
en [research.md](./research.md); modelo en [data-model.md](./data-model.md); contrato de UI y
de dominio en [contracts/ui-contract.md](./contracts/ui-contract.md).

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript ES2022 (módulos ES en el navegador); Node 24 para
herramientas de desarrollo.

**Primary Dependencies**: ninguna en tiempo de ejecución (la guía de la spec 002 agrega driver.js
servido localmente); desarrollo: `@playwright/test` 1.63.0.

**Storage**: `localStorage` (hábitos y registros) y `sessionStorage` (sesión), con claves
`habitos.v1.*`.

**Testing**: `node --test` para el dominio; Playwright con proyectos `escritorio` (Desktop Chrome)
y `movil` (Pixel 7), ambos con Chromium; `locale: es-MX` y `timezoneId: America/Hermosillo` para
fechas deterministas.

**Target Platform**: navegadores modernos (Chrome, Edge, Firefox, Safari recientes); publicado en
GitHub Pages bajo `/habitos-tracker/`.

**Project Type**: aplicación web estática (frontend) dentro del monorepo.

**Performance Goals**: primera carga < 1 s en 4G; suite completa < 3 min en CI.

**Constraints**: sin CDN ni compilación; rutas relativas; accesible con teclado; datos solo en el
navegador.

**Scale/Scope**: 1 usuario por navegador, decenas de hábitos, 2 pantallas (acceso y panel).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento | Nota |
|---|---|---|
| I. Especificación primero | ✅ | spec, plan y tasks antes del código. |
| II. Pruebas como criterio de aceptación | ✅ | Cada CP web tiene prueba e2e; el dominio tiene pruebas unitarias; ambas corren en CI (spec 003). |
| III. Offline-first e idempotencia | ✅ | El almacenamiento local es la fuente de verdad; `marcarHecho` es idempotente. |
| IV. Dominio aislado | ✅ | `web/src/dominio/habitos.js` es puro (sin DOM ni almacenamiento). |
| V. Infraestructura como código | ✅ | Sin dependencias de CDN; servidor y pruebas versionados. |
| VI. Trazabilidad y simplicidad | ✅ | Títulos de prueba con ID `CP-xx`; sin framework de UI (YAGNI). |

**Re-check post-diseño**: sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/001-panel-web-e2e/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
web/
├── index.html               # Vistas de acceso y panel (rutas relativas)
├── css/
│   └── estilos.css
└── src/
    ├── app.js               # Orquestación de UI: eventos y renderizado
    ├── almacen.js           # Lectura/escritura de localStorage y sessionStorage
    ├── auth.js              # Autenticación simulada (cuenta de demostración)
    └── dominio/
        └── habitos.js       # Reglas puras: validar, crear, marcar, eliminar, contar
scripts/
└── serve.mjs                # Servidor estático sin dependencias (SERVE_DIR, PORT)
tests/
├── unit/
│   └── habitos.test.mjs     # node --test
└── e2e/
    ├── helpers.js           # iniciarSesion(), sembrar()
    ├── autenticacion.spec.js
    └── habitos.spec.js
package.json
playwright.config.js
```

**Structure Decision**: el panel vive en `web/` (hermano de `app/` y `api/`); las pruebas y el
tooling de Node en la raíz para que la CI de la spec 003 los detecte (`package.json` +
`web/index.html`).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones. Simplificación consciente: autenticación simulada hasta que exista la API.
