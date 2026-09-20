# Guía de seguimiento de instalación de Spec Kit

Registro reproducible de cómo se instaló **GitHub Spec Kit** en `habitos-tracker`, qué se
verificó y qué queda pendiente. Cada integrante repite los pasos (en su equipo o en Codespaces)
y agrega su fila en la tabla de [seguimiento](#6-seguimiento).

## 1. Resumen

| Elemento | Valor |
|---|---|
| Herramienta | GitHub Spec Kit — CLI `specify` |
| Versión | **1.0.6** (release publicado el 2026-09-10) |
| Gestor de instalación | `uv` 0.12.13 |
| Integración con agente | Claude Code (comandos instalados como *skills* en `.claude/skills/`) |
| Tipo de scripts | Python (`--script py`): funcionan igual en Windows y en Codespaces (Linux) |
| Numeración de features | secuencial (`001-…`, `002-…`) |
| Fecha de instalación | 2026-09-11 |
| Equipo donde se ejecutó | Windows 11 Home 10.0.26200 · Python 3.14.3 · Git 2.53.0 |

## 2. Prerrequisitos

| Requisito | Mínimo | Verificado | Comando |
|---|---|---|---|
| Python | 3.11 | 3.14.3 | `python --version` |
| Git | reciente | 2.53.0 | `git --version` |
| uv | — | 0.12.13 | `uv --version` |
| Agente de IA | uno compatible | Claude Code (detectado) | `specify check` |

## 3. Pasos de instalación

### Paso 1 — Instalar `uv`

Windows (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Linux / macOS / Codespaces:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Salida obtenida:

```text
downloading uv 0.12.13 (x86_64-pc-windows-msvc)
installing to C:\Users\<usuario>\.local\bin
  uv.exe
  uvx.exe
  uvw.exe
everything's installed!
```

> Si `uv` no se reconoce, abre una terminal nueva o ejecuta
> `$env:Path = "$env:USERPROFILE\.local\bin;$env:Path"` (PowerShell).

### Paso 2 — Instalar el CLI `specify` con versión fija

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v1.0.6
```

Salida obtenida (resumen):

```text
Resolved 16 packages in 772ms
      Built specify-cli @ git+https://github.com/github/spec-kit.git@96c9bd6…
Installed 16 packages in 227ms
 + specify-cli==1.0.6 (from git+https://github.com/github/spec-kit.git@96c9bd6…)
Installed 1 executable: specify
```

**Por qué fijar la versión**: las plantillas se copian desde el paquete instalado; con la
versión fija, los dos integrantes (y Codespaces) generan exactamente los mismos archivos
(principio V de la constitución).

### Paso 3 — Verificar la instalación

```bash
specify version
specify check
```

Salida obtenida:

```text
CLI Version    1.0.6
     Python    3.14.3
   Platform    Windows
Architecture   AMD64

Check Available Tools
├── ● Claude Code (available)
├── ● Visual Studio Code (available)
…
Specify CLI is ready to use!
```

### Paso 4 — Inicializar Spec Kit en el repositorio

Desde la raíz del repositorio, en la rama `feature/sdd-speckit`:

```bash
specify init --here --integration claude --script py --non-interactive --force
```

| Opción | Para qué |
|---|---|
| `--here` | inicializa en la carpeta actual (el repo ya existe) |
| `--integration claude` | instala los comandos como skills de Claude Code |
| `--script py` | scripts auxiliares en Python (multiplataforma) |
| `--non-interactive` | no pregunta nada (útil en terminales sin selector) |
| `--force` | combina con los archivos existentes sin pedir confirmación |

Salida obtenida:

```text
Selected coding agent integration: claude
Selected script type: py
Initialize Specify Project
├── ● Check required tools (ok)
├── ● Install integration (Claude Code)
├── ● Install shared infrastructure (scripts (py) + templates)
├── ● Constitution setup (copied from template)
├── ● Install bundled workflow (speckit installed)
└── ● Finalize (project ready)
Project ready.
```

Estructura creada:

```text
.specify/
├── init-options.json        # opciones usadas (integración, scripts, numeración)
├── integration.json
├── memory/constitution.md   # constitución del proyecto
├── scripts/python/          # create_new_feature.py, setup_plan.py, setup_tasks.py…
├── scripts/powershell/      # equivalentes en PowerShell
├── templates/               # spec, plan, tasks, checklist, constitución
└── workflows/speckit/       # flujo empaquetado de Spec Kit
.claude/skills/
├── speckit-constitution/    speckit-specify/   speckit-clarify/
├── speckit-plan/            speckit-tasks/     speckit-analyze/
├── speckit-checklist/       speckit-implement/ speckit-converge/
└── speckit-taskstoissues/
```

> **Aviso de seguridad de Spec Kit**: la carpeta del agente puede guardar credenciales. En
> `.gitignore` se excluye `.claude/settings.local.json`; las skills sí se versionan.

### Paso 5 — Definir la constitución

En Claude Code: `/speckit-constitution` con los principios del equipo. Resultado:
[`.specify/memory/constitution.md`](../.specify/memory/constitution.md) v1.0.0 con 6 principios
(especificación primero, pruebas como criterio de aceptación, offline-first e idempotencia,
dominio aislado, infraestructura como código, trazabilidad y simplicidad).

### Paso 6 — Crear las features piloto

Cada `/speckit-specify` ejecuta el script de apoyo que crea la carpeta de la feature y copia la
plantilla; `/speckit-plan` y `/speckit-tasks` preparan el plan y la lista de tareas:

```text
$ python .specify/scripts/python/create_new_feature.py --json --short-name panel-web-e2e "Panel web de hábitos…"
{"BRANCH_NAME":"001-panel-web-e2e","SPEC_FILE":"…\\specs\\001-panel-web-e2e\\spec.md","FEATURE_NUM":"001"}
$ python .specify/scripts/python/setup_plan.py --json
Copied plan template to …\specs\001-panel-web-e2e\plan.md
```

| Feature | Piloto de la asignatura | Carpeta |
|---|---|---|
| 001 | a) Pruebas automáticas e2e | `specs/001-panel-web-e2e/` |
| 002 | b) Guía interactiva (driver.js) | `specs/002-tour-guiado-driverjs/` |
| 003 | c) Infraestructura como código + CI/CD | `specs/003-infraestructura-cicd/` |
| 004 | Módulo extra: rachas | `specs/004-logica-rachas/` |

## 4. Comandos disponibles

| Comando (Claude Code) | Cuándo usarlo |
|---|---|
| `/speckit-constitution` | una vez al inicio, o para enmendar principios |
| `/speckit-specify <descripción>` | describir **qué** y **por qué** de una funcionalidad |
| `/speckit-clarify` | resolver ambigüedades antes de planear (opcional) |
| `/speckit-plan` | plan técnico: stack, estructura, research, modelo de datos, contratos |
| `/speckit-checklist` | listas de calidad de requisitos (opcional) |
| `/speckit-tasks` | lista de tareas ordenada por historia de usuario |
| `/speckit-analyze` | consistencia entre spec, plan y tareas antes de implementar (opcional) |
| `/speckit-implement` | ejecutar las tareas |
| `/speckit-converge` | comparar el código con las specs y agregar lo que falte como tareas |
| `/speckit-taskstoissues` | convertir tareas en issues de GitHub |

> En otros agentes (por ejemplo GitHub Copilot) los mismos comandos se escriben con punto:
> `/speckit.specify`, `/speckit.plan`… Con Claude Code en modo skills se usa guion.

## 5. Problemas encontrados y solución

| Problema | Causa | Solución |
|---|---|---|
| `specify` no se reconoce después de instalar | `~/.local/bin` aún no está en el PATH de la terminal abierta | abrir una terminal nueva o `uv tool update-shell` |
| Después de `init`, git marca todos los archivos como modificados | cambio de finales de línea (CRLF/LF) en Windows | se agregó `.gitattributes`; comprobar con `git diff --ignore-cr-at-eol --stat` (salida vacía = solo finales de línea) |
| `init` pide confirmación porque la carpeta no está vacía | el repositorio ya tenía archivos | `--force` combina sin borrar; revisar `git status` antes del commit |
| `init` se queda esperando en terminales sin selector | selector interactivo de agente | `--non-interactive --integration claude` |
| La guía anterior usaba `/specify`, `/plan`, `/tasks` | nombres de versiones previas de Spec Kit | en 1.0.6 con Claude: `/speckit-specify`, `/speckit-plan`, `/speckit-tasks` |

## 6. Seguimiento

| Fecha | Quién | Entorno | Pasos | Resultado | Evidencia |
|---|---|---|---|---|---|
| 2026-09-11 | Equipo (asistido por Claude Code) | Windows 11 | 1–6 | ✅ Spec Kit 1.0.6 instalado; constitución y 4 features creadas | salidas de esta guía; PR `feature/sdd-speckit` |
| | Joel Armando Ibarra Rubalcava | su equipo o Codespaces | 1–3 | ⏳ Pendiente | captura de `specify version` |
| | Jorge Humberto Martínez Delgado | su equipo o Codespaces | 1–3 | ⏳ Pendiente | captura de `specify version` |

### Verificación final

- [x] `specify version` muestra 1.0.6
- [x] `specify check` detecta Claude Code
- [x] Existen `.specify/` y las 10 skills `speckit-*` en `.claude/skills/`
- [x] Constitución v1.0.0 sin marcadores `[PLACEHOLDER]`
- [x] 4 carpetas en `specs/` con `spec.md`, `plan.md` y `tasks.md`
- [ ] Cada integrante replicó los pasos 1–3 y agregó su fila
