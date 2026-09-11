# Proyecto de la API en Railway — spec 003 (contracts/pipelines.md §4).
#
# Opcional: con habilitar_railway = false (defecto) no se crea ningún recurso en Railway.
# Credencial: variable de entorno RAILWAY_TOKEN con un token de cuenta o de workspace (crear
# proyectos exige ese alcance). No confundir con el secreto RAILWAY_TOKEN de GitHub Actions,
# que es un token de PROYECTO y solo sirve para desplegar desde cd.yml.

provider "railway" {
  # Terraform configura el proveedor aunque todos sus recursos tengan count = 0, y este
  # proveedor falla al configurarse si no encuentra un token. Con Railway desactivado se pasa
  # un valor de relleno (no es un secreto y no se usa: no hay recursos de Railway), así
  # `plan` y `apply` funcionan solo con GITHUB_TOKEN. Con Railway activado, token = null hace
  # que el proveedor lea RAILWAY_TOKEN del entorno.
  token = var.habilitar_railway ? null : "railway-desactivado"
}

locals {
  instancias_railway = var.habilitar_railway ? 1 : 0
}

resource "railway_project" "api" {
  count = local.instancias_railway

  name        = var.railway_proyecto
  description = "API Laravel de Hábitos Tracker (spec 003). Gestionado con Terraform."
}

# Ambiente adicional. El ambiente por defecto del proyecto (production) lo crea Railway.
resource "railway_environment" "staging" {
  count = local.instancias_railway

  name       = "staging"
  project_id = railway_project.api[0].id
}

# Servicio de la API. Se despliega desde cd.yml con `railway up` (sin conectar el repositorio de
# GitHub, para no duplicar despliegues); la raíz /api hace que Railway construya api/Dockerfile.
#
# Pendiente manual (el proveedor 0.6.x no expone estos ajustes y el archivo railway.json de
# "config as code" está deprecado por Railway): en Settings → Deploy del servicio, configurar
#   - Pre-deploy command: php artisan migrate --force
#   - Healthcheck path:   /api/health
# Ver README.md → "Migraciones de la API".
resource "railway_service" "api" {
  count = local.instancias_railway

  name           = "api"
  project_id     = railway_project.api[0].id
  root_directory = "/api"
}
