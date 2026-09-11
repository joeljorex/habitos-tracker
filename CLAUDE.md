# Hábitos Tracker — guía para agentes de IA

## Proyecto

Seguimiento de hábitos con rachas: app Android (`app/`), API Laravel (`api/`), panel web
estático (`web/`), infraestructura (`.github/`, `.devcontainer/`, `infra/`), documentación
(`docs/`) y specs de Spec-Driven Development (`specs/`).

## Fuente de verdad

1. `.specify/memory/constitution.md` — principios no negociables.
2. `specs/NNN-*/` — spec, plan, contratos y tareas de cada funcionalidad.
3. `docs/trazabilidad.md` — requisito → spec → caso de prueba → prueba → PR.

## Flujo de trabajo

- Funcionalidad nueva: skill `nuevo-modulo-sdd` (usa `/speckit-specify` → `/speckit-plan` →
  `/speckit-tasks` → `/speckit-analyze` → `/speckit-implement`).
- Automatizar un caso `CP-xx`: skill `caso-de-prueba-e2e`.
- Explicar UI nueva en la guía: skill `paso-tour-driverjs`.
- Redactar un PR: skill `pr-planeacion`.

## Comandos

```bash
npm test                          # unitarias + e2e (Playwright)
npm run serve                     # panel en http://127.0.0.1:4173/
node scripts/verificar-specs.mjs  # gate SDD
cd infra/terraform && terraform validate
```

## Convenciones

- Ramas `feature/*` desde `develop`; PR con revisión del otro integrante; nunca push directo a
  `develop` ni a `main`.
- Conventional Commits.
- Textos de UI en español; `data-testid` y textos según los contratos de cada spec.
- Sin CDN ni secretos en el repositorio.
