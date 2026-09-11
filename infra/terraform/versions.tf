# Versión de Terraform y proveedores — spec 003 (contracts/pipelines.md §4).
# .terraform.lock.hcl fija la versión exacta de cada proveedor y sus hashes: se versiona.
terraform {
  required_version = ">= 1.9"

  required_providers {
    # Proveedor oficial (partner) de GitHub: protección de ramas y ambientes de despliegue.
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }

    # Proveedor comunitario de Railway (API). Solo crea recursos con habilitar_railway = true.
    # Es 0.x: se fija la versión menor porque un cambio de menor puede romper compatibilidad.
    railway = {
      source  = "terraform-community-providers/railway"
      version = "~> 0.6.2"
    }
  }
}
