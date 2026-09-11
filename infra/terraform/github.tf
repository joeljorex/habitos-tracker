# Protección de ramas y ambientes de despliegue en GitHub — spec 003 (contracts/pipelines.md §4).
# Credencial: variable de entorno GITHUB_TOKEN (token con administración del repositorio).

provider "github" {
  owner = var.github_owner
}

# -----------------------------------------------------------------------------------------------
# Protección de ramas
#
# Se usa github_branch_protection (API GraphQL, basada en patrón): es la regla clásica que
# aparece en Settings → Branches y puede crearse aunque la rama aún no exista en el remoto
# (la rama develop se crea con git, no con Terraform).
# -----------------------------------------------------------------------------------------------
resource "github_branch_protection" "ramas" {
  for_each = toset(var.ramas_protegidas)

  repository_id = var.repositorio
  pattern       = each.value

  # Las reglas también aplican a administradores: nadie hace push directo a main/develop.
  enforce_admins = true

  allows_force_pushes = false
  allows_deletions    = false

  # PR obligatorio con el número de aprobaciones acordado.
  required_pull_request_reviews {
    required_approving_review_count = var.aprobaciones_requeridas
  }

  # Checks estrictos: la rama del PR debe estar al día con la base y todos los checks en verde.
  # Un job omitido por su `if` (componente sin código) cuenta como exitoso.
  required_status_checks {
    strict   = true
    contexts = var.checks_requeridos
  }
}

# -----------------------------------------------------------------------------------------------
# Ambientes de despliegue
#
# github-pages NO se gestiona aquí: GitHub lo crea y administra al activar Pages con la fuente
# "GitHub Actions". La aprobación manual vive en production (job aprobacion-produccion de cd.yml).
# -----------------------------------------------------------------------------------------------

# Los revisores de un ambiente se configuran por ID numérico de usuario, no por nombre.
data "github_user" "revisores" {
  for_each = toset(var.revisores_produccion)

  username = each.value
}

resource "github_repository_environment" "staging" {
  repository  = var.repositorio
  environment = "staging"

  # Solo ramas protegidas (main/develop) pueden desplegar en este ambiente.
  deployment_branch_policy {
    protected_branches     = true
    custom_branch_policies = false
  }
}

resource "github_repository_environment" "production" {
  repository  = var.repositorio
  environment = "production"

  # FR-008: la publicación exige la aprobación de un revisor; ni un administrador la salta.
  can_admins_bypass = false

  # Con un solo revisor, esa persona debe poder aprobar despliegues que ella misma disparó.
  prevent_self_review = false

  reviewers {
    users = [for usuario in data.github_user.revisores : tonumber(usuario.id)]
  }

  deployment_branch_policy {
    protected_branches     = true
    custom_branch_policies = false
  }
}
