# Infraestructura como código (Terraform)

Configuración de la nube del proyecto declarada en Terraform — spec
[003-infraestructura-cicd](../../specs/003-infraestructura-cicd/spec.md) (contrato en
[contracts/pipelines.md §4](../../specs/003-infraestructura-cicd/contracts/pipelines.md)).

## Qué gestiona

| Recurso | Archivo | Detalle |
|---|---|---|
| Protección de `main` y `develop` | `github.tf` | PR obligatorio, `aprobaciones_requeridas` aprobaciones, los 6 checks de `checks_requeridos` en modo estricto, sin force-push ni borrado; aplica también a administradores. |
| Ambiente `staging` | `github.tf` | Solo ramas protegidas pueden desplegar. |
| Ambiente `production` | `github.tf` | Revisores `revisores_produccion` (resueltos a su ID de usuario), solo ramas protegidas, sin bypass de administradores. |
| Proyecto, servicio `api` (raíz `/api`) y ambiente `staging` en Railway | `railway.tf` | Solo con `habilitar_railway = true`. Por defecto no se crea nada en Railway. |

**No gestiona** (se hace a mano una sola vez, o lo administra otra pieza):

- La rama `develop`: se crea con git (`git push -u origin develop`).
- El ambiente `github-pages`: lo crea GitHub al activar Pages con la fuente **GitHub Actions**
  (Settings → Pages → Build and deployment → Source: GitHub Actions). Ver
  [quickstart §3](../../specs/003-infraestructura-cicd/quickstart.md).
- Los secretos de Actions (`RAILWAY_TOKEN`, `FIREBASE_APP_ID`, `FIREBASE_CREDENTIALS`).
- El *pre-deploy command* y el *health check* del servicio en Railway (ver
  [Migraciones de la API](#migraciones-de-la-api)).

Los valores por defecto de las variables están en `variables.tf` y un ejemplo comentado en
`terraform.tfvars.example`.

## Requisitos

- Terraform ≥ 1.9 (la CI y el Codespace usan 1.16.2).
- Para aplicar: un token de GitHub con administración del repositorio, en la variable de entorno
  `GITHUB_TOKEN`:
  - *Fine-grained token*: repositorio `habitos-tracker`, permisos **Administration: Read and
    write** y **Metadata: Read**.
  - *Classic token*: alcance `repo`.
  - Con GitHub CLI autenticado como dueño del repositorio también sirve su token (ver abajo).
- Solo si `habilitar_railway = true`: un token de **cuenta o workspace** de Railway
  (railway.com → Account Settings → Tokens) en la variable de entorno `RAILWAY_TOKEN`.

Las credenciales **nunca** van en archivos: ni en `.tf` ni en `terraform.tfvars`.

## Validar sin credenciales

Es lo mismo que ejecuta el check `IaC - Terraform validate` de la CI:

```bash
cd infra/terraform
terraform fmt -check -recursive
terraform init -backend=false
terraform validate        # "Success! The configuration is valid."
```

## Aplicar

### bash (Linux, macOS, Git Bash, Codespaces)

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars    # ajustar revisores si hace falta
export GITHUB_TOKEN="<token con administración del repo>"
# alternativa con GitHub CLI: export GITHUB_TOKEN="$(gh auth token)"
terraform init
terraform plan      # revisar: protección de main/develop y ambientes staging/production
terraform apply
unset GITHUB_TOKEN
```

### PowerShell (Windows)

```powershell
Set-Location infra/terraform
Copy-Item terraform.tfvars.example terraform.tfvars
$env:GITHUB_TOKEN = "<token con administración del repo>"
# alternativa con GitHub CLI: $env:GITHUB_TOKEN = gh auth token
terraform init
terraform plan
terraform apply
Remove-Item Env:GITHUB_TOKEN
```

Resultado esperado: en **Settings → Branches** aparecen las reglas de `main` y `develop` con los 6
checks requeridos, y en **Settings → Environments**, `staging` y `production`.

Los nombres de `checks_requeridos` deben coincidir exactamente con el `name:` de los jobs de
`.github/workflows/ci.yml`. Si un nombre cambia, se actualizan el contrato, `variables.tf` y el
workflow en el mismo PR; de lo contrario los PRs quedan bloqueados esperando un check que nunca
llega.

Como la regla aplica también a administradores, nadie puede hacer push directo a `main` ni a
`develop`. Si hiciera falta una excepción puntual, un administrador puede editar la regla en
Settings → Branches; el siguiente `terraform plan` mostrará la diferencia y `terraform apply` la
restablece.

## Activar Railway (cuando exista la API)

1. Exportar el token de cuenta o workspace:
   `export RAILWAY_TOKEN="<token>"` (bash) o `$env:RAILWAY_TOKEN = "<token>"` (PowerShell).
2. En `terraform.tfvars`, poner `habilitar_railway = true` y ejecutar `terraform plan` y
   `terraform apply`. Se crean el proyecto `railway_proyecto`, el servicio `api` con raíz `/api`
   y el ambiente `staging` (el ambiente `production` lo crea Railway con el proyecto).
3. En Railway, dentro del servicio `api` (ambiente `production`):
   - **Settings → Deploy → Pre-deploy command**: `php artisan migrate --force`
   - **Settings → Deploy → Healthcheck path**: `/api/health`
   - **Variables**: las de Laravel (`APP_KEY`, conexión a MySQL, etc.).
4. Crear un **token de proyecto** para el ambiente `production` (Project Settings → Tokens) y
   guardarlo en GitHub como secreto `RAILWAY_TOKEN` del ambiente `production`
   (Settings → Environments → production → Environment secrets).

Con `habilitar_railway = false` el proveedor de Railway recibe un token de relleno (ver el
comentario en `railway.tf`): así `plan` y `apply` funcionan solo con `GITHUB_TOKEN`. Si se activa
Railway sin exportar `RAILWAY_TOKEN`, Terraform falla con `Missing API token`.

### Migraciones de la API

`docs/estrategia-despliegue.md` pide ejecutar `php artisan migrate --force` como parte del
despliegue. Se resuelve con el **pre-deploy command** del servicio en Railway y no con un paso
del pipeline:

- Railway lo ejecuta después del build y antes de que la versión nueva reciba tráfico, dentro de
  la red privada del proyecto y con las variables del servicio (la base de datos no es accesible
  desde el runner de GitHub).
- Si la migración falla, el despliegue no avanza y sigue activa la versión anterior.
- El job `Desplegar API (Railway)` de `cd.yml` ejecuta `railway up --ci`, que espera el veredicto
  del despliegue: sale con 0 solo si queda `SUCCESS` (migración y health check correctos) y con
  1 si queda `FAILED` o `CRASHED`.

El proveedor de Terraform (0.6.x) no expone estos ajustes y el archivo `railway.json`
(*config as code*) está deprecado por Railway, por eso el paso 3 es manual y queda documentado
aquí (constitución, principio V).

## Importar recursos existentes

Si alguna regla o ambiente ya se creó a mano en GitHub, `terraform apply` fallaría porque el
recurso ya existe. Primero hay que importarlo al estado.

**Opción recomendada (Terraform ≥ 1.7, funciona igual en bash y PowerShell)**: crear un archivo
temporal `importar.tf` con este contenido, ejecutar `terraform plan` (debe decir
*will be imported*), `terraform apply`, y después borrar `importar.tf`.

```hcl
import {
  for_each = toset(var.ramas_protegidas)
  to       = github_branch_protection.ramas[each.value]
  id       = "${var.repositorio}:${each.value}"
}

import {
  to = github_repository_environment.staging
  id = "${var.repositorio}:staging"
}

import {
  to = github_repository_environment.production
  id = "${var.repositorio}:production"
}
```

Deja en `importar.tf` solo los bloques de recursos que realmente existan: importar uno que no
existe produce un error.

**Alternativa por línea de comandos** (el ID es `repositorio:patrón` o `repositorio:ambiente`):

```bash
terraform import 'github_branch_protection.ramas["main"]' habitos-tracker:main
terraform import 'github_branch_protection.ramas["develop"]' habitos-tracker:develop
terraform import github_repository_environment.staging habitos-tracker:staging
terraform import github_repository_environment.production habitos-tracker:production
```

En Windows PowerShell 5.1 las comillas internas se pierden al llamar a programas externos; hay que
escaparlas: `terraform import 'github_branch_protection.ramas[\"main\"]' habitos-tracker:main`.
Por eso se recomienda la opción con `importar.tf`.

## Estado y lock

- El estado es local (`terraform.tfstate`, alcance académico con un solo operador). Nunca se
  versiona: `.gitignore` debe ignorar `infra/terraform/.terraform/`, `*.tfstate`, `*.tfstate.*` y
  `terraform.tfvars`. Si el estado se pierde, se recupera importando los recursos (sección
  anterior).
- `.terraform.lock.hcl` **sí** se versiona: fija la versión exacta de cada proveedor y sus hashes
  para `linux_amd64` (CI y Codespaces), `windows_amd64` y `darwin_arm64`. Si alguien trabaja en
  otra plataforma (p. ej. macOS Intel), debe agregar sus hashes y commitear el lock:

  ```bash
  terraform providers lock -platform=darwin_amd64
  ```

- Para actualizar proveedores: `terraform init -upgrade` y regenerar el lock para las tres
  plataformas:

  ```bash
  terraform providers lock -platform=linux_amd64 -platform=windows_amd64 -platform=darwin_arm64
  ```
