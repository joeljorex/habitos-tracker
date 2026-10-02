# Implementation Plan: Seguridad de dependencias (módulo extra)

**Branch**: `feature/008-seguridad-dependencias` | **Date**: 2026-10-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-seguridad-dependencias/spec.md`

## Summary

Dos piezas que se complementan: **OSV-Scanner** revisa `package-lock.json` contra la base de datos
OSV (la que agrega los avisos de GitHub, npm y las distribuciones de Linux) en cada cambio y una vez
por semana, y **Dependabot** abre los pull requests de actualización. El análisis corre igual en la
integración continua y en la máquina de cualquiera del equipo, porque en los dos casos se usa la
misma imagen de contenedor.

## Technical Context

**Language/Version**: YAML para los flujos; Node 22 para el script local.

**Primary Dependencies**: `google/osv-scanner-action@v2.6.0` y la imagen
`ghcr.io/google/osv-scanner:v2.6.0`; Dependabot (servicio de GitHub); `npm audit` (ya incluido).

**Storage**: N/A (los reportes son artefactos).

**Testing**: el propio flujo es la prueba; `npm run seguridad:dependencias` lo reproduce en local.

**Target Platform**: GitHub Actions (ubuntu-latest) y máquinas del equipo con Docker.

**Project Type**: infraestructura y seguridad de la cadena de suministro.

**Performance Goals**: el análisis completo tarda segundos (5 paquetes).

**Constraints**: sin cuentas ni tokens de servicios externos; el reporte debe poder verse sin salir
de GitHub.

**Scale/Scope**: 5 paquetes en el candado, 3 ecosistemas vigilados por Dependabot.

## Constitution Check

| Principio | Cumplimiento | Nota |
|---|---|---|
| I. Especificación primero | ✅ | Alcance y criterios definidos antes de escribir el flujo. |
| II. Pruebas como criterio de aceptación | ✅ | El flujo falla si hay hallazgos; se ejecutó en local con 0 vulnerabilidades. |
| III. Offline-first e idempotencia | ✅ | No afecta a la aplicación; el análisis es idempotente. |
| IV. Dominio aislado | ✅ | No toca código de la aplicación. |
| V. Infraestructura como código | ✅ | Todo vive en `.github/` y `scripts/`. |
| VI. Trazabilidad y simplicidad | ✅ | Un reporte SARIF versionado y visible en la pestaña *Security*. |

## Project Structure

### Documentation (this feature)

```text
specs/008-seguridad-dependencias/
├── plan.md
├── spec.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.github/
├── dependabot.yml                  # npm, github-actions y docker-compose
└── workflows/dependencias.yml      # OSV-Scanner + npm audit
scripts/osv-escaneo.mjs             # el mismo análisis en local
docs/seguridad-dependencias.md
docs/evidencia/osv-scanner.sarif.json
```

**Structure Decision**: el script local y el flujo usan la misma versión de la herramienta, para que
«en mi máquina pasa» y «en el servidor pasa» signifiquen lo mismo.

## Decisiones

| Decisión | Alternativas consideradas | Por qué |
|---|---|---|
| OSV-Scanner | **Snyk**, `npm audit` solo | Snyk pide cuenta y token, y su nivel gratuito limita los análisis; OSV es gratuito, abierto y no necesita registro, así que cualquiera del equipo lo corre igual. `npm audit` solo cubre npm. |
| `npm audit` como segunda opinión | Confiar en una sola fuente | Ya viene instalado y no cuesta nada; dos fuentes reducen el riesgo de falso negativo. |
| Reporte SARIF | Salida de texto | Se integra con la pestaña *Security* de GitHub y marca la línea exacta. |
| Dependabot | Renovate | Dependabot es nativo de GitHub, no requiere instalar una aplicación extra. |
| Agrupar parches | Un pull request por paquete | Menos ruido sin perder cobertura. |

## Complexity Tracking

Sin violaciones.
