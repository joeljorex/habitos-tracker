# Feature Specification: Seguridad de dependencias (módulo extra)

**Feature Branch**: `feature/008-seguridad-dependencias`

**Created**: 2026-10-01

**Status**: Draft

**Input**: User description: "Módulo adicional de la Actividad 3.1: analizar las dependencias en
busca de vulnerabilidades conocidas y mantenerlas al día automáticamente"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enterarse de una vulnerabilidad antes de liberar (Priority: P1)

Como equipo, queremos que cada cambio se revise contra una base de vulnerabilidades conocidas, para
no publicar una versión con un paquete comprometido.

**Why this priority**: el panel se publica automáticamente; sin esta revisión, una dependencia
vulnerable llega a producción sin que nadie lo note.

**Independent Test**: correr `npm run seguridad:dependencias` y ver el reporte; abrir un pull
request y ver el flujo «Dependencias» en verde o en rojo.

**Acceptance Scenarios**:

1. **Given** un pull request a `develop`, **When** corre la integración, **Then** el flujo
   «Dependencias» analiza `package-lock.json` y publica el resultado. *(CP-S01)*
2. **Given** una vulnerabilidad encontrada, **When** termina el análisis, **Then** el flujo falla y
   el detalle queda en la pestaña *Security* y como artefacto. *(CP-S02)*
3. **Given** mi máquina con Docker, **When** ejecuto `npm run seguridad:dependencias`, **Then**
   obtengo el mismo análisis sin crear ninguna cuenta. *(CP-S01)*

---

### User Story 2 - Mantener las dependencias al día sin acordarse (Priority: P2)

Como equipo, queremos que las actualizaciones lleguen como pull requests para revisarlas con el
mismo proceso de siempre, en vez de depender de que alguien se acuerde.

**Why this priority**: la mayoría de las vulnerabilidades se resuelven subiendo de versión.

**Independent Test**: revisar la configuración de Dependabot y ver los pull requests que abre.

**Acceptance Scenarios**:

1. **Given** una dependencia con versión nueva, **When** llega el lunes, **Then** Dependabot abre
   un pull request contra `develop` con la etiqueta `dependencias`.
2. **Given** varios parches a la vez, **When** se agrupan, **Then** llegan en un solo pull request
   en lugar de cinco.

---

### User Story 3 - Revisar también lo que no es código de Node (Priority: P3)

Como equipo, queremos vigilar las acciones de los flujos de trabajo y las imágenes de Docker de los
stacks locales, porque también son dependencias.

**Why this priority**: una acción de GitHub comprometida puede robar los secretos del repositorio.

**Independent Test**: revisar que la configuración incluye `github-actions` y `docker-compose`.

**Acceptance Scenarios**:

1. **Given** una acción con versión nueva, **When** llega el lunes, **Then** se abre un pull
   request con la etiqueta `ci`.
2. **Given** una imagen nueva de Prometheus o SonarQube, **When** llega el mes, **Then** se abre un
   pull request con la etiqueta `infraestructura`.

---

### Edge Cases

- **Análisis sin hallazgos**: el flujo pasa y deja igualmente el reporte como artefacto.
- **Sin Docker en la máquina**: el script local avisa con un mensaje claro y termina con error, en
  lugar de fallar con un rastro incomprensible.
- **Falso positivo o vulnerabilidad sin arreglo disponible**: se documenta en el pull request y, si
  hay que seguir, se decide explícitamente; no se apaga el análisis en silencio.
- **Repositorio sin permisos de *code scanning***: la publicación del SARIF se omite, pero el
  artefacto y el resumen siguen disponibles.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE analizar `package-lock.json` contra la base de datos OSV en cada push
  y pull request a `main` y `develop`.
- **FR-002**: El análisis DEBE repetirse semanalmente aunque nadie toque el código.
- **FR-003**: El resultado DEBE publicarse en formato SARIF en la pestaña *Security* y guardarse
  como artefacto durante 30 días.
- **FR-004**: El flujo DEBE fallar cuando haya vulnerabilidades, después de publicar el reporte.
- **FR-005**: El sistema DEBE ofrecer una segunda revisión con `npm audit --audit-level=high`.
- **FR-006**: El mismo análisis DEBE poder ejecutarse en la máquina de cualquiera del equipo con un
  solo comando y sin registrarse en ningún servicio.
- **FR-007**: Dependabot DEBE abrir pull requests contra `develop` para npm (semanal), acciones de
  GitHub (semanal) y las imágenes de los stacks locales (mensual).
- **FR-008**: Los parches DEBEN agruparse en un solo pull request.
- **FR-009**: Los pull requests automáticos DEBEN llevar etiquetas que digan de qué son.

### Key Entities

- **Hallazgo**: identificador OSV, paquete, versión afectada, severidad y versión que lo corrige.
- **Reporte SARIF**: formato estándar que entiende la pestaña *Security* de GitHub.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ningún cambio llega a `main` sin haber pasado el análisis de dependencias.
- **SC-002**: Una vulnerabilidad publicada se detecta como máximo 7 días después (análisis
  programado), y de inmediato si alguien abre un pull request.
- **SC-003**: Correr el análisis en una máquina nueva toma un comando y menos de 2 minutos.
- **SC-004**: El estado actual del proyecto es de 0 vulnerabilidades conocidas en sus 5 paquetes
  directos e indirectos.
