# Variables — spec 003 (contracts/pipelines.md §4).
# Cambiar un valor por defecto de esta tabla es un cambio de contrato: se actualiza el
# contrato en el mismo PR. Las credenciales NO son variables: se leen de GITHUB_TOKEN y
# RAILWAY_TOKEN en el entorno.

variable "github_owner" {
  description = "Usuario u organización dueña del repositorio en GitHub."
  type        = string
  default     = "joeljorex"

  validation {
    condition     = can(regex("^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$", var.github_owner))
    error_message = "github_owner debe ser un nombre de usuario u organización válido de GitHub (letras, números y guiones; máximo 39 caracteres)."
  }
}

variable "repositorio" {
  description = "Nombre del repositorio (sin el dueño)."
  type        = string
  default     = "habitos-tracker"

  validation {
    condition     = can(regex("^[A-Za-z0-9._-]{1,100}$", var.repositorio))
    error_message = "repositorio debe contener solo letras, números, puntos, guiones y guiones bajos."
  }
}

variable "ramas_protegidas" {
  description = "Ramas (o patrones) que exigen PR, aprobaciones y checks antes de integrar."
  type        = list(string)
  default     = ["main", "develop"]

  validation {
    condition = (
      length(var.ramas_protegidas) > 0 &&
      length(distinct(var.ramas_protegidas)) == length(var.ramas_protegidas) &&
      alltrue([for rama in var.ramas_protegidas : length(trimspace(rama)) > 0])
    )
    error_message = "ramas_protegidas debe tener al menos una rama, sin nombres vacíos ni repetidos."
  }
}

variable "checks_requeridos" {
  description = "Nombres exactos de los checks (campo `name:` de los jobs de ci.yml) que deben pasar para integrar."
  type        = list(string)
  # "Detectar componentes" también es requerido: si fallara, los jobs de componentes quedarían
  # "skipped" (que cuenta como éxito) y un PR podría integrarse sin verificar nada.
  default = [
    "Detectar componentes",
    "Web - unit + e2e (Playwright)",
    "API (Laravel) - Tests",
    "App (Android) - Build & Unit Tests",
    "IaC - Terraform validate",
    "SDD - Specs completas",
  ]

  validation {
    condition = (
      length(var.checks_requeridos) > 0 &&
      alltrue([for check in var.checks_requeridos : length(trimspace(check)) > 0])
    )
    error_message = "checks_requeridos debe tener al menos un check y ninguno puede estar vacío."
  }
}

variable "aprobaciones_requeridas" {
  description = "Número de aprobaciones de revisión que exige cada PR hacia una rama protegida."
  type        = number
  default     = 1

  validation {
    condition = (
      var.aprobaciones_requeridas >= 0 &&
      var.aprobaciones_requeridas <= 6 &&
      floor(var.aprobaciones_requeridas) == var.aprobaciones_requeridas
    )
    error_message = "aprobaciones_requeridas debe ser un entero entre 0 y 6 (límite de GitHub)."
  }
}

variable "revisores_produccion" {
  description = "Usuarios de GitHub que pueden aprobar despliegues en el ambiente production."
  type        = list(string)
  default     = ["joeljorex"]

  validation {
    condition = (
      length(var.revisores_produccion) >= 1 &&
      length(var.revisores_produccion) <= 6 &&
      alltrue([for usuario in var.revisores_produccion : can(regex("^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$", usuario))])
    )
    error_message = "revisores_produccion debe tener entre 1 y 6 usuarios válidos de GitHub (production exige al menos un revisor)."
  }
}

variable "habilitar_railway" {
  description = "Crea el proyecto, el servicio `api` y el ambiente `staging` en Railway. Por defecto false: no se crea nada en Railway."
  type        = bool
  default     = false
}

variable "railway_proyecto" {
  description = "Nombre del proyecto de Railway que aloja la API."
  type        = string
  default     = "habitos-tracker-api"

  validation {
    condition     = length(trimspace(var.railway_proyecto)) > 0
    error_message = "railway_proyecto no puede estar vacío."
  }
}
