# Parámetros de configuración de las herramientas

> Actividad 1.2 — CI/CD. Versiones exactas y valores con los que están configuradas las herramientas
> de liberación, pruebas de carga y análisis estático. Complementa a
> [parametros-configuracion.md](./parametros-configuracion.md), que cubre las herramientas de
> desarrollo de la primera unidad.

## 1. k6 — pruebas de carga

| Parámetro | Valor | Dónde se configura | Por qué |
|---|---|---|---|
| Versión | 2.2.0 | binario portable / `grafana/setup-k6-action@v1` | la misma versión en local y en la CI |
| Escenario de JAI | `ramping-vus`, 1 → 10 VUs, 55 s | `tests/carga/jai-prueba.js` | muestra el comportamiento mientras sube la concurrencia |
| Escenario de JHM | `constant-arrival-rate`, 12 iteraciones/s, 45 s | `tests/carga/jhm-prueba.js` | mantiene el ritmo aunque el servidor se ponga lento |
| VUs reservados / máximos (JHM) | 15 / 25 | `tests/carga/jhm-prueba.js` | k6 necesita ~13 activos para sostener el ritmo |
| Umbral principal | `http_req_duration p(95) < 5000 ms` | `options.thresholds` | objetivo de servicio de la actividad |
| Umbrales secundarios | `p(99) < 8000`, `http_req_failed < 1 %`, `checks > 99 %` | `options.thresholds` | controlan la cola larga y la corrección del contenido |
| Estadísticos del resumen | avg, min, med, p90, p95, p99, max | `options.summaryTrendStats` | obtener la mayor cantidad de métricas |
| Objetivo | `BASE_URL`, por defecto `http://127.0.0.1:4173` | variable de entorno | la misma prueba sirve para local, staging y producción |
| Salida | `.md` y `.json` en `tests/carga/resultados/` | `handleSummary` en `tests/carga/resumen.js` | evidencia comiteable y datos crudos |
| Puerto del lanzador | 4180 | `scripts/carga.mjs` | no choca con el 4173 de desarrollo |

## 2. SonarQube — análisis estático

| Parámetro | Valor | Dónde se configura | Por qué |
|---|---|---|---|
| Edición e imagen | `sonarqube:community` | `infra/sonarqube/docker-compose.yml` | gratuita y suficiente para el análisis del curso |
| Base de datos | `postgres:17-alpine` | mismo archivo | la imagen de SonarQube no debe usar su base embebida en uso real |
| Puerto | `9000:9000` | mismo archivo | acceso al tablero en <http://localhost:9000> |
| Credenciales iniciales | `admin` / `admin`, cambio obligatorio al primer acceso | SonarQube | evita dejar la instalación abierta |
| Volúmenes | `datos_sonar`, `extensiones_sonar`, `logs_sonar`, `datos_db` | compose | los análisis sobreviven a reiniciar los contenedores |
| Chequeo de salud | `GET /api/system/status` cada 20 s | compose | el escaneo no arranca antes de tiempo |
| Escáner | `sonarsource/sonar-scanner-cli:latest` en contenedor | `scripts/sonar-escaneo.ps1` / `.sh` | no hace falta instalar Java ni el escáner |
| Red del escaneo | `habitos-sonarqube_default` | scripts de escaneo | el contenedor alcanza al servidor por su nombre |
| Proyectos | `habitos-tracker-jai`, `habitos-tracker-jhm` | creados por API o interfaz | cada integrante analiza el código de su PR |
| Código analizado | `web/src`, `scripts` | `sonar-project.properties` | el código propio del proyecto |
| Pruebas | `tests/**` | `sonar-project.properties` | se analizan, pero no cuentan como código de producción |
| Exclusiones | `web/vendor/**`, `node_modules/**`, `*.min.js` | `sonar-project.properties` | no se mide código de terceros |
| Cobertura | `coverage/lcov.info` | `sonar.javascript.lcov.reportPaths` | el tablero muestra también qué tanto prueban las pruebas |

## 3. husky — control previo al commit

| Parámetro | Valor | Dónde | Por qué |
|---|---|---|---|
| Versión | 9.1.x | `devDependencies` de `package.json` | hooks en el repositorio, versionados |
| Instalación | `npm run prepare` (`husky`) | `package.json` | se registra solo al hacer `npm install` |
| Hook | `.husky/pre-commit` | repositorio | corre pruebas unitarias y la carga de humo |
| Comportamiento sin k6 | avisa y deja pasar el commit | `.husky/pre-commit` | no bloquea a quien aún no instala k6 |
| Cómo saltarlo | `git commit --no-verify` | git | commits de documentación o urgencias |

## 4. GitHub Actions — pipeline

| Parámetro | Valor | Dónde | Por qué |
|---|---|---|---|
| Runner | `ubuntu-latest` | todos los workflows | sin servidor propio que mantener |
| Node | 24 con caché de npm | `actions/setup-node@v7` | misma versión que en desarrollo |
| Acciones usadas | `checkout@v7`, `setup-node@v7`, `setup-k6-action@v1`, `upload-artifact@v5`, `upload-pages-artifact@v5`, `sonarqube-scan-action@v6` | workflows | versiones fijas para que el pipeline sea reproducible |
| Permisos por defecto | `contents: read` | workflows | principio de menor privilegio |
| Permisos del despliegue | `pages: write`, `id-token: write` | `cd.yml` | solo el job que publica los necesita |
| Concurrencia | una ejecución por rama, cancelando las anteriores en PR | `ci.yml` | ahorra minutos de runner |
| Disparadores de carga | PR a `develop`/`main`, push a `main`, manual | `carga.yml` | humo en cada PR, pruebas completas al liberar |
| Retención de artefactos | 30 días | `carga.yml` | conservar evidencia de cada corrida |
| Ambientes protegidos | `staging` y `production` (este último con revisor) | Terraform | la aprobación manual antes de producción |

## 5. Docker y Terraform

| Parámetro | Valor | Dónde |
|---|---|---|
| Docker Engine | 29.x con Compose v5 | máquina local |
| Nombre del stack | `habitos-sonarqube` | `infra/sonarqube/docker-compose.yml` |
| Terraform | 1.16.2 | `.devcontainer/devcontainer.json` y CI |
| Proveedor de GitHub | `integrations/github ~> 6.0` | `infra/terraform/versions.tf` |
| Proveedor de Railway | `terraform-community-providers/railway ~> 0.6.2` | `infra/terraform/versions.tf` |
| Checks obligatorios en `main` | los jobs de CI | `infra/terraform/github.tf` |
| Aprobaciones requeridas | 1 (el otro integrante) | `infra/terraform/github.tf` |

## 6. Comandos de referencia

```bash
# Pruebas de carga
npm run carga:smoke                 # 6 VUs, 10 s (lo que corre el hook)
npm run carga:jai                   # prueba de Joel
npm run carga:jhm                   # prueba de Jorge
k6 run -e BASE_URL=https://joeljorex.github.io/habitos-tracker tests/carga/jai-prueba.js

# Análisis estático
npm run sonar:levantar              # docker compose up -d
./scripts/sonar-escaneo.sh habitos-tracker-jai "Habitos Tracker - JAI"
npm run sonar:apagar

# Infraestructura
cd infra/terraform && terraform init && terraform apply
```
