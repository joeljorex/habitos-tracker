# Justificación del pipeline de liberación y despliegue continuo

> Actividad 1.2 — CI/CD. Caso de estudio: **Hábitos Tracker**, aplicación para registrar hábitos
> diarios y sus rachas. Se compone de un panel web (publicado en GitHub Pages), una API en Laravel y
> una app Android. Equipo de dos personas, repositorio
> <https://github.com/joeljorex/habitos-tracker>.

## 1. Punto de partida

La ingeniería inversa de la primera unidad ([ingenieria-inversa.md](./ingenieria-inversa.md))
encontró tres problemas que este pipeline resuelve:

| Hallazgo | Qué implicaba | Cómo lo corrige el pipeline |
|---|---|---|
| H-01: la CI no ejecutaba ninguna prueba | no había evidencia de calidad | cada PR corre unitarias, e2e, carga y análisis estático |
| H-02: no existía pipeline de despliegue | el despliegue documentado nunca ocurría | `cd.yml` publica y verifica automáticamente |
| H-03: 10 commits directos a `main`, 0 PRs | nadie revisaba el código | protección de ramas por Terraform y revisión obligatoria |

## 2. Flujo de trabajo elegido

Se usa **GitHub Flow con rama de integración**: `feature/*` → `develop` → `main`.

```
feature/*  --PR + CI-->  develop  --PR de release + CI-->  main  --CD-->  producción
```

| Rama | Para qué | Quién escribe en ella |
|---|---|---|
| `feature/*` | una funcionalidad o corrección por rama | cada integrante, en su rama |
| `develop` | integración continua del equipo | solo por Pull Request aprobado |
| `main` | siempre desplegable; cada commit es una versión liberada | solo por Pull Request de release |

**Por qué este flujo y no otro:**

- *Trunk-based puro* (todo a `main`) exige una suite de pruebas muy madura y despliegues varias veces
  al día; con dos personas y entregas por unidad, cada merge a `main` sería un release sin ensayo.
- *Git Flow completo* (con `release/*` y `hotfix/*`) agrega ramas que este equipo no necesita: no hay
  versiones en paralelo ni soporte a versiones viejas.
- El flujo elegido deja una rama de integración donde se prueba todo junto, y reserva `main` para lo
  que ya está verificado, que es justo lo que pide la liberación continua del curso.

## 3. Etapas del pipeline

### 3.1 Integración continua — `.github/workflows/ci.yml`

| Etapa | Qué valida | Si falla |
|---|---|---|
| Detectar componentes | qué partes del repo cambiaron (web, api, app, IaC) | — |
| Web: unitarias + e2e | lógica de dominio con `node --test` y flujos completos con Playwright | bloquea el PR |
| API (Laravel) | PHPUnit, cuando exista código | bloquea el PR |
| App (Android) | compilación y pruebas unitarias, cuando exista código | bloquea el PR |
| IaC: Terraform validate | que la infraestructura declarada sea válida | bloquea el PR |
| SDD: specs completas | que cada spec tenga plan, tareas y contrato | bloquea el PR |

### 3.2 Calidad añadida en esta actividad

| Etapa | Herramienta | Umbral | Archivo |
|---|---|---|---|
| Prueba de carga | k6 | `p(95) < 5 s`, errores < 1 % | `.github/workflows/carga.yml` |
| Análisis estático | SonarQube | quality gate del proyecto | `.github/workflows/calidad.yml` |
| Revisión local previa | husky + k6 | prueba de humo antes del commit | `.husky/pre-commit` |

### 3.3 Despliegue continuo — `.github/workflows/cd.yml`

```
merge a main
  → CI completo
  → construir paquete del panel
  → desplegar a staging + pruebas de humo
  → aprobación manual (ambiente "production")
  → publicar en GitHub Pages
  → verificar producción
  → API en Railway y app en Firebase (cuando exista su código)
```

## 4. Por qué cada compuerta

1. **Pruebas antes que empaquetado**: empaquetar algo que no pasa las pruebas desperdicia minutos de
   runner y confunde al equipo sobre qué versión es buena.
2. **Staging antes que producción**: el mismo paquete se prueba en un entorno idéntico. Si el smoke
   falla ahí, producción ni se entera.
3. **Aprobación manual**: la rúbrica y la realidad coinciden en que una persona debe hacerse
   responsable del cambio que ven los usuarios. GitHub lo resuelve con *environments* protegidos.
4. **Verificación después de publicar**: un despliegue que "terminó bien" pero dejó el sitio caído no
   sirve; por eso el último job vuelve a pedir la página publicada y revisa que responda.
5. **Carga y análisis estático en el PR**: detectar una regresión de rendimiento o un bug potencial
   cuesta minutos en el PR y horas en producción.

## 5. Estrategia de despliegue por componente

| Componente | Estrategia | Motivo |
|---|---|---|
| Panel web (GitHub Pages) | reemplazo atómico del artefacto | el sitio es estático; el cambio es instantáneo y el rollback es volver a publicar el artefacto anterior |
| API (Railway) | rolling con health check `/api/health` | mantiene la versión anterior atendiendo hasta que la nueva responde sana |
| App Android | distribución por canales (Firebase App Distribution) | los usuarios de prueba reciben el AAB firmado sin pasar por la tienda |

## 6. Rollback

| Situación | Acción | Tiempo estimado |
|---|---|---|
| El panel salió con un error visible | volver a ejecutar el CD del último commit bueno (*Re-run all jobs*) | < 5 min |
| El error viene de un cambio identificado | `git revert` del commit y merge a `main` | < 15 min |
| La API falla el health check | Railway conserva la versión anterior; no se promueve la nueva | automático |

## 7. Versionado y frecuencia

- **Versionado semántico** (`v0.1.0`), con etiqueta en cada merge a `main`.
- **Commits convencionales** (`feat:`, `fix:`, `docs:`, `ci:`, `test:`), que permiten generar el
  historial de cambios de cada versión.
- **Frecuencia**: integración a `develop` varias veces por semana (cada PR terminado) y liberación a
  `main` una vez por unidad o cuando una corrección lo amerite.

## 8. Por qué estas herramientas

| Herramienta | Alternativas evaluadas | Razón de la elección |
|---|---|---|
| GitHub Actions | Jenkins, GitLab CI | el repositorio ya está en GitHub; sin servidor propio y gratis para repos públicos |
| k6 | JMeter, Apache Benchmark | pruebas en JavaScript, umbrales como código y salida lista para comitear |
| SonarQube Community | ESLint solo, SonarCloud | tablero completo con quality gate y ejecución local sin costo |
| Terraform | configuración manual en la interfaz | la protección de ramas y los ambientes quedan versionados y se pueden recrear |
| GitHub Pages | Netlify, Vercel | sin costo, integrado con Actions y suficiente para un panel estático |
| Railway | Heroku, Render | despliegue directo desde Dockerfile con base de datos administrada |
