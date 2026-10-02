# Checklist de requisitos: Seguridad de dependencias

**Propósito**: revisar que la especificación esté completa y sin ambigüedades antes de implementar.

**Creado**: 2026-10-01

## Contenido

- [x] CHK001 Está dicho qué se analiza (`package-lock.json`, acciones e imágenes) y qué no.
- [x] CHK002 Están definidos los disparadores: cambio, programación semanal y manual. *(FR-001, FR-002)*
- [x] CHK003 Está definido dónde queda el reporte y cuánto tiempo. *(FR-003)*
- [x] CHK004 Está definido qué pasa sin Docker en la máquina. *(spec, Edge Cases)*
- [x] CHK005 Está definido qué hacer ante una vulnerabilidad sin arreglo disponible. *(spec, Edge Cases)*

## Claridad

- [x] CHK006 La elección de herramienta está justificada frente a Snyk, con el motivo real (cuenta y límites). *(plan.md)*
- [x] CHK007 Los criterios de éxito son medibles. *(SC-001 a SC-004)*
- [x] CHK008 El orden «publicar y luego fallar» está dicho explícitamente. *(FR-004)*

## Consistencia

- [x] CHK009 La versión de la herramienta es la misma en el flujo y en el script local.
- [x] CHK010 Los pull requests automáticos apuntan a `develop`, igual que el resto del flujo de trabajo del proyecto.

## Cobertura

- [x] CHK011 Hay evidencia de una ejecución real con su resultado. *(docs/evidencia/osv-scanner.sarif.json)*
- [x] CHK012 Los tres ecosistemas vigilados están cubiertos por la configuración.
