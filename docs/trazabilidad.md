# Matriz de trazabilidad

Relaciona cada requisito recuperado en la [ingeniería inversa](./ingenieria-inversa.md) con su
spec, sus casos de prueba, la prueba automatizada que lo verifica y el PR que lo implementa.

**Leyenda**: ✅ implementado y probado · 🟡 implementado parcialmente (solo en un cliente) ·
⏳ planificado (backlog).

> La columna "Estado previsto" indica el estado esperado al integrar todos los PRs de esta
> entrega (specs 001–004). Se actualiza con el estado real en cada PR posterior.

## 1. Requisitos funcionales

| RF | Requisito | Spec | Casos | Prueba automatizada | PR | Estado previsto |
|---|---|---|---|---|---|---|
| RF-01 | Registro e inicio de sesión | 001 (US1) | CP-05, CP-10 | `tests/e2e/autenticacion.spec.js` | `feature/panel-web-e2e-tour` | 🟡 panel (simulado); API con Sanctum en 005 |
| RF-02 | Crear hábito válido | 001 (US2) | CP-01, CP-07, CP-09 | `tests/e2e/habitos.spec.js`, `tests/unit/habitos.test.mjs` | `feature/panel-web-e2e-tour` | 🟡 panel; app y API pendientes |
| RF-03 | Marcar completado una vez al día | 001 (US3) | CP-02 | `tests/e2e/habitos.spec.js`, `tests/unit/habitos.test.mjs` | `feature/panel-web-e2e-tour` | 🟡 panel |
| RF-04 | Racha actual y máxima | 004 | CP-04, CP-13, V01–V13 | `tests/e2e/rachas.spec.js`, `tests/unit/rachas.test.mjs` | `feature/004-logica-rachas` | 🟡 panel; los mismos casos V01–V13 aplican a app y API |
| RF-05 | Sin conexión y sincronización | 006 (backlog) | CP-03 | Appium (pendiente) | — | ⏳ |
| RF-06 | Eliminar hábito con sus registros | 001 (US4) | CP-06 | `tests/e2e/habitos.spec.js`, `tests/unit/habitos.test.mjs` | `feature/panel-web-e2e-tour` | 🟡 panel; propagación al backend en 006 |
| RF-07 | API REST `/auth`, `/habits`, `/habits/{id}/logs` | 005 (backlog) | — | PHPUnit (pendiente) | — | ⏳ |
| RF-08 | Endpoint de salud `/api/health` | 003 (US2) | — | job `desplegar-api` de `cd.yml` | `feature/003-infraestructura-cicd` | ⏳ se activa con la API |
| RF-09 | Editar hábito | 006 (backlog) | CP-03 | — | — | ⏳ |
| RF-10 | Distribuir builds de la app | 003 (US2) | — | job `construir-app` de `cd.yml` | `feature/003-infraestructura-cicd` | ⏳ se activa con la app |
| RF-11 | Panel web | 001 | CP-08, CP-10 | `tests/e2e/*.spec.js` (smoke contra producción) | `feature/panel-web-e2e-tour` | ✅ |
| RF-12 | Guía interactiva | 002 | CP-11, CP-12 | `tests/e2e/tour.spec.js`, `tests/unit/tour.test.mjs` | `feature/panel-web-e2e-tour` | ✅ |

## 2. Requisitos no funcionales

| RNF | Requisito | Spec / artefacto | Verificación | PR | Estado previsto |
|---|---|---|---|---|---|
| RNF-01 | minSdk 24 / targetSdk 36 | `parametros-configuracion.md` | build de la app (job `app`) | — | ⏳ |
| RNF-02 | Laravel 13, MySQL 8.4, Docker | `parametros-configuracion.md` | job `api` | — | ⏳ |
| RNF-03 | Cobertura ≥ 70 % en lógica crítica | 004 (FR-011: ≥ 90 % en rachas) | `npm run test:cobertura` | `feature/004-logica-rachas` | ✅ rachas |
| RNF-04 | La CI bloquea merges en rojo | 003 (US1, US4) | checks requeridos + protección de ramas | `feature/003-infraestructura-cicd` | ✅ |
| RNF-05 | Secretos fuera del repositorio | 003 (FR-013), constitución V | `.gitignore`, GitHub Secrets | `feature/sdd-speckit`, `feature/003-infraestructura-cicd` | ✅ |
| RNF-06 | Staging, smoke y aprobación manual | 003 (US2) | `cd.yml` (ambientes `staging`, `production`) | `feature/003-infraestructura-cicd` | ✅ panel web |
| RNF-07 | Branching y Conventional Commits | constitución, 003 (US4) | protección de ramas (Terraform) | `feature/003-infraestructura-cicd` | ✅ |
| RNF-08 | Entornos reproducibles | 003 (US3) | Codespaces (`.devcontainer/`) | `feature/003-infraestructura-cicd` | ✅ |

## 3. Casos de prueba → requisito → prueba

| Caso | Requisito | Cliente | Automatizado en |
|---|---|---|---|
| CP-01 | RF-02 | Web · App | `habitos.spec.js` (`@smoke`) |
| CP-02 | RF-03 | Web · App | `habitos.spec.js` |
| CP-03 | RF-05, RF-09 | App | Appium (pendiente) |
| CP-04 | RF-04 | Web · App | `rachas.spec.js` |
| CP-05 | RF-01 | Web · App | `autenticacion.spec.js` |
| CP-06 | RF-06 | Web · App | `habitos.spec.js` |
| CP-07 | RF-02 | Web | `habitos.spec.js` |
| CP-08 | RF-11 | Web | `habitos.spec.js` |
| CP-09 | RF-02 | Web | `habitos.spec.js` |
| CP-10 | RF-01, RF-11 | Web | `autenticacion.spec.js` (`@smoke`) |
| CP-11 | RF-12 | Web | `tour.spec.js` |
| CP-12 | RF-12 | Web | `tour.spec.js` |
| CP-13 | RF-04 | Web | `rachas.spec.js` |

## 4. Cobertura de la trazabilidad

| Indicador | Valor |
|---|---|
| Requisitos funcionales con spec | 9 de 12 (RF-05, RF-07 y RF-09 en backlog) |
| Requisitos funcionales con prueba automatizada | 7 de 12 |
| Casos de prueba automatizados | 12 de 13 (CP-03 requiere la app Android) |
| Requisitos no funcionales verificados automáticamente | 6 de 8 |

> Mantener esta matriz es parte de la definición de "hecho" de cada PR (plantilla de PR y skill
> `nuevo-modulo-sdd`).
