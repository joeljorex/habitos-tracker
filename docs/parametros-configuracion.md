# Parámetros de Configuración de Herramientas

Valores de configuración de cada herramienta del proyecto y plan de uso, instalación e
implementación. Todo lo que aparece aquí está versionado en el repositorio.

## 1. App móvil

| Parámetro | Valor |
|---|---|
| IDE | Android Studio Quail (3) |
| Lenguaje / UI | Kotlin · Jetpack Compose |
| Min SDK | 24 (Android 7.0) — cubre prácticamente todos los dispositivos activos |
| Target SDK | 36 (Android 16) — requerido por Google Play para apps nuevas desde agosto de 2026 |
| Persistencia local | Room (fuente de verdad offline-first) |
| Networking / sincronización | Retrofit · WorkManager |
| Pruebas | JUnit y MockWebServer (unitarias e integración) · Appium con UiAutomator2 (e2e) |
| JDK para compilar | 17 (el incluido en Android Studio, o Temurin 17 en CI) |

## 2. Backend / API

| Parámetro | Valor |
|---|---|
| Framework | Laravel 13.x (requiere PHP 8.3+) |
| Base de datos | MySQL 8.4 |
| Autenticación | Laravel Sanctum |
| Entorno local | Docker Compose (servicios `app` y `mysql`) o GitHub Codespaces |
| Pruebas | PHPUnit (`php artisan test`), Feature tests contra MySQL |
| Despliegue | Railway (servicio `api`, raíz `/api`) |

**Justificación de Docker/Codespaces:** reproducibilidad entre máquinas (por ejemplo, PHP 8.2 local
contra el 8.3 que exige Laravel 13) y el mismo entorno en desarrollo, CI y demostraciones.

## 3. Panel web

| Parámetro | Valor |
|---|---|
| Tecnología | HTML5, CSS y JavaScript ES2022 con módulos ES; sin compilación ni frameworks |
| Estructura | `web/index.html`, `web/css/`, `web/src/` (UI), `web/src/dominio/` (reglas puras), `web/src/tour/` |
| Almacenamiento | `localStorage` con claves `habitos.v1.*`; sesión en `sessionStorage` |
| Servidor local | `node scripts/serve.mjs` · `SERVE_DIR` (defecto `web`) · `PORT` (defecto `4173`) |
| Publicación | GitHub Pages bajo `/habitos-tracker/` (rutas relativas) |
| Accesibilidad | etiquetas en todos los controles, errores con `aria-live`, operable con teclado |
| Cuenta de demostración | `demo@habitos.app` / `Habitos123` (autenticación simulada hasta integrar Sanctum) |

## 4. Pruebas automáticas (Playwright)

| Parámetro | Valor |
|---|---|
| Versión | `@playwright/test` 1.63.0 |
| Carpetas | `tests/e2e/` (end-to-end) · `tests/unit/` (unitarias con `node --test`) |
| `baseURL` | `BASE_URL` si existe; si no, `http://127.0.0.1:4173/` con servidor automático |
| Proyectos | `escritorio` (Desktop Chrome) y `movil` (Pixel 7), ambos con Chromium |
| Localización | `locale: es-MX` · `timezoneId: America/Hermosillo` |
| Reportes | `list` en consola y HTML en `playwright-report/` |
| Diagnóstico | `trace: on-first-retry` · 2 reintentos solo en CI |
| Scripts | `test`, `test:unit`, `test:e2e`, `test:smoke`, `test:cobertura`, `serve`, `vendor:driver` |

## 5. Guía interactiva (driver.js)

| Parámetro | Valor |
|---|---|
| Versión | driver.js 1.8.0 (MIT) |
| Carga | copia local en `web/vendor/driver.js/` (sin CDN), actualizada con `npm run vendor:driver` |
| Progreso | `showProgress: true` · `progressText: "{{current}} de {{total}}"` |
| Botones | `Siguiente` · `Anterior` · `Listo`; cierre con X o Esc; control con flechas |
| Persistencia | `habitos.v1.tourVisto = "1"` al completar o cerrar |
| Pasos | registro único en `web/src/tour/pasos.js`; los módulos agregan pasos con `agregarPaso()` |

## 6. Control de versiones y CI/CD

| Parámetro | Valor |
|---|---|
| Estrategia de branching | `main` (producción) · `develop` (integración) · `feature/*` · `hotfix/*` |
| Convención de commits | Conventional Commits (`feat`, `fix`, `test`, `docs`, `ci`, `chore`, `refactor`) |
| Plataforma | GitHub Actions, runners `ubuntu-latest` |
| Workflows | `.github/workflows/ci.yml` (integración) · `.github/workflows/cd.yml` (despliegue) |
| Acciones | `actions/checkout@v7`, `actions/setup-node@v7`, `actions/upload-artifact@v7`, `actions/download-artifact@v8`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`, `hashicorp/setup-terraform@v4`, `shivammathur/setup-php@v2`, `actions/setup-java@v6` |
| Checks requeridos | `Detectar componentes`, `Web - unit + e2e (Playwright)`, `API (Laravel) - Tests`, `App (Android) - Build & Unit Tests`, `IaC - Terraform validate`, `SDD - Specs completas` |
| Protección de ramas | `main` y `develop`: PR obligatorio, 1 aprobación, checks al día, sin push directo, force-push ni borrado |

## 7. GitHub Codespaces

| Parámetro | Valor |
|---|---|
| Definición | `.devcontainer/devcontainer.json` |
| Imagen | `mcr.microsoft.com/devcontainers/javascript-node:5-24-bookworm` (Node 24) |
| Features | PHP 8.3 + Composer · Python 3.12 · Terraform 1.16.2 · Docker-in-Docker · GitHub CLI |
| Preparación | `.devcontainer/post-create.sh`: `uv`, Spec Kit 1.0.6, `npm ci`, Chromium de Playwright, `composer install` si existe la API |
| Puertos | 4173 «Panel web» · 8000 «API Laravel» |
| Extensiones | Playwright, Terraform, GitHub Actions, PHP Intelephense, vista previa de Mermaid |

## 8. Terraform

| Parámetro | Valor |
|---|---|
| Versión | ≥ 1.9 (CI y Codespaces: 1.16.2) |
| Proveedores | `integrations/github` ~> 6.0 (6.13.0) · `terraform-community-providers/railway` ~> 0.6.2 |
| Recursos | protección de `main` y `develop`; ambientes `staging` y `production`; proyecto y servicio de Railway (opcional) |
| Variables | `github_owner`, `repositorio`, `ramas_protegidas`, `checks_requeridos`, `aprobaciones_requeridas`, `revisores_produccion`, `habilitar_railway`, `railway_proyecto` |
| Credenciales | variables de entorno `GITHUB_TOKEN` y `RAILWAY_TOKEN` (nunca en archivos) |
| Estado | local; `*.tfstate` y `terraform.tfvars` ignorados por git; `.terraform.lock.hcl` versionado |

## 9. Spec Kit

| Parámetro | Valor |
|---|---|
| CLI | specify-cli 1.0.6, instalado con `uv` |
| Integración | `claude` (comandos como skills en `.claude/skills/`) |
| Scripts | `py` (Python, multiplataforma) |
| Numeración de features | secuencial |
| Constitución | `.specify/memory/constitution.md` v1.0.0 |

## 10. Planeación de uso, instalación e implementación

| Herramienta | Para qué se usa | Instalación | Dónde se implementa |
|---|---|---|---|
| Android Studio + Kotlin | App móvil | instalador oficial; SDK 36 | `app/` |
| Laravel + Docker | API REST | `docker-compose up -d` o Codespaces | `api/` |
| Playwright | Pruebas e2e del panel | `npm ci` · `npx playwright install chromium` | `tests/e2e/`, `playwright.config.js` |
| `node --test` | Pruebas unitarias del dominio | incluido en Node 24 | `tests/unit/` |
| Appium | Pruebas e2e de la app | `npm i -g appium` · `appium driver install uiautomator2` | `app/` (fase de app) |
| driver.js | Guía interactiva | `npm run vendor:driver` | `web/vendor/`, `web/src/tour/` |
| GitHub Actions | CI y CD | sin instalación | `.github/workflows/` |
| Codespaces | Entorno reproducible y demos | Code → Codespaces → Create codespace | `.devcontainer/` |
| Terraform | Configuración de GitHub y Railway | binario de HashiCorp o Codespaces | `infra/terraform/` |
| Spec Kit | Specs, planes y tareas (SDD) | `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v1.0.6` | `.specify/`, `specs/` |
| Claude Code | Agente que ejecuta las skills | extensión de VS Code o CLI | `.claude/skills/`, `CLAUDE.md` |

## 11. Primera ejecución local

**Panel web y pruebas:**

```bash
git clone https://github.com/joeljorex/habitos-tracker.git
cd habitos-tracker
npm ci
npx playwright install chromium
npm test            # unitarias + e2e
npm run serve       # http://127.0.0.1:4173/  (demo@habitos.app / Habitos123)
```

**API (cuando exista el código de `api/`):**

```bash
cd api
cp .env.example .env          # ajustar credenciales de MySQL
docker-compose up -d
docker-compose exec app php artisan migrate
# verificar http://localhost:8000/api/health
```

**App (cuando exista el código de `app/`):** abrir `app/` en Android Studio, sincronizar Gradle y
apuntar la URL base a `http://10.0.2.2:8000` desde el emulador.

**Todo lo anterior sin instalar nada:** abrir el repositorio en GitHub Codespaces.
