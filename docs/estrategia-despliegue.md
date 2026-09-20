# Estrategia de Despliegue

## Resumen por componente

| Componente | Destino | Cómo se despliega | Estado |
|---|---|---|---|
| Panel web | GitHub Pages | `cd.yml`: paquete → smoke tests en staging → aprobación → publicación → verificación | Activo |
| API | Railway | `cd.yml`: job `Desplegar API (Railway)` con `railway up --ci` | Preparado: se activa al existir `api/Dockerfile` y el secreto `RAILWAY_TOKEN` |
| App Android | Firebase App Distribution | `cd.yml`: job `Construir app (AAB)` y distribución si hay credenciales | Preparado: se activa al existir `app/gradlew` |

El pipeline de despliegue se dispara con cada push a `main` (merge del PR de release
`develop → main`) o manualmente desde **Actions → CD → Run workflow**.

## Pipeline de despliegue (CD)

```text
merge a main
   → CI completo (las mismas verificaciones de los PRs)
   → Construir paquete del panel (artefacto de GitHub Pages con web/)
   → Smoke tests (staging): el mismo paquete servido en el runner
   → Aprobación de producción (revisor del ambiente production)
   → Publicar en GitHub Pages
   → Verificar producción: smoke tests contra la URL pública
```

En paralelo, después de la CI: `Desplegar API (Railway)` y `Construir app (AAB)`, que se omiten
mientras la API y la app no tengan código.

## Panel web — GitHub Pages

- **URL**: `https://joeljorex.github.io/habitos-tracker/` (se publica con el primer release).
- **Staging efímero**: GitHub Pages admite un solo sitio por repositorio, por eso el staging es un
  servidor temporal (`scripts/serve.mjs`) dentro del runner que sirve **exactamente el paquete que
  se va a publicar**; ahí corren las pruebas `@smoke`.
- **Aprobación manual**: el job `Aprobación de producción` usa el ambiente `production`, que exige
  un revisor (declarado en `infra/terraform/github.tf`).
- **Verificación**: después de publicar, las pruebas `@smoke` corren contra la URL pública
  (`BASE_URL`).
- **Requisito único**: Settings → Pages → Build and deployment → Source: **GitHub Actions**.

## API backend — Railway

- **Proveedor:** Railway, que despliega desde el `Dockerfile` de `api/`, incluye MySQL como
  servicio administrado y ofrece ambientes `staging` y `production`.
- **Despliegue:** `railway up --ci --service api` desde el job `Desplegar API (Railway)`; espera el
  veredicto de Railway y falla si el despliegue queda `FAILED` o `CRASHED`.
- **Migraciones:** `php artisan migrate --force` como *pre-deploy command* del servicio. Railway lo
  ejecuta después del build y antes de dar tráfico, dentro de su red privada; si falla, sigue
  activa la versión anterior. (La base de datos no es accesible desde el runner de GitHub, por eso
  no se ejecutan desde el pipeline.)
- **Health check:** `/api/health`, configurado en el servicio de Railway.
- **Variables de entorno:** secretos del pipeline en *GitHub Actions Secrets* y variables de
  Laravel en *Railway Variables*; nunca en el repositorio (`.gitignore`).
- **Infraestructura como código:** proyecto, servicio `api` y ambiente `staging` en
  `infra/terraform/railway.tf` (se activan con `habilitar_railway = true`).

## App móvil — Firebase App Distribution

- El job `Construir app (AAB)` ejecuta `./gradlew bundleRelease` y guarda el AAB como artefacto
  `app-release-aab`.
- Si existen los secretos `FIREBASE_APP_ID` y `FIREBASE_CREDENTIALS`, se distribuye con Firebase
  App Distribution para que el equipo y el docente instalen cada versión.
- Nota: App Distribution acepta AAB solo si la app está vinculada a Google Play; sin Play, se
  distribuye un APK (`assembleRelease`).
- La publicación en Google Play queda fuera del alcance del curso.

## Ambientes

| Ambiente | Protección | Uso |
|---|---|---|
| `staging` | solo ramas protegidas | smoke tests del paquete antes de publicar |
| `production` | revisores obligatorios; solo ramas protegidas; sin bypass de administradores | aprobación del panel y despliegue de la API |
| `github-pages` | administrado por GitHub | publicación del sitio e historial de despliegues |

> Aplicar Terraform (o crear `production` con revisores a mano) **antes** del primer merge a
> `main`: si GitHub crea el ambiente en su primer uso, lo crea sin revisores.

## Infraestructura como código

- **Codespaces** (`.devcontainer/`): el mismo entorno para desarrollar, probar y hacer demos; el
  puerto 4173 se puede compartir para mostrar el panel. Para crear Codespaces en menos tiempo se
  pueden activar los *prebuilds* del repositorio.
- **Terraform** (`infra/terraform/`): proveedores GitHub (protección de ramas y ambientes) y
  Railway (API). Guía de uso en `infra/terraform/README.md`.

## Variables y secretos

| Nombre | Dónde | Uso | ¿Necesario hoy? |
|---|---|---|---|
| `GITHUB_TOKEN` | variable de entorno local | aplicar Terraform (proveedor GitHub) | solo para aplicar Terraform |
| `RAILWAY_TOKEN` | secreto del ambiente `production` / entorno local | desplegar la API · Terraform (Railway) | no |
| `FIREBASE_APP_ID`, `FIREBASE_CREDENTIALS` | GitHub Secrets | distribuir la app | no |

## Monitoreo post-despliegue

- Smoke tests automáticos contra producción en cada despliegue del panel.
- Historial de despliegues por ambiente en **Settings → Environments** y en la pestaña **Actions**.
- API: logs del contenedor en Railway y health check `/api/health`.
- App: métricas de fallos con Firebase Crashlytics.
- El detalle de alertas y tableros se desarrolla en la Actividad 3 ("Proceso de liberación y
  monitoreo").

## Rollback

1. **Rápido:** en **Actions → CD**, abrir la ejecución del último commit bueno de `main` y pulsar
   **Re-run all jobs**.
2. **Por código:** `git revert` del commit defectuoso en `develop` y un nuevo PR de release.
3. **API:** Railway permite volver a una versión anterior desde el historial de despliegues.
