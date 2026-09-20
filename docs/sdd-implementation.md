# Guía de Implementación de SDD

## ¿Qué es Spec-Driven Development?

Es un enfoque donde la especificación —no el código— es la fuente de verdad del proyecto. Primero
se define **qué** debe hacer una funcionalidad y **por qué** (spec), luego **cómo** se va a
construir (plan técnico), después se descompone en tareas concretas y solo entonces se
implementa. Si algo no queda claro durante la implementación, se corrige la spec en lugar de
improvisar en el código.

El enfoque se popularizó en 2025 con GitHub Spec Kit y AWS Kiro como respuesta al "vibe coding"
(pedirle código a una IA sin especificación): cuando un agente de IA participa en la
implementación, la spec es el contrato que el humano revisa y el agente cumple
([Scrum Manager: *Spec-Driven Development: qué es, de dónde viene y por qué importa*](https://scrummanager.com/community/spec-driven-development-qu-es-de-dnde-viene-y-por-qu-importa)).

## Beneficios

| Beneficio general | Cómo se ve en este proyecto |
|---|---|
| Menos ambigüedad | La regla "¿cuándo se rompe una racha?" quedó escrita (FR-002 de la spec 004) antes de programar |
| Pruebas derivadas de la spec | Cada escenario de aceptación cita su caso `CP-xx` y su prueba automatizada |
| Contratos claros entre piezas | Los nombres de checks de CI, `data-testid` y scripts npm están en `contracts/` |
| Documentación que no se desactualiza | Las specs viven en el repo y se revisan en cada PR |
| Mejor trabajo con IA | El agente recibe spec, plan y tareas en lugar de una instrucción suelta |

## Instalación de Spec Kit

Resumen (la guía paso a paso con salidas reales está en
[guia-instalacion-speckit.md](./guia-instalacion-speckit.md)):

```powershell
# 1. uv (Windows PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
# 2. CLI de Spec Kit con versión fija
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v1.0.6
# 3. Inicializar en la raíz del repositorio
specify init --here --integration claude --script py --non-interactive --force
# 4. Verificar
specify check
```

En Codespaces se instala automáticamente (`.devcontainer/post-create.sh`).

## Flujo de trabajo con Spec Kit

| Paso | Comando (Claude Code) | Artefacto que produce |
|---|---|---|
| 0 | `/speckit-constitution` (una vez) | `.specify/memory/constitution.md` |
| 1 | `/speckit-specify <descripción>` | `specs/NNN-nombre/spec.md` + `checklists/requirements.md` |
| 2 | `/speckit-clarify` (opcional) | Preguntas resueltas dentro de `spec.md` |
| 3 | `/speckit-plan` | `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` |
| 4 | `/speckit-tasks` | `tasks.md` ordenado por historia de usuario |
| 5 | `/speckit-analyze` (opcional) | Reporte de consistencia entre spec, plan y tareas |
| 6 | `/speckit-implement` | Código y pruebas; tareas marcadas `[x]` |
| 7 | `/speckit-converge` | Diferencias entre código y specs convertidas en tareas |

> Con Claude Code en modo skills los comandos llevan guion (`/speckit-plan`); en otros agentes,
> como GitHub Copilot, llevan punto (`/speckit.plan`).

Las skills propias del proyecto complementan el flujo: `nuevo-modulo-sdd`, `caso-de-prueba-e2e`,
`paso-tour-driverjs` y `pr-planeacion` (ver [sdd-proposal.md](./sdd-proposal.md#propuesta-de-implementación-de-sdd--skills)).

## Aplicación al piloto de este proyecto

| Spec | Piloto | Historias | Casos | Implementada en |
|---|---|---|---|---|
| 001 | a) Pruebas e2e del panel web | 5 | CP-01, 02, 05–10 | PR `feature/panel-web-e2e-tour` |
| 002 | b) Guía interactiva con driver.js | 3 | CP-11, CP-12 | PR `feature/panel-web-e2e-tour` |
| 003 | c) Infraestructura como código + CI/CD | 4 | checks de CI | PR `feature/003-infraestructura-cicd` |
| 004 | Módulo extra: rachas | 3 | CP-04, CP-13, V01–V13 | PR `feature/004-logica-rachas` |

## Ejemplo real: de la spec al código (spec 004)

1. **Spec** — `FR-002`: "La racha actual MUST ser la cantidad de días cumplidos consecutivos que
   terminan hoy; si hoy aún no está cumplido pero ayer sí, MUST terminar ayer; en cualquier otro
   caso MUST ser 0."
2. **Contrato** — el caso `V03` fija el comportamiento: hoy 2026-09-10, cumplido 09-09 → actual 1.
3. **Tareas** — `T003` escribe las 13 pruebas unitarias (fallan); `T004` implementa `calcularRachas`.
4. **Código** — `web/src/dominio/rachas.js`; **prueba** — `tests/unit/rachas.test.mjs`
   (`V03 …`); **e2e** — `CP-13` en `tests/e2e/rachas.spec.js`.
5. **Trazabilidad** — fila `RF-04` en [trazabilidad.md](./trazabilidad.md).

## Beneficios esperados para este proyecto

- **Menos retrabajo** en rachas y sincronización, las partes con más reglas implícitas.
- **Contrato claro entre app, panel y API**: los mismos casos de referencia para los tres clientes.
- **Evidencia verificable**: cada PR muestra spec, tareas marcadas y pruebas en verde.
- **Costo cero** y sin cambiar de herramientas.

## Seguimiento

| Fecha | Spec | Fase | Estado | PR | Notas |
|---|---|---|---|---|---|
| 2026-09-11 | Constitución | Ratificada | ✅ v1.0.0 | `feature/sdd-speckit` | 6 principios |
| 2026-09-11 | 001 Panel web + e2e | spec · plan · tasks | ✅ Lista para implementar | `feature/sdd-speckit` | Implementación en `feature/panel-web-e2e-tour` |
| 2026-09-11 | 002 Guía driver.js | spec · plan · tasks | ✅ Lista para implementar | `feature/sdd-speckit` | Implementación en `feature/panel-web-e2e-tour` |
| 2026-09-11 | 003 IaC + CI/CD | spec · plan · tasks | ✅ Lista para implementar | `feature/sdd-speckit` | Implementación en `feature/003-infraestructura-cicd` |
| 2026-09-11 | 004 Rachas | spec · plan · tasks | ✅ Lista para implementar | `feature/sdd-speckit` | Implementación en `feature/004-logica-rachas` |
| — | 005 Contrato API | — | ⏳ Backlog | — | Requiere scaffolding de Laravel |
| — | 006 Sync offline | — | ⏳ Backlog | — | Requiere app Android |

### Indicadores

| Indicador | Meta |
|---|---|
| Funcionalidades con spec antes del primer commit de código | 100 % |
| Casos web `CP-xx` automatizados | ≥ 80 % |
| Hallazgos CRITICAL de `/speckit-analyze` al implementar | 0 |
| Issues abiertos por ambigüedad de requisitos | tendencia a la baja por actividad |
