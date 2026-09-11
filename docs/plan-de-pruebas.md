# Plan de Pruebas

## Alcance

| Nivel | Qué se prueba | Herramienta | Cliente |
|---|---|---|---|
| Unitarias | Dominio del panel: validaciones de hábitos, marcar como hecho (idempotencia), eliminar en cascada, resolución de pasos de la guía | `node --test` | Panel web |
| Unitarias | Lógica de rachas y validaciones | JUnit | App |
| Unitarias / Feature | Endpoints contra MySQL | PHPUnit | API |
| Integración | Sincronización Room – API, persistencia offline | JUnit + MockWebServer | App |
| End-to-end | Flujos completos: acceso, crear, validar, marcar, eliminar, guía | Playwright | Panel web |
| End-to-end | Flujos completos en emulador o dispositivo | Appium | App |
| Smoke | Acceso y validación básica contra staging y producción | Playwright (`@smoke`) | Panel web |
| Estáticas | Workflows, Terraform y estructura de specs | actionlint · terraform validate · verificar-specs | Repositorio |

## Herramientas y justificación

### Panel web: Playwright

Espera automática de elementos, reloj simulado (`page.clock`) para las pruebas que dependen de la
fecha, emulación de móvil, reporte HTML y *trace viewer*, ejecución gratuita en GitHub Actions y
Playwright MCP para que un agente de IA explore el panel (skill `caso-de-prueba-e2e`).

| Criterio | Playwright | Selenium | Cypress | Katalon |
|---|---|---|---|---|
| Opera sobre el DOM web | Sí | Sí | Sí | Sí |
| Simular fechas | `page.clock` integrado | manual | `cy.clock` | manual |
| Emulación móvil | dispositivos | limitada | solo tamaño | vía Appium |
| Reporte y trazas | HTML + trace viewer | externo | video/capturas | incluido |
| Costo en CI | gratis | gratis | paralelo de pago | licencia de Runtime Engine |

### App nativa: Appium (no Selenium ni Katalon)

Selenium automatiza navegadores sobre el DOM de una página HTML y no puede operar una app nativa
de Android, que expone un árbol de vistas (Views/Compose). Katalon usa por dentro Selenium (web) y
Appium (móvil), así que no aporta una alternativa distinta. Appium extiende el mismo protocolo
**WebDriver** hacia elementos nativos de Android, incluidos los `testTag` de Jetpack Compose.

> **Corrección respecto a la versión anterior:** `./gradlew connectedDebugAndroidTest` ejecuta
> las pruebas instrumentadas de Android (Espresso / Compose UI Test) en un emulador; **no**
> ejecuta Appium. Las pruebas de Appium viven en un proyecto aparte (por ejemplo `app-e2e/`, con
> el cliente Java de Appium y JUnit) y se ejecutan contra un servidor Appium con el APK instalado.

## Entornos

| Entorno | Descripción |
|---|---|
| Local | Node 24; `npm test` levanta el servidor estático y ejecuta todo |
| Codespaces | Mismo comando; el navegador de pruebas ya viene instalado |
| CI (GitHub Actions) | Job `Web - unit + e2e (Playwright)` en cada PR; publica el reporte como artefacto `playwright-report` |
| Staging efímero | El CD sirve el paquete a publicar dentro del runner y ejecuta los `@smoke` |
| Producción | `@smoke` contra `https://joeljorex.github.io/habitos-tracker/` después de cada despliegue |

## Ejecución del test suite

**Panel web:**

```bash
npm ci
npx playwright install chromium          # en Linux/CI: --with-deps chromium
npm run test:unit                        # node --test (dominio)
npm run test:e2e                         # Playwright: proyectos escritorio y movil
npm test                                 # ambos
npm run test:smoke                       # solo @smoke
SERVE_DIR=_site npm run test:smoke       # smoke contra otra carpeta (staging del CD)
BASE_URL=https://joeljorex.github.io/habitos-tracker/ npm run test:smoke   # contra producción
npx playwright show-report               # reporte HTML
```

**API (cuando exista):** `docker-compose exec app php artisan test`

**App (cuando exista):**

```bash
cd app
./gradlew testDebugUnitTest              # unitarias (JUnit)
./gradlew connectedDebugAndroidTest      # instrumentadas (Espresso / Compose UI Test)
appium &                                 # servidor Appium para las e2e
./gradlew :app-e2e:test                  # e2e con Appium (proyecto app-e2e)
```

Todos estos comandos se ejecutan automáticamente en `.github/workflows/ci.yml`.

## Criterios de entrada, salida y aceptación

- **Entrada:** la funcionalidad tiene spec, plan y tareas (check `SDD - Specs completas`).
- **Salida de un PR:** todos los checks en verde y la aprobación del otro integrante.
- **Aceptación de release:** smoke tests en verde en staging y en producción.
- Cada caso web `CP-xx` tiene al menos una prueba automatizada cuyo título empieza con su ID.
- Cobertura mínima del 70 % en la lógica de negocio crítica (rachas y sincronización).

## Trazabilidad de la suite

| Archivo | Cubre |
|---|---|
| `tests/e2e/autenticacion.spec.js` | CP-05, CP-10 |
| `tests/e2e/habitos.spec.js` | CP-01, CP-02, CP-06, CP-07, CP-08, CP-09 |
| `tests/e2e/tour.spec.js` | CP-11, CP-12 |
| `tests/unit/habitos.test.mjs` | Dominio de hábitos (spec 001, FR-003 a FR-008) |
| `tests/unit/tour.test.mjs` | Resolución y registro de pasos de la guía (spec 002) |

## Mantenimiento

- Casos nuevos con la skill `caso-de-prueba-e2e`; pasos nuevos de la guía con `paso-tour-driverjs`.
- Prohibido `waitForTimeout`: solo aserciones con reintento automático.
- Si cambia un `data-testid` o un texto del contrato, se actualizan el contrato y las pruebas en el
  mismo PR.

## Resultados de referencia

| Ejecución (2026-09-11 · Windows 11 · Node 24) | Unitarias | End-to-end | Resultado |
|---|---|---|---|
| `npm test` | 48 / 48 | 34 / 34 (17 escritorio + 17 móvil) | ✅ |
| `npm run test:smoke` con servidor local | — | 4 / 4 | ✅ |
| `npm run test:smoke` con `BASE_URL=…/habitos-tracker/` (simula GitHub Pages) | — | 4 / 4 | ✅ |

Las pruebas unitarias se escribieron primero y fallaron antes de implementar el dominio (TDD).
En CI el resultado aparece en el check `Web - unit + e2e (Playwright)` de cada PR, con el reporte
HTML como artefacto `playwright-report`.
