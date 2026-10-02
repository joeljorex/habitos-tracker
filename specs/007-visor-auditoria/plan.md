# Implementation Plan: Visor de auditoría

**Branch**: `feature/007-visor-auditoria` | **Date**: 2026-10-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-visor-auditoria/spec.md`

## Summary

`web/src/observabilidad/auditoria.js` guarda los eventos con valor de negocio en una cadena: cada
evento incluye el hash del anterior y su propio SHA-256, calculado con `crypto.subtle` sobre un
texto canónico. `verificarIntegridad()` recalcula la cadena completa y devuelve la posición exacta
del primer evento alterado. La pestaña **Auditoría** del visor muestra la tabla, el estado de la
verificación y la exportación a CSV. Como el hash es asíncrono, las escrituras se encolan dentro
del propio módulo para que ningún evento se pierda.

## Technical Context

**Language/Version**: JavaScript ES2022 (módulos ES), `crypto.subtle` (Web Crypto API).

**Primary Dependencies**: ninguna.

**Storage**: `localStorage`, clave `habitos.v1.auditoria` (máximo 500 eventos).

**Testing**: `node --test` (Node trae `crypto.subtle` global) con dobles de `localStorage`;
Playwright para el visor y para la detección de manipulación.

**Target Platform**: panel web (spec 001), también en GitHub Pages (contexto seguro: HTTPS).

**Project Type**: módulo de dominio + interfaz.

**Performance Goals**: verificar 500 eventos en menos de 2 s.

**Constraints**: `crypto.subtle` solo existe en contexto seguro (HTTPS o `localhost`); la escritura
es asíncrona y no debe bloquear la interfaz.

**Scale/Scope**: 500 eventos por navegador.

## Constitution Check

| Principio | Cumplimiento | Nota |
|---|---|---|
| I. Especificación primero | ✅ | Formato del evento y del texto canónico fijados en el contrato. |
| II. Pruebas como criterio de aceptación | ✅ | 9 pruebas unitarias (incluida la detección de alteración) y 2 end-to-end. |
| III. Offline-first e idempotencia | ✅ | Todo local; la cola garantiza el orden sin red. |
| IV. Dominio aislado | ✅ | `auditoria.js` no conoce el DOM. |
| V. Infraestructura como código | ✅ | Pruebas en la CI existente (spec 003). |
| VI. Trazabilidad y simplicidad | ✅ | Un solo mecanismo de integridad (cadena de hashes), documentado con su alcance real. |

## Project Structure

### Documentation (this feature)

```text
specs/007-visor-auditoria/
├── plan.md
├── spec.md
├── contracts/
│   └── auditoria-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
web/src/observabilidad/
├── auditoria.js                 # registrarEvento, verificarIntegridad, exportarCSV
└── visor/
    └── auditoria-vista.js       # pestaña Auditoría
web/src/app.js                   # auditar() en cada acción con valor
tests/unit/observabilidad-auditoria.test.mjs
tests/e2e/observabilidad.spec.js
```

**Structure Decision**: la cola de escritura vive dentro de `auditoria.js`, no en quien lo llama:
así cualquier parte de la aplicación puede auditar sin preocuparse por el orden.

## Decisiones

| Decisión | Alternativas consideradas | Por qué |
|---|---|---|
| Cadena de hashes SHA-256 | Guardar los eventos sin más | Sin cadena, editar el almacenamiento es indetectable; con cadena, cualquier cambio se nota. |
| Hash recortado a 16 caracteres | SHA-256 completo (64) | Cabe en la tabla y sigue siendo suficiente para detectar edición manual en este contexto. |
| `crypto.subtle` del navegador | Una librería de hash | Sin dependencias y es la implementación nativa, auditada. |
| Cola de escritura interna | Pedir `await` a quien llama | Quien llama no debe tener que saber que el hash es asíncrono. |
| Marcar `inicioDeCadena` al recortar | No recortar nunca | `localStorage` tiene ~5 MB; sin recorte la aplicación acabaría fallando al guardar. |
| Documentar que detecta, no impide | Prometer "registro inalterable" | Los datos están en el navegador de la persona; prometer más sería falso. |

## Complexity Tracking

Sin violaciones.
