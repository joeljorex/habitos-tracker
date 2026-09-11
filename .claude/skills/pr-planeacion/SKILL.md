---
name: pr-planeacion
description: Redacta la descripción de un Pull Request de habitos-tracker con la plantilla del repositorio (ticket, qué se hizo, archivos y su uso, spec y tareas, casos de prueba, evidencia). Úsala cuando pidan "descripción del PR", "abrir PR", "PR de planeación" o "explicar mi ticket".
---

# Descripción de PR (plantilla del proyecto)

## 1. Reúne la información

```bash
git log --oneline develop..HEAD
git diff --stat develop...HEAD
```

- Issue/ticket relacionado (número y título).
- Spec implementada (`specs/NNN-*/`) y tareas marcadas en `tasks.md`.
- Casos `CP-xx` cubiertos (títulos de las pruebas).

## 2. Redacta siguiendo `.github/pull_request_template.md`

- **Ticket**: `Closes #N` y en 2–3 líneas en qué consiste y por qué se necesita.
- **Qué se hizo**: viñetas en pasado, orientadas al resultado ("Se agregó…", "Se corrigió…").
- **Archivos principales**: tabla `Archivo | Para qué sirve`, máximo 10 filas; agrupa carpetas grandes (`.specify/**`).
- **Cómo se usa / cómo probarlo**: comandos exactos que el revisor puede copiar.
- **Casos de prueba cubiertos**: lista de `CP-xx`.
- **Evidencia**: enlace a la ejecución de CI; capturas si hay UI.

## 3. Título y rama

- Título con Conventional Commits: `feat(web): …`, `docs(sdd): …`, `ci: …`.
- Rama `feature/*` → base `develop` (nunca directo a `main`; el release es un PR `develop → main`).

## 4. Revisión

Asigna como revisor al otro integrante. La protección de ramas exige 1 aprobación y los checks en verde.
