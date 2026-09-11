# Implementation Plan: Módulo de rachas de hábitos

**Branch**: `feature/004-logica-rachas` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-logica-rachas/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Implementar `calcularRachas(fechas, hoy)` como función pura en `web/src/dominio/rachas.js`,
trabajando con fechas `YYYY-MM-DD` convertidas a número de día (vía `Date.UTC`) para que el
horario de verano no influya. Verificarla con los 13 casos de referencia del contrato
(`node --test`, ≥ 90 % de cobertura), mostrar "Racha" y "Mejor" en cada hábito del panel,
actualizar al marcar sin recargar, y registrar el paso "Tu racha" en la guía de la spec 002.

## Technical Context

**Language/Version**: JavaScript ES2022 (módulos ES).

**Primary Dependencies**: ninguna.

**Storage**: N/A (valor derivado de `habitos.v1.registros`).

**Testing**: `node --test` con cobertura (`--experimental-test-coverage`) para el dominio;
Playwright con `page.clock.setFixedTime()` para CP-04 y CP-13.

**Target Platform**: panel web (spec 001); el mismo contrato se portará a Kotlin (app) y PHP (API).

**Project Type**: módulo de dominio + integración en UI.

**Performance Goals**: cálculo O(n log n) por hábito; < 1 ms para 3 años de registros.

**Constraints**: función pura sin reloj implícito (`hoy` siempre por parámetro).

**Scale/Scope**: hasta ~1 100 registros por hábito (3 años).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento | Nota |
|---|---|---|
| I. Especificación primero | ✅ | Reglas explícitas en spec y contrato antes del código. |
| II. Pruebas como criterio de aceptación | ✅ | 13 casos de referencia + CP-04 y CP-13 e2e; cobertura ≥ 90 %. |
| III. Offline-first e idempotencia | ✅ | Duplicados del mismo día cuentan una vez (FR-004). |
| IV. Dominio aislado | ✅ | Función pura con `hoy` como parámetro. |
| V. Infraestructura como código | ✅ | Pruebas corren en la CI existente (spec 003). |
| VI. Trazabilidad y simplicidad | ✅ | Valor derivado, no almacenado (sin sincronizar un dato extra). |

## Project Structure

### Documentation (this feature)

```text
specs/004-logica-rachas/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── rachas-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
web/src/
├── dominio/
│   └── rachas.js          # calcularRachas(fechas, hoy) — pura
├── tour/
│   └── pasos.js           # + paso "racha" antes de "ver-guia"
└── app.js                 # muestra Racha/Mejor en cada hábito
tests/
├── unit/
│   └── rachas.test.mjs    # casos V01–V13
└── e2e/
    └── rachas.spec.js     # CP-04, CP-13
package.json               # + script test:cobertura
```

**Structure Decision**: el cálculo vive junto al resto del dominio (`web/src/dominio/`) y no
depende de `habitos.js`; `app.js` obtiene las fechas de cada hábito y llama a `calcularRachas`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones.
