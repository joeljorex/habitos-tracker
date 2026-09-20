# Entorno requerido para la liberación y el despliegue continuo

> Actividad 1.2 — CI/CD. Qué máquinas, servicios, permisos y datos hacen falta para que una versión
> viaje desde la computadora de un integrante hasta producción.

## 1. Los cuatro entornos

| Entorno | Para qué sirve | Dónde vive | Quién lo crea | Quién aprueba |
|---|---|---|---|---|
| Local | desarrollar y probar antes de subir | computadora del integrante o Codespaces | `devcontainer.json` / `npm install` | nadie |
| Integración (CI) | validar cada Pull Request | runners `ubuntu-latest` de GitHub | `.github/workflows/ci.yml` | automático |
| Staging | ensayar el despliegue con el paquete real | artefacto `github-pages` + Railway *staging* | `cd.yml` + Terraform | automático |
| Producción | lo que usa el usuario final | GitHub Pages + Railway *production* | `cd.yml` | un integrante, a mano |

## 2. Entorno local

| Requisito | Versión | Para qué |
|---|---|---|
| Node.js | 24 LTS | panel, pruebas unitarias, Playwright y lanzador de carga |
| npm | 11 | dependencias y scripts |
| Git | 2.5x | control de versiones y hooks |
| k6 | 2.2.0 | pruebas de carga |
| Docker Desktop | 29.x | stack local de SonarQube y contenedor del escáner |
| Terraform | 1.16.2 | infraestructura como código |
| PHP | 8.3 | API Laravel (cuando exista su código) |
| Java | 17 | compilación de la app Android (cuando exista su código) |

Todo eso ya viene instalado en **GitHub Codespaces**: `.devcontainer/devcontainer.json` declara la
imagen, las herramientas y los puertos (4173 para el panel, 8000 para la API), así que un integrante
nuevo trabaja sin instalar nada en su máquina.

```bash
git clone https://github.com/joeljorex/habitos-tracker.git
cd habitos-tracker
npm install            # instala dependencias y registra los hooks de husky
npm run serve          # panel en http://localhost:4173
npm run sonar:levantar # SonarQube en http://localhost:9000
```

## 3. Entorno de integración continua

- **Runners**: `ubuntu-latest` administrados por GitHub; no hay servidor propio que mantener.
- **Concurrencia**: un pipeline por rama; los PR viejos se cancelan solos al llegar un commit nuevo.
- **Cachés**: `actions/setup-node` con caché de npm, para que la instalación no domine el tiempo.
- **Herramientas que se instalan en el runner**: k6 (`grafana/setup-k6-action`), navegadores de
  Playwright, Terraform y el escáner de SonarQube.
- **Permisos**: los workflows corren con `contents: read`; solo el job que publica recibe
  `pages: write` e `id-token: write`.

## 4. Entornos de despliegue

### 4.1 Staging

- **Panel**: el artefacto `github-pages` construido en el mismo pipeline, publicado en el ambiente
  `staging` de GitHub. Se le corren las pruebas de humo de Playwright y, a petición, las de carga de
  k6 con `BASE_URL` apuntando ahí.
- **API**: proyecto de Railway con el ambiente `staging` y su propia base de datos MySQL.
- **Datos**: de prueba, generados por *seeders*; nunca se copian datos reales.

### 4.2 Producción

- **Panel**: GitHub Pages del repositorio, `https://joeljorex.github.io/habitos-tracker/`.
- **API**: ambiente `production` de Railway, con migraciones automáticas tras el health check.
- **App**: AAB firmado distribuido con Firebase App Distribution.
- **Puerta de entrada**: el ambiente `production` de GitHub exige la aprobación de un integrante
  antes de ejecutar el job de publicación.

## 5. Infraestructura como código

| Qué se declara | Archivo | Se aplica con |
|---|---|---|
| Protección de `main` y `develop`, checks obligatorios y revisiones | `infra/terraform/github.tf` | `terraform apply` |
| Ambientes `staging` y `production` con sus revisores | `infra/terraform/github.tf` | `terraform apply` |
| Proyecto, ambientes y servicio de Railway | `infra/terraform/railway.tf` | `terraform apply` |
| Stack local de análisis estático | `infra/sonarqube/docker-compose.yml` | `npm run sonar:levantar` |
| Entorno de desarrollo reproducible | `.devcontainer/devcontainer.json` | Codespaces |

```bash
cd infra/terraform
export GITHUB_TOKEN=$(gh auth token)
terraform init
terraform plan      # muestra qué cambiaría
terraform apply     # deja el repositorio como dice el código
```

## 6. Secretos y variables

Ningún secreto vive en el repositorio. Se guardan en **Settings → Secrets and variables → Actions**:

| Nombre | Tipo | Para qué | Quién lo usa |
|---|---|---|---|
| `GITHUB_TOKEN` | automático | publicar en Pages y comentar en los PR | `cd.yml` |
| `RAILWAY_TOKEN` | secreto | desplegar la API | `cd.yml` |
| `SONAR_TOKEN` | secreto | subir el análisis estático | `calidad.yml` |
| `SONAR_HOST_URL` | variable | dirección de la instancia de SonarQube | `calidad.yml` |
| `FIREBASE_APP_ID` y credenciales | secreto | distribuir la app Android | `cd.yml` |
| `ANDROID_KEYSTORE` (base64) y su contraseña | secreto | firmar el AAB | `cd.yml` |

En local, el token de SonarQube se pasa por variable de entorno (`$env:SONAR_TOKEN`) y nunca se
escribe en un archivo versionado; `.gitignore` incluye `coverage/`, `.scannerwork/` y `*.local`.

## 7. Cómo se promueve una versión

```
1. feature/*   commit  →  hook de pre-commit (unitarias + carga de humo)
2. Pull Request a develop  →  CI: unitarias, e2e, carga de humo, Terraform, specs
3. Revisión del otro integrante  →  merge a develop
4. Pull Request de release a main  →  CI completo
5. merge a main  →  CD: paquete → staging → smoke → aprobación → producción → verificación
```

El tiempo total del paso 5, medido en las ejecuciones del repositorio, es de alrededor de 6 minutos,
de los cuales la aprobación manual es el único paso que depende de una persona.
