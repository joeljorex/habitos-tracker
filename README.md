# Hábitos Tracker

[![CI](https://github.com/joeljorex/habitos-tracker/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/joeljorex/habitos-tracker/actions/workflows/ci.yml)
[![CD](https://github.com/joeljorex/habitos-tracker/actions/workflows/cd.yml/badge.svg?branch=main)](https://github.com/joeljorex/habitos-tracker/actions/workflows/cd.yml)
[![Abrir en GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/joeljorex/habitos-tracker)

Seguimiento de hábitos con rachas: el usuario define hábitos (por ejemplo, "tomar agua" o "leer
20 min"), los marca como hechos cada día y ve su racha de días seguidos. La app móvil funciona
offline-first y sincroniza con una API; el panel web permite consultarlos y gestionarlos desde el
navegador.

**Panel web:** https://joeljorex.github.io/habitos-tracker/ (se publica con cada release) ·
cuenta de demostración `demo@habitos.app` / `Habitos123`.

## Estructura del repositorio

```text
habitos-tracker/
├── app/             # App móvil (Kotlin / Jetpack Compose / Room)
├── api/             # API REST (Laravel 13 / MySQL 8.4 / Sanctum)
├── web/             # Panel web (HTML + JS con módulos ES, guía con driver.js)
├── tests/           # Pruebas del panel: unit/ (node --test) y e2e/ (Playwright)
├── specs/           # Specs de Spec-Driven Development (Spec Kit)
├── docs/            # Planeación, pruebas, CI/CD, despliegue, SDD y monitoreo
├── infra/monitoreo/ # Stack de monitoreo (Prometheus, Grafana, Alertmanager)
├── infra/sonarqube/ # Stack local de análisis estático
├── infra/terraform/ # Infraestructura como código (GitHub + Railway)
├── scripts/         # Servidor estático y gate de specs
├── .devcontainer/   # Entorno de GitHub Codespaces
├── .specify/        # Configuración y plantillas de Spec Kit
├── .claude/skills/  # Skills de Spec Kit y del proyecto
└── .github/         # Workflows de CI/CD y plantilla de PR
```

## Componentes

| Componente | Stack | Estado |
|---|---|---|
| Panel web | HTML, CSS, JavaScript, driver.js | Funcional (specs 001, 002 y 004) |
| Observabilidad del panel | métricas, bitácora, trazas y auditoría, sin dependencias | Funcional (specs 005, 006 y 007) |
| Monitoreo del entorno | Prometheus, Grafana, Blackbox exporter, Alertmanager | Activo (spec 005) |
| Seguridad de dependencias | OSV-Scanner, Dependabot, `npm audit` | Activo (spec 008) |
| Pruebas automáticas | Playwright, `node --test` | En CI en cada PR |
| CI/CD | GitHub Actions, GitHub Pages | Activo (spec 003) |
| Infraestructura | Codespaces, Terraform | Activo (spec 003) |
| API backend | Laravel, MySQL, Sanctum | Por iniciar (spec por asignar) |
| App móvil | Kotlin, Compose, Room, Retrofit, WorkManager | Por iniciar (specs por asignar) |

## Cómo levantar el proyecto

**Opción 1 — Codespaces (sin instalar nada):** botón "Abrir en GitHub Codespaces" de arriba.

**Opción 2 — local (Node 24):**

```bash
npm ci
npx playwright install chromium
npm test            # pruebas unitarias + end-to-end
npm run serve       # http://127.0.0.1:4173/
```

**API (cuando exista el código):** `cd api && cp .env.example .env && docker-compose up -d && docker-compose exec app php artisan migrate`.

**App (cuando exista el código):** abrir `app/` en Android Studio Quail 3.

## Flujo de trabajo

1. Funcionalidad nueva → spec con Spec Kit (`/speckit-specify`, `/speckit-plan`, `/speckit-tasks`).
2. Rama `feature/*` desde `develop` y PR con la plantilla.
3. CI en verde + aprobación del otro integrante → merge a `develop`.
4. Release `develop → main` → CD publica el panel (con aprobación de producción).

## Documentación

| Documento | Contenido |
|---|---|
| [parametros-configuracion.md](docs/parametros-configuracion.md) | Parámetros de cada herramienta y plan de instalación |
| [plan-de-pruebas.md](docs/plan-de-pruebas.md) | Alcance, herramientas, entornos y ejecución de pruebas |
| [casos-de-prueba.md](docs/casos-de-prueba.md) | Casos CP-01 a CP-13 y casos de referencia de rachas |
| [flujo-cicd.md](docs/flujo-cicd.md) | Branching, commits, PRs, CI y protección de ramas |
| [estrategia-despliegue.md](docs/estrategia-despliegue.md) | CD, ambientes, secretos y rollback |
| [sdd-proposal.md](docs/sdd-proposal.md) | Propuesta de SDD (Kiro vs Spec Kit) y skills |
| [sdd-implementation.md](docs/sdd-implementation.md) | Guía de uso de SDD y seguimiento |
| [guia-instalacion-speckit.md](docs/guia-instalacion-speckit.md) | Guía de seguimiento de instalación de Spec Kit |
| [ingenieria-inversa.md](docs/ingenieria-inversa.md) | Estado actual, diagrama ER, arquitectura y hallazgos |
| [trazabilidad.md](docs/trazabilidad.md) | Requisito → spec → caso → prueba → PR |
| [infra/terraform/README.md](infra/terraform/README.md) | Uso de Terraform |

### Liberación y monitoreo

| Documento | Contenido |
|---|---|
| [justificacion-pipeline.md](docs/justificacion-pipeline.md) | Por qué el pipeline es así y qué compuerta hace cada cosa |
| [entorno-liberacion.md](docs/entorno-liberacion.md) | Los cuatro entornos y qué hace falta en cada uno |
| [niveles-de-servicio.md](docs/niveles-de-servicio.md) | Disponibilidad, latencia y presupuesto de error acordados |
| [parametros-herramientas-cicd.md](docs/parametros-herramientas-cicd.md) | Parámetros de k6, SonarQube, husky y GitHub Actions |
| [plan-pruebas-carga.md](docs/plan-pruebas-carga.md) · [resultados-carga.md](docs/resultados-carga.md) | Pruebas de carga con k6 y sus resultados |
| [guia-sonarqube-local.md](docs/guia-sonarqube-local.md) · [analisis-estatico.md](docs/analisis-estatico.md) | Análisis estático con SonarQube |
| [sdd-observabilidad.md](docs/sdd-observabilidad.md) | Por qué los módulos de observabilidad se hicieron con SDD |
| [monitoreo-entorno.md](docs/monitoreo-entorno.md) | Métricas, alarmas, alertas y cómo se comprobó que se disparan |
| [visor-trazabilidad.md](docs/visor-trazabilidad.md) | Cómo se lee una traza y cómo se usa en soporte |
| [visor-auditoria.md](docs/visor-auditoria.md) | Qué se audita, cómo funciona la cadena de hashes y su alcance |
| [seguridad-dependencias.md](docs/seguridad-dependencias.md) | Análisis de vulnerabilidades y actualización automática |
| [infra/monitoreo/README.md](infra/monitoreo/README.md) | Cómo levantar el stack de monitoreo |

## Equipo

- Joel Armando Ibarra Rubalcava
- Jorge Humberto Martínez Delgado

Universidad Tecnológica de Hermosillo · IDGS 10-2 · Planeación del Proceso de Desarrollo de Software.
