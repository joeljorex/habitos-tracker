# Salidas — spec 003 (contracts/pipelines.md §4).

output "ramas_protegidas" {
  description = "Patrones de rama con protección aplicada."
  value       = sort([for regla in github_branch_protection.ramas : regla.pattern])
}

output "checks_requeridos" {
  description = "Checks que deben pasar para integrar en una rama protegida."
  value       = var.checks_requeridos
}

output "ambientes" {
  description = "Ambientes de despliegue gestionados por Terraform (github-pages lo administra GitHub)."
  value = [
    github_repository_environment.staging.environment,
    github_repository_environment.production.environment,
  ]
}

output "revisores_produccion" {
  description = "Revisores del ambiente production con su ID numérico de GitHub."
  value       = { for usuario, datos in data.github_user.revisores : usuario => datos.id }
}

output "url_panel" {
  description = "URL pública esperada del panel web en GitHub Pages."
  value       = "https://${lower(var.github_owner)}.github.io/${var.repositorio}/"
}

output "railway_proyecto_id" {
  description = "ID del proyecto de Railway (null si habilitar_railway = false)."
  value       = one(railway_project.api[*].id)
}

output "railway_servicio_api_id" {
  description = "ID del servicio api en Railway (null si habilitar_railway = false)."
  value       = one(railway_service.api[*].id)
}

output "railway_ambiente_staging_id" {
  description = "ID del ambiente staging en Railway (null si habilitar_railway = false)."
  value       = one(railway_environment.staging[*].id)
}
