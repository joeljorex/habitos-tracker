---

description: "Task list for feature implementation"
---

# Tasks: Infraestructura como código y pipelines CI/CD

**Input**: Design documents from `/specs/003-infraestructura-cicd/`

**Prerequisites**: plan.md, spec.md, research.md, contracts/pipelines.md, quickstart.md

**Tests**: la verificación de esta feature es estática (`actionlint`, `terraform validate`,
`verificar-specs`) más la ejecución real en GitHub descrita en `quickstart.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Crear las carpetas `.github/workflows/`, `.devcontainer/`, `infra/terraform/` y `scripts/` según plan.md
- [ ] T002 [P] Verificar que `.gitignore` ignora `infra/terraform/.terraform/`, `*.tfstate`, `*.tfstate.*` y `terraform.tfvars` (el lock `.terraform.lock.hcl` sí se versiona)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: piezas que usan todas las historias

- [ ] T003 [P] Implementar `scripts/verificar-specs.mjs` (Node, sin dependencias): recorre `specs/*/`, falla con código 1 listando cada carpeta sin `spec.md`, `plan.md` o `tasks.md`; si no existe `specs/`, termina con código 0 y un aviso
- [ ] T004 Crear el job `detectar` ("Detectar componentes") en `.github/workflows/ci.yml` con outputs `web`, `api`, `app`, `iac` según la tabla de detección de contracts/pipelines.md

**Checkpoint**: la detección de componentes funciona y el gate SDD se puede ejecutar localmente.

---

## Phase 3: User Story 1 - Integración continua que bloquea cambios defectuosos (Priority: P1) 🎯 MVP

**Goal**: cada PR hacia `develop`/`main` ejecuta las verificaciones de los componentes presentes.

**Independent Test**: PR con una prueba rota → check rojo y merge bloqueado (quickstart §2).

- [ ] T005 [US1] Configurar en `.github/workflows/ci.yml` los disparadores (`pull_request` a main/develop, `push` a develop, `workflow_call` con outputs `web/api/app/iac`, `workflow_dispatch`), `permissions: contents: read` y `concurrency` (`ci-${{ github.ref }}`, cancelación solo en `pull_request`)
- [ ] T006 [US1] Agregar el job `web` ("Web - unit + e2e (Playwright)"): Node 24 con caché npm, `npm ci`, `npm run test:unit`, `npx playwright install --with-deps chromium`, `npm run test:e2e` y subida de `playwright-report/` como artefacto `playwright-report` con `if: always()` y retención de 14 días, en `.github/workflows/ci.yml`
- [ ] T007 [P] [US1] Agregar el job `api` ("API (Laravel) - Tests") con PHP 8.3, `composer install --no-interaction --prefer-dist` y `php artisan test` en `api/`, en `.github/workflows/ci.yml`
- [ ] T008 [P] [US1] Agregar el job `app` ("App (Android) - Build & Unit Tests") con Temurin 17 y `./gradlew testDebugUnitTest` en `app/`, en `.github/workflows/ci.yml`
- [ ] T009 [P] [US1] Agregar el job `iac` ("IaC - Terraform validate") con `terraform fmt -check -recursive`, `terraform init -backend=false` y `terraform validate` en `infra/terraform/`, en `.github/workflows/ci.yml`
- [ ] T010 [US1] Agregar el job `sdd` ("SDD - Specs completas") que ejecuta `node scripts/verificar-specs.mjs`, en `.github/workflows/ci.yml`
- [ ] T011 [US1] Ejecutar `actionlint .github/workflows/ci.yml` sin errores

**Checkpoint**: US1 funcional; los 6 checks requeridos existen con los nombres del contrato.

---

## Phase 4: User Story 2 - Despliegue continuo del panel web con aprobación (Priority: P1)

**Goal**: merge a `main` → CI → paquete → staging → aprobación → Pages → verificación.

**Independent Test**: quickstart §3.

- [ ] T012 [US2] Crear `.github/workflows/cd.yml` con disparadores (`push` a main, `workflow_dispatch`), `permissions: contents: read` y el job `ci` que invoca `./.github/workflows/ci.yml`
- [ ] T013 [US2] Agregar el job `construir-web` ("Construir paquete del panel") que empaqueta `web/` con `actions/upload-pages-artifact`, en `.github/workflows/cd.yml`
- [ ] T014 [US2] Agregar el job `smoke-staging` ("Smoke tests (staging)", ambiente `staging`) que descarga el artefacto `github-pages`, lo extrae en `_site/` y ejecuta `SERVE_DIR=_site npm run test:smoke`, en `.github/workflows/cd.yml`
- [ ] T015 [US2] Agregar el job `aprobacion-produccion` ("Aprobación de producción", ambiente `production`) en `.github/workflows/cd.yml`
- [ ] T016 [US2] Agregar el job `desplegar-produccion` ("Publicar en GitHub Pages", ambiente `github-pages`, `pages: write`, `id-token: write`, concurrencia `pages` sin cancelación) con `actions/deploy-pages`, en `.github/workflows/cd.yml`
- [ ] T017 [US2] Agregar el job `verificar-produccion` ("Verificar producción") que ejecuta `npm run test:smoke` con `BASE_URL` = URL publicada, en `.github/workflows/cd.yml`
- [ ] T018 [P] [US2] Agregar el job `desplegar-api` ("Desplegar API (Railway)") condicionado a `api/Dockerfile` y al secreto `RAILWAY_TOKEN` (aviso en `GITHUB_STEP_SUMMARY` si falta), con migraciones `php artisan migrate --force` después del health check, en `.github/workflows/cd.yml`
- [ ] T019 [P] [US2] Agregar el job `construir-app` ("Construir app (AAB)") con `./gradlew bundleRelease`, artefacto AAB y distribución Firebase solo si existen `FIREBASE_APP_ID` y `FIREBASE_CREDENTIALS`, en `.github/workflows/cd.yml`
- [ ] T020 [US2] Ejecutar `actionlint .github/workflows/cd.yml` sin errores

**Checkpoint**: US1 y US2 funcionan juntas; el CD reutiliza la CI.

---

## Phase 5: User Story 3 - Entorno de desarrollo reproducible en la nube (Priority: P2)

**Goal**: Codespace listo para correr pruebas sin instalaciones manuales.

**Independent Test**: quickstart §4.

- [ ] T021 [US3] Crear `.devcontainer/devcontainer.json` con imagen oficial de Node 24, features de PHP 8.3, Python 3.12, Terraform, Docker-in-Docker y GitHub CLI, puertos 4173 ("Panel web") y 8000 ("API Laravel") y extensiones de contracts/pipelines.md §5
- [ ] T022 [US3] Crear `.devcontainer/post-create.sh` idempotente: `npm ci` y `npx playwright install --with-deps chromium` si existe `package.json`; instalación de `uv` y de `specify-cli` v1.0.6

**Checkpoint**: el Codespace se crea sin errores y `npm test` pasa.

---

## Phase 6: User Story 4 - Configuración de la nube declarada como código (Priority: P2)

**Goal**: protección de ramas y ambientes (GitHub) y API (Railway, opcional) en Terraform.

**Independent Test**: quickstart §1 (sin credenciales) y §5 (con token).

- [ ] T023 [US4] Crear `infra/terraform/versions.tf` con `required_version >= 1.9` y los proveedores `integrations/github ~> 6.0` y `terraform-community-providers/railway`
- [ ] T024 [P] [US4] Crear `infra/terraform/variables.tf` con las variables y valores por defecto de contracts/pipelines.md §4
- [ ] T025 [US4] Crear `infra/terraform/github.tf`: protección de cada rama de `ramas_protegidas` (PR obligatorio, `aprobaciones_requeridas`, checks estrictos `checks_requeridos`, sin force-push ni borrado) y ambientes `staging` y `production` (revisores `revisores_produccion`, solo ramas protegidas)
- [ ] T026 [US4] Crear `infra/terraform/railway.tf` con proyecto, servicio `api` y ambiente `staging` condicionados a `habilitar_railway`
- [ ] T027 [P] [US4] Crear `infra/terraform/outputs.tf` y `infra/terraform/terraform.tfvars.example`
- [ ] T028 [US4] Crear `infra/terraform/README.md` con uso, credenciales por variables de entorno e importación de recursos existentes
- [ ] T029 [US4] Ejecutar `terraform fmt -check -recursive`, `terraform init -backend=false` y `terraform validate` en `infra/terraform/` sin errores

**Checkpoint**: todas las historias completas.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T030 [P] Actualizar `docs/flujo-cicd.md`, `docs/estrategia-despliegue.md`, `docs/parametros-configuracion.md` y `README.md` con los pipelines, Codespaces y Terraform
- [ ] T031 Ejecutar la validación completa de `quickstart.md` §1

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → historias.
- **US1 (P1)** es prerrequisito de **US2** (el CD reutiliza la CI).
- **US3** y **US4** dependen solo de la fase 2 y pueden hacerse en paralelo con US1/US2.
- **Polish** al final.

### Parallel Opportunities

- T007, T008 y T009 (jobs independientes del mismo archivo, pero sin dependencias lógicas;
  conviene escribirlos juntos para evitar conflictos).
- T018 y T019 en paralelo.
- US3 (devcontainer) y US4 (Terraform) en paralelo con US1.

## Parallel Example: User Story 4

```bash
Task: "Crear infra/terraform/variables.tf"
Task: "Crear infra/terraform/outputs.tf y terraform.tfvars.example"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Fases 1 y 2.
2. US1 → abrir un PR de prueba y comprobar los checks.
3. **STOP and VALIDATE** antes de construir el CD.

### Incremental Delivery

1. US1 (CI) → 2. US2 (CD) → 3. US4 (Terraform aplica la protección que exige los checks de US1)
→ 4. US3 (Codespaces).

## Notes

- Los nombres de jobs son contrato: si cambian, actualizar `checks_requeridos` en Terraform.
- Commit sugerido: `ci: pipelines CI/CD, Codespaces y Terraform (spec 003)`.
