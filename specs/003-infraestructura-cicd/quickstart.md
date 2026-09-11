# Quickstart: validar la infraestructura y los pipelines

## Prerrequisitos

- Git, Node 24 y (para validar HCL) Terraform ≥ 1.9 y `actionlint`, **o** un Codespace del
  repositorio (ya los trae).
- Para aplicar Terraform: token de GitHub con permisos de administración del repositorio.

## 1. Validación local (sin credenciales)

```bash
actionlint                                   # workflows sin errores
node scripts/verificar-specs.mjs             # todas las specs tienen spec/plan/tasks
cd infra/terraform
terraform fmt -check -recursive
terraform init -backend=false
terraform validate                           # "Success! The configuration is valid."
```

**Resultado esperado**: los tres comandos terminan con código 0.

## 2. Integración continua (US1)

1. Crear una rama `feature/prueba-ci` desde `develop` y abrir un PR hacia `develop`.
2. En la pestaña **Checks** deben aparecer los 6 jobs; los de componentes sin código aparecen
   como *skipped*.
3. Romper una prueba a propósito y hacer push: el check `Web - unit + e2e (Playwright)` queda en
   rojo y el botón de merge se bloquea (requiere la protección de la sección 5).
4. Descargar el artefacto `playwright-report` desde el resumen de la ejecución.

## 3. Despliegue continuo (US2)

1. Una sola vez: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Abrir un PR `develop → main`, esperar los checks y hacer merge.
3. En **Actions → CD** avanzar: `CI completo` → `Construir paquete del panel` →
   `Smoke tests (staging)` → `Aprobación de producción` (pulsar **Review deployments → Approve**)
   → `Publicar en GitHub Pages` → `Verificar producción`.
4. Abrir `https://joeljorex.github.io/habitos-tracker/` y comprobar el panel.

**Rollback**: en **Actions → CD**, abrir la ejecución del último commit bueno de `main` y pulsar
**Re-run all jobs** (o `git revert` del commit defectuoso y merge a `main`).

## 4. Codespaces (US3)

1. En GitHub: **Code → Codespaces → Create codespace on develop**.
2. Esperar a que termine `post-create.sh` y ejecutar:

```bash
node -v && php -v && terraform -version && specify version
npm test
npm run serve    # abrir el puerto 4173 ("Panel web") desde la pestaña Ports
```

## 5. Terraform aplicado (US4)

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # ajustar revisores
export GITHUB_TOKEN=<token con admin del repo>   # PowerShell: $env:GITHUB_TOKEN="..."
terraform init
terraform plan      # revisar: protección de main/develop, ambientes staging y production
terraform apply
```

**Resultado esperado**: en **Settings → Branches** aparecen las reglas de `main` y `develop` con
los 6 checks requeridos, y en **Settings → Environments**, `staging` y `production`.
