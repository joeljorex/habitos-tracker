# Research: Infraestructura como código y pipelines CI/CD

Fase 0 de `/speckit-plan`. Cada decisión sigue el formato Decisión / Razón / Alternativas.

## R1. Plataforma de CI/CD

- **Decisión**: GitHub Actions.
- **Razón**: nativa del repositorio, gratuita para repos públicos, ya elegida en
  `docs/parametros-configuracion.md`; integra checks con la protección de ramas y ambientes con
  aprobación.
- **Alternativas**: Jenkins (requiere servidor propio y mantenimiento), Travis CI (plan gratuito
  limitado), GitLab CI (implica migrar el repositorio).

## R2. Ejecutar solo lo que existe en el monorepo

- **Decisión**: job `detectar` que revisa archivos marcadores y expone outputs; cada job de
  componente se condiciona con `if: needs.detectar.outputs.<x> == 'true'`.
- **Razón**: un job omitido por `if` se reporta como *skipped*, que GitHub acepta como exitoso
  en los checks requeridos. Con filtros `paths` el workflow ni siquiera se dispararía y los checks
  requeridos quedarían "pendientes" para siempre, bloqueando el merge.
- **Alternativas**: `if: false` fijo (estado actual: nunca ejecuta nada), filtros `paths` (problema
  anterior), `hashFiles()` en el `if` del job (no está disponible a nivel de job).

## R3. Reutilizar la CI dentro del CD

- **Decisión**: `ci.yml` declara `workflow_call` con outputs; `cd.yml` la invoca como primera etapa.
- **Razón**: una sola definición de pruebas (sin duplicar YAML) y garantía de que lo que se
  despliega pasó exactamente las mismas verificaciones.
- **Alternativas**: copiar los jobs en `cd.yml` (duplicación) o encadenar con `workflow_run`
  (más difícil de seguir y de aprobar).

## R4. Hosting del panel web

- **Decisión**: GitHub Pages, desplegado con `actions/upload-pages-artifact` + `actions/deploy-pages`.
- **Razón**: gratuito, en la misma plataforma, sin credenciales extra (OIDC con `id-token: write`)
  y con historial de despliegues por ambiente. El panel es estático, así que no necesita servidor.
- **Alternativas**: Railway (tiene costo por uso y está pensado para la API), Netlify/Vercel
  (otra cuenta y otro token que administrar).

## R5. Staging del panel web

- **Decisión**: staging efímero: el job `smoke-staging` descarga el mismo paquete que se va a
  publicar, lo sirve con `scripts/serve.mjs` dentro del runner y ejecuta las pruebas `@smoke`.
- **Razón**: Pages admite un solo sitio por repositorio; así se prueba el artefacto exacto sin
  una segunda infraestructura.
- **Alternativas**: segundo repositorio solo para staging (más mantenimiento) o previews por PR
  en otro proveedor (fuera de alcance).

## R6. Aprobación manual

- **Decisión**: ambiente `production` con revisores obligatorios en un job de aprobación previo
  al job que publica en el ambiente `github-pages`.
- **Razón**: `github-pages` lo administra GitHub automáticamente; separar la aprobación evita
  conflictos con esa configuración y deja la regla declarada en Terraform.
- **Alternativas**: poner revisores en `github-pages` directamente (se pisa con la gestión
  automática) o aprobar con un comentario manual (no auditable).

## R7. Infraestructura como código

- **Decisión**: Terraform con los proveedores `integrations/github` (oficial) y
  `terraform-community-providers/railway` (comunitario, detrás de `habilitar_railway = false`).
- **Razón**: multi-proveedor con un solo lenguaje (lo que pide la asignatura: "terraform
  multivendor-cloud"); el proveedor de GitHub reemplaza la configuración manual de ramas y
  ambientes.
- **Alternativas**: Pulumi (requiere un lenguaje de programación adicional y una cuenta),
  configuración manual documentada (no reproducible), `gh api` en scripts (imperativo, sin plan).

## R8. Estado de Terraform

- **Decisión**: backend local; `*.tfstate` ignorado por git.
- **Razón**: alcance académico con un solo operador (el dueño del repositorio).
- **Alternativas**: HCP Terraform (gratuito, pero otra cuenta), backend S3/GCS (costo y credenciales).

## R9. Entorno de desarrollo en la nube

- **Decisión**: GitHub Codespaces con `devcontainer.json`: imagen oficial de Node y features
  oficiales (PHP, Python, Terraform, Docker-in-Docker, GitHub CLI) más `post-create.sh`.
- **Razón**: menos mantenimiento que un Dockerfile propio; las features están versionadas y
  probadas por la comunidad de devcontainers.
- **Alternativas**: Dockerfile propio (más control, más mantenimiento), Gitpod (otra plataforma).

## R10. Verificación estática

- **Decisión**: `actionlint` para los workflows y `terraform fmt/validate` para HCL, ejecutados
  localmente antes del PR y en CI.
- **Razón**: detectan errores de sintaxis y expresiones antes de gastar minutos de runner.
- **Alternativas**: solo probar "en vivo" en GitHub (ciclo de retroalimentación lento).
