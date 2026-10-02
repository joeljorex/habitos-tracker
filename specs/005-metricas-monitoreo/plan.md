# Implementation Plan: Métricas y alarmas de monitoreo

**Branch**: `feature/005-metricas-monitoreo` | **Date**: 2026-10-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-metricas-monitoreo/spec.md`

## Summary

Dos mitades que se complementan. Dentro del navegador, `web/src/observabilidad/metricas.js` acumula
contadores y resúmenes de duración en `localStorage` y los exporta en el formato de texto de
Prometheus; `web/src/observabilidad/alarmas.js` evalúa cuatro reglas puras sobre ese corte de
métricas y el visor las muestra. Fuera, `infra/monitoreo/` levanta Prometheus, Alertmanager,
Blackbox exporter y Grafana con Docker para sondear el panel publicado en GitHub Pages y el panel
local, con las mismas condiciones escritas como reglas de alerta.

## Technical Context

**Language/Version**: JavaScript ES2022 (módulos ES) para el panel; YAML y JSON para el stack.

**Primary Dependencies**: ninguna en el panel. Imágenes fijadas: `prom/prometheus:v3.1.0`,
`prom/alertmanager:v0.28.0`, `prom/blackbox-exporter:v0.26.0`, `grafana/grafana-oss:11.5.1`.

**Storage**: `localStorage`, clave `habitos.v1.metricas`.

**Testing**: `node --test` para métricas y alarmas; Playwright para el visor; `promtool check
config` y `check rules` para el stack, en local (`npm run monitoreo:validar`) y en CI.

**Target Platform**: panel web (spec 001) publicado en GitHub Pages (spec 003); stack en Docker.

**Project Type**: módulo de dominio + interfaz + infraestructura como código.

**Performance Goals**: medir una operación no debe costar más de 1 ms; el intervalo de recolección
es de 30 s.

**Constraints**: sin servidor propio ni dependencias nuevas en el panel; el almacenamiento puede
estar bloqueado; un fallo al medir nunca debe propagarse.

**Scale/Scope**: decenas de series por navegador; dos objetivos sondeados.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento | Nota |
|---|---|---|
| I. Especificación primero | ✅ | Métricas, umbrales y alertas definidos en spec y contrato antes del código. |
| II. Pruebas como criterio de aceptación | ✅ | Unitarias de métricas y alarmas, e2e del visor, `promtool` en CI. |
| III. Offline-first e idempotencia | ✅ | Todo se acumula en el navegador; sin almacenamiento, se degrada a vacío. |
| IV. Dominio aislado | ✅ | `alarmas.js` es puro: recibe el corte de métricas y no toca almacenamiento. |
| V. Infraestructura como código | ✅ | El stack entero vive en `infra/monitoreo/` y se valida en CI. |
| VI. Trazabilidad y simplicidad | ✅ | Un solo lugar define los umbrales y se referencia desde las reglas y los documentos. |

## Project Structure

### Documentation (this feature)

```text
specs/005-metricas-monitoreo/
├── plan.md
├── spec.md
├── contracts/
│   └── metricas-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
web/src/observabilidad/
├── deposito.js             # lectura/escritura tolerante en localStorage
├── metricas.js             # incrementar, observar, exportarPrometheus
├── alarmas.js              # evaluarAlarmas (pura) y umbrales
└── visor/
    ├── metricas-vista.js   # pestaña Métricas: alarmas, tablas y exposición
    └── util.js             # formatos y filtros compartidos
infra/monitoreo/
├── docker-compose.yml
├── prometheus/{prometheus.yml,reglas.yml}
├── alertmanager/alertmanager.yml
├── blackbox/blackbox.yml
└── grafana/{provisioning,tableros}
scripts/monitoreo-validar.mjs
tests/unit/{observabilidad-metricas,observabilidad-alarmas}.test.mjs
tests/e2e/observabilidad.spec.js
.github/workflows/monitoreo.yml
```

**Structure Decision**: las métricas del navegador y el stack de servidor se mantienen separados
pero con los mismos umbrales; `alarmas.js` se deja puro para poder probarlo sin navegador.

## Decisiones

| Decisión | Alternativas consideradas | Por qué |
|---|---|---|
| Prometheus + Grafana | Nagios, Zabbix, Datadog | Gratis, se versiona como código y es el estándar de facto; Datadog exige cuenta y tarjeta, Nagios y Zabbix pesan mucho más para un sitio estático. |
| Blackbox exporter | Un *script* propio que haga `curl` | Ya resuelve latencia por fase, certificado y códigos; su salida es la que esperan las reglas. |
| Métricas también dentro del panel | Solo sondas externas | Una sonda no sabe cuántos hábitos se crearon ni cuántos accesos se rechazaron. |
| Guardar en `localStorage` | Mandarlas a un servidor | No hay servidor; y así el visor funciona en GitHub Pages y sin conexión. |
| Umbrales duplicados a propósito (panel y Prometheus) | Generar unos desde otros | Son dos tecnologías distintas; se mantienen iguales por contrato y lo verifica la revisión del PR. |

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones.
