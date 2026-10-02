# Implementation Plan: Visor de trazabilidad (registros y trazas)

**Branch**: `feature/006-visor-trazabilidad` | **Date**: 2026-10-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-visor-trazabilidad/spec.md`

## Summary

Dos módulos pequeños y una vista. `trazas.js` abre y cierra trazas con pasos anidados usando el
reloj monótono del navegador, y expone `conTraza`/`conSpan` para envolver una operación sin cambiar
su comportamiento. `bitacora.js` guarda entradas estructuradas con nivel, mensaje y contexto, y
estampa en cada una el identificador de la traza en curso: esa estampa es toda la correlación.
La pestaña **Trazabilidad** del visor pone las trazas a la izquierda y la bitácora a la derecha, y
al elegir una traza filtra la bitácora por su identificador.

## Technical Context

**Language/Version**: JavaScript ES2022 (módulos ES).

**Primary Dependencies**: ninguna.

**Storage**: `localStorage`, claves `habitos.v1.bitacora` y `habitos.v1.trazas` (buffers circulares
de 300 y 100 elementos).

**Testing**: `node --test` con dobles de `localStorage` en memoria; Playwright para el visor.

**Target Platform**: panel web (spec 001), también en GitHub Pages.

**Project Type**: módulos de dominio + interfaz.

**Performance Goals**: abrir y cerrar una traza con tres pasos debe costar menos de 1 ms.

**Constraints**: una sola pestaña y un solo hilo (no hay concurrencia real); el almacenamiento
puede fallar; nada de `innerHTML` con datos de la persona.

**Scale/Scope**: 300 entradas y 100 trazas por navegador.

## Constitution Check

| Principio | Cumplimiento | Nota |
|---|---|---|
| I. Especificación primero | ✅ | Formato de entrada, traza y paso definidos en el contrato. |
| II. Pruebas como criterio de aceptación | ✅ | 14 pruebas unitarias y 2 end-to-end. |
| III. Offline-first e idempotencia | ✅ | Todo local; sin almacenamiento se degrada a vacío. |
| IV. Dominio aislado | ✅ | `bitacora.js` y `trazas.js` no conocen el DOM. |
| V. Infraestructura como código | ✅ | Las pruebas corren en la CI existente (spec 003). |
| VI. Trazabilidad y simplicidad | ✅ | El `trazaId` es el único mecanismo de correlación: nada de identificadores paralelos. |

## Project Structure

### Documentation (this feature)

```text
specs/006-visor-trazabilidad/
├── plan.md
├── spec.md
├── contracts/
│   └── trazabilidad-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
web/src/observabilidad/
├── trazas.js                      # iniciar/terminar traza y pasos, conTraza, conSpan
├── bitacora.js                    # registrar, niveles, filtros, exportarJSON
└── visor/
    └── trazabilidad-vista.js      # pestaña Trazabilidad
web/src/app.js                     # las operaciones se envuelven en conTraza/conSpan
tests/unit/{observabilidad-bitacora,observabilidad-trazas}.test.mjs
tests/e2e/observabilidad.spec.js
```

**Structure Decision**: `bitacora.js` importa de `trazas.js` (y no al revés) para que la
correlación sea automática: quien registra no tiene que acordarse de pasar el identificador.

## Decisiones

| Decisión | Alternativas consideradas | Por qué |
|---|---|---|
| Trazas propias y mínimas | OpenTelemetry Web | OTel pesa cientos de kilobytes y necesita un recolector; aquí no hay backend ni presupuesto. El modelo (traza → pasos) es el mismo. |
| Estampar `trazaId` al registrar | Pasar el identificador en cada llamada | Menos ruido en `app.js` y es imposible olvidarlo. |
| Buffer circular en `localStorage` | `IndexedDB` | Para 300 entradas no justifica el costo; `localStorage` es síncrono y basta. |
| Registrar dentro de la traza | Registrar después de la operación | Si se registra después, la traza ya cerró y el registro queda sin correlación. |
| Reloj monótono (`performance.now`) | `Date.now()` | Un cambio de hora del sistema no debe producir duraciones negativas. |

## Complexity Tracking

Sin violaciones.
