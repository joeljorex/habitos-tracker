---
name: nuevo-modulo-sdd
description: Guía para agregar un módulo o requerimiento nuevo a habitos-tracker con Spec-Driven Development (Spec Kit) respetando la constitución, las ramas feature/*, los casos CP-xx y la trazabilidad. Úsala cuando pidan "nuevo módulo", "nueva funcionalidad", "nuevo requerimiento" o "agregar una feature".
---

# Nuevo módulo con SDD

Sigue estos pasos en orden. No escribas código de producto antes del paso 5.

## 1. Contexto obligatorio

1. Lee `.specify/memory/constitution.md` (principios y quality gates).
2. Lee `docs/trazabilidad.md` para conocer los IDs de requisitos y casos (`RF-xx`, `CP-xx`) ya usados.
3. Revisa `specs/` para no duplicar una feature existente.

## 2. Rama

```bash
git switch develop && git pull
git switch -c feature/NNN-nombre-corto      # NNN = siguiente número libre en specs/
```

## 3. Especificar

1. Ejecuta `/speckit-specify <descripción en lenguaje natural del qué y el porqué>`.
2. Revisa `specs/NNN-*/checklists/requirements.md`; si hay `[NEEDS CLARIFICATION]`, ejecuta `/speckit-clarify`.
3. Cada escenario de aceptación que se pueda probar debe citar un caso `(CP-xx)` nuevo o existente.

## 4. Planear y desglosar

1. `/speckit-plan` — respeta el stack de la constitución (panel: módulos ES sin build; API: Laravel 13; app: Kotlin/Compose).
2. `/speckit-tasks` — las pruebas se consideran **solicitadas** (principio II): escríbelas antes que la implementación.
3. `/speckit-analyze` — no continúes si reporta hallazgos CRITICAL.

## 5. Implementar

1. `/speckit-implement` o trabaja las tareas en orden, marcando `[x]` en `tasks.md`.
2. Reglas de negocio en módulos puros (`web/src/dominio/`), con pruebas unitarias.
3. Casos e2e con la skill `caso-de-prueba-e2e`; si el módulo tiene UI nueva, agrega su paso de guía con la skill `paso-tour-driverjs`.

## 6. Documentar la trazabilidad

- `docs/casos-de-prueba.md`: filas nuevas `CP-xx`.
- `docs/trazabilidad.md`: fila `RF → spec → CP → prueba automatizada → PR`.

## 7. Verificar antes del PR

```bash
npm test
node scripts/verificar-specs.mjs
```

## 8. Pull Request

Usa la skill `pr-planeacion` para redactar el PR hacia `develop` y pide revisión al otro integrante.

## Hecho cuando

- [ ] `spec.md`, `plan.md`, `tasks.md` completos y `/speckit-analyze` sin CRITICAL
- [ ] Todas las tareas marcadas y pruebas en verde
- [ ] Casos y trazabilidad actualizados
- [ ] PR abierto con la plantilla completa
