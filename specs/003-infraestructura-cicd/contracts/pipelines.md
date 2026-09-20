# Contrato: pipelines, checks, scripts y variables

Este contrato fija los nombres que otras piezas usan (protección de ramas, Terraform, panel web).
Cambiar cualquiera de ellos es un cambio de contrato: se actualiza este archivo y
`infra/terraform/variables.tf` en el mismo PR.

## 1. `ci.yml` — Integración continua

**Nombre del workflow**: `CI`

**Disparadores**

| Evento | Ramas |
|---|---|
| `pull_request` | `main`, `develop` |
| `push` | `develop` |
| `workflow_call` | (invocado por `cd.yml`) |
| `workflow_dispatch` | manual |

> `push` a `main` no dispara `ci.yml` directamente: lo hace `cd.yml`, que la invoca como primera
> etapa. Así no se ejecuta dos veces la misma CI.

**Permisos**: `contents: read`.

**Concurrencia**: grupo `ci-${{ github.ref }}`; `cancel-in-progress` solo cuando el evento es
`pull_request`.

**Outputs de `workflow_call`**: `web`, `api`, `app`, `iac` (valores `'true'`/`'false'`).

**Jobs**

| id | `name` (= nombre del check) | Condición | Pasos principales |
|---|---|---|---|
| `detectar` | `Detectar componentes` | siempre | checkout; outputs según la tabla de detección |
| `web` | `Web - unit + e2e (Playwright)` | `web == 'true'` | Node 24 con caché npm; `npm ci`; `npm run test:unit`; `npx playwright install --with-deps chromium`; `npm run test:e2e`; subir `playwright-report/` como artefacto `playwright-report` (`if: always()`, 14 días) |
| `api` | `API (Laravel) - Tests` | `api == 'true'` | PHP 8.3; `composer install --no-interaction --prefer-dist`; `.env` efímero con `key:generate` si existe `.env.example`; `php artisan test` (en `api/`) |
| `app` | `App (Android) - Build & Unit Tests` | `app == 'true'` | Temurin 17 con caché de Gradle; `chmod +x gradlew`; `./gradlew testDebugUnitTest` (en `app/`) |
| `iac` | `IaC - Terraform validate` | `iac == 'true'` | Terraform 1.16.2; `terraform fmt -check -recursive`; `terraform init -backend=false`; `terraform validate` (en `infra/terraform/`) |
| `sdd` | `SDD - Specs completas` | siempre | checkout; Node 24; `node scripts/verificar-specs.mjs` |

**Tabla de detección**

| Output | Es `true` cuando existe… |
|---|---|
| `web` | `package.json` **y** `web/index.html` |
| `api` | `api/composer.json` |
| `app` | `app/gradlew` |
| `iac` | `infra/terraform/versions.tf` |

**Checks requeridos por la protección de ramas** (exactamente estos textos):

```text
Detectar componentes
Web - unit + e2e (Playwright)
API (Laravel) - Tests
App (Android) - Build & Unit Tests
IaC - Terraform validate
SDD - Specs completas
```

> `Detectar componentes` también es requerido: si fallara, los jobs de componentes quedarían
> *skipped* (que cuenta como éxito) y un PR podría integrarse sin verificar nada.

## 2. `cd.yml` — Despliegue continuo

**Nombre del workflow**: `CD`

**Disparadores**: `push` a `main`; `workflow_dispatch`.

**Permisos por defecto**: `contents: read`. El job que publica agrega `pages: write` e
`id-token: write`.

**Concurrencia del despliegue**: grupo `pages`, `cancel-in-progress: false`.

| id | `name` | Depende de | Condición | Ambiente | Pasos principales |
|---|---|---|---|---|---|
| `ci` | `CI completo` | — | siempre | — | `uses: ./.github/workflows/ci.yml` |
| `construir-web` | `Construir paquete del panel` | `ci` | `needs.ci.outputs.web == 'true'` | — | checkout; `actions/upload-pages-artifact` con `path: web` |
| `smoke-staging` | `Smoke tests (staging)` | `construir-web` | idem | `staging` | checkout; Node 24; `npm ci`; Playwright chromium; descargar artefacto `github-pages`; extraer `artifact.tar` en `_site/`; `SERVE_DIR=_site npm run test:smoke` |
| `aprobacion-produccion` | `Aprobación de producción` | `smoke-staging` | idem | `production` (revisores) | registra el SHA a publicar en el resumen |
| `desplegar-produccion` | `Publicar en GitHub Pages` | `aprobacion-produccion` | idem | `github-pages` (url = `page_url`) | `actions/deploy-pages` |
| `verificar-produccion` | `Verificar producción` | `desplegar-produccion` | idem | — | Node 24; `npm ci`; Playwright chromium; `BASE_URL=<page_url> npm run test:smoke` |
| `desplegar-api` | `Desplegar API (Railway)` | `ci` | `needs.ci.outputs.api == 'true'` | `production` | si existen `api/Dockerfile` y `RAILWAY_TOKEN`: `railway up --ci --service api` (espera el veredicto del despliegue); si falta alguno, aviso en `GITHUB_STEP_SUMMARY` y salida 0 |
| `construir-app` | `Construir app (AAB)` | `ci` | `needs.ci.outputs.app == 'true'` | — | Temurin 17; `./gradlew bundleRelease`; artefacto `app-release-aab`; distribución Firebase solo si existen `FIREBASE_APP_ID` y `FIREBASE_CREDENTIALS` |

**Migraciones y health check de la API** (decisión de implementación): `php artisan migrate --force`
se configura como *pre-deploy command* del servicio en Railway, que se ejecuta dentro de su red
privada después del build y antes de dar tráfico; el health check `/api/health` también lo evalúa
Railway. Si cualquiera falla, el despliegue no avanza, sigue la versión anterior y
`railway up --ci` termina con error. La base de datos no es accesible desde el runner de GitHub.

**Secretos (GitHub → Settings → Secrets and variables → Actions)**

| Secreto | Uso | Obligatorio hoy |
|---|---|---|
| `RAILWAY_TOKEN` | Despliegue de la API (token de proyecto de Railway) | No (la API aún no existe) |
| `FIREBASE_APP_ID` | Distribución de la app | No |
| `FIREBASE_CREDENTIALS` | JSON de cuenta de servicio de Firebase | No |

> Firebase App Distribution solo acepta AAB si la app está vinculada a Google Play; sin Play,
> la alternativa es distribuir un APK (`assembleRelease`).

## 3. Contrato con el panel web (lo implementa `specs/001-panel-web-e2e`)

| Elemento | Contrato |
|---|---|
| `package.json` → `scripts.test:unit` | pruebas de `tests/unit/` con `node --test` |
| `package.json` → `scripts.test:e2e` | `playwright test` |
| `package.json` → `scripts.test:smoke` | `playwright test --grep @smoke` |
| `package.json` → `scripts.test` | unitarias + e2e |
| `package.json` → `scripts.serve` | `node scripts/serve.mjs` |
| `scripts/serve.mjs` | servidor estático sin dependencias; lee `SERVE_DIR` (defecto `web`) y `PORT` (defecto `4173`) |
| `playwright.config.js` | `baseURL = BASE_URL ?? http://127.0.0.1:${PORT}/`; `webServer` solo si no hay `BASE_URL`; reporte HTML en `playwright-report/` |
| Pruebas smoke | título contiene `@smoke`; navegan con rutas relativas (`./`) para funcionar bajo `/habitos-tracker/` en Pages |

## 4. Terraform (`infra/terraform/`)

**Proveedores**: `integrations/github` (~> 6.0), `terraform-community-providers/railway` (~> 0.6.2).
**Credenciales**: variables de entorno `GITHUB_TOKEN` (admin del repo) y `RAILWAY_TOKEN`; nunca en archivos.

| Variable | Tipo | Defecto |
|---|---|---|
| `github_owner` | string | `"joeljorex"` |
| `repositorio` | string | `"habitos-tracker"` |
| `ramas_protegidas` | list(string) | `["main", "develop"]` |
| `checks_requeridos` | list(string) | los 6 checks de la sección 1 |
| `aprobaciones_requeridas` | number | `1` |
| `revisores_produccion` | list(string) (usuarios de GitHub) | `["joeljorex"]` |
| `habilitar_railway` | bool | `false` |
| `railway_proyecto` | string | `"habitos-tracker-api"` |

**Recursos**: protección de cada rama de `ramas_protegidas` (PR obligatorio, aprobaciones,
checks estrictos, reglas también para administradores, sin force-push ni borrado); ambientes
`staging` y `production` (revisores, solo ramas protegidas); con `habilitar_railway = true`:
proyecto, servicio `api` (raíz `/api`) y ambiente `staging` en Railway.

> Aplicar Terraform (o crear `production` con revisores a mano) **antes** del primer merge a
> `main`: si GitHub crea el ambiente en su primer uso, lo crea sin revisores.

## 5. Codespaces (`.devcontainer/`)

| Elemento | Valor |
|---|---|
| Imagen | `mcr.microsoft.com/devcontainers/javascript-node:5-24-bookworm` |
| Features | PHP 8.3 + Composer, Python 3.12, Terraform 1.16.2, Docker-in-Docker, GitHub CLI |
| `postCreateCommand` | `bash .devcontainer/post-create.sh`: `npm ci`, Chromium de Playwright, `uv` + Spec Kit 1.0.6 y `composer install` si existe la API (idempotente) |
| Puertos | `4173` → "Panel web"; `8000` → "API Laravel" |
| Extensiones | Playwright, Terraform, GitHub Actions, PHP Intelephense, vista previa de Mermaid |
