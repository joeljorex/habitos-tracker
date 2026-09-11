# Implementation Plan: Infraestructura como código y pipelines CI/CD

**Branch**: `feature/003-infraestructura-cicd` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-infraestructura-cicd/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Reemplazar el `ci.yml` actual (jobs con `if: false`, sin ejecución real) por un pipeline de CI
que detecta los componentes presentes y ejecuta sus verificaciones (web, API, app, Terraform,
estructura de specs); agregar un pipeline de CD que reutiliza la CI, prueba el paquete del panel
en un staging efímero, pide aprobación y lo publica en GitHub Pages; definir el entorno de
desarrollo en Codespaces y declarar en Terraform (proveedores GitHub y Railway) la protección de
ramas y los ambientes. Enfoque técnico detallado en [research.md](./research.md) y contrato
exacto en [contracts/pipelines.md](./contracts/pipelines.md).

## Technical Context

**Language/Version**: YAML (GitHub Actions), HCL (Terraform ≥ 1.9), JSON (devcontainer), Bash
y JavaScript (Node 24) para scripts auxiliares.

**Primary Dependencies**: acciones oficiales `actions/checkout`, `actions/setup-node`,
`actions/upload-artifact`, `actions/download-artifact`, `actions/upload-pages-artifact`,
`actions/deploy-pages`, `hashicorp/setup-terraform`, `shivammathur/setup-php`,
`actions/setup-java` (última versión mayor estable de cada una); proveedores de Terraform
`integrations/github` (~> 6) y `terraform-community-providers/railway`; features oficiales de
devcontainers.

**Storage**: estado de Terraform local (`terraform.tfstate`, ignorado por git).

**Testing**: `actionlint` para workflows; `terraform fmt -check`, `terraform init -backend=false`
y `terraform validate`; ejecución real de los workflows en GitHub; `node scripts/verificar-specs.mjs`.

**Target Platform**: runners `ubuntu-latest` de GitHub Actions; GitHub Codespaces (Linux);
GitHub Pages; Railway (API, futuro).

**Project Type**: infraestructura y DevOps de un monorepo (`app/`, `api/`, `web/`, `infra/`).

**Performance Goals**: CI completa < 10 min; CD sin contar aprobación < 10 min.

**Constraints**: la CI no puede depender de secretos (PRs desde forks); repositorio público;
integrantes en Windows y en Codespaces (Linux); sin costo.

**Scale/Scope**: 2 desarrolladores, ~5 PRs por semana, 1 sitio publicado.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento | Nota |
|---|---|---|
| I. Especificación primero | ✅ | Esta feature tiene spec, plan y tasks; además la CI hace cumplir el principio con el check `SDD - Specs completas`. |
| II. Pruebas como criterio de aceptación | ✅ | La CI ejecuta las pruebas de cada componente y la protección de ramas bloquea merges en rojo. |
| III. Offline-first e idempotencia | N/A | Sin lógica de dominio. |
| IV. Dominio aislado | N/A | Sin lógica de dominio. |
| V. Infraestructura como código | ✅ | Pipelines, entorno y configuración de nube versionados; secretos fuera del repo. |
| VI. Trazabilidad y simplicidad | ✅ | Nombres de checks estables y documentados; Railway opcional para no sumar complejidad hoy. |

**Re-check post-diseño**: sin violaciones; *Complexity Tracking* vacío.

## Project Structure

### Documentation (this feature)

```text
specs/003-infraestructura-cicd/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones y alternativas
├── quickstart.md        # Fase 1: guía de validación
├── contracts/
│   └── pipelines.md     # Fase 1: contrato de jobs, checks, scripts y variables
├── checklists/
│   └── requirements.md  # Validación de calidad de la spec
└── tasks.md             # Fase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
.github/
└── workflows/
    ├── ci.yml                 # Integración continua (reutilizable vía workflow_call)
    └── cd.yml                 # Despliegue continuo (push a main)
.devcontainer/
├── devcontainer.json          # Entorno Codespaces
└── post-create.sh             # Instalación de dependencias del proyecto
infra/
└── terraform/
    ├── versions.tf            # Versión de Terraform y proveedores
    ├── variables.tf
    ├── github.tf              # Protección de ramas y ambientes
    ├── railway.tf             # Proyecto/servicio de la API (opcional)
    ├── outputs.tf
    ├── terraform.tfvars.example
    └── README.md
scripts/
└── verificar-specs.mjs        # Gate SDD: specs completas
```

**Structure Decision**: la infraestructura vive en carpetas de primer nivel separadas del código
de producto (`.github/`, `.devcontainer/`, `infra/`) para que cada PR de infraestructura sea
revisable de forma aislada. No se crea `data-model.md`: la feature no maneja datos de negocio.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones.
