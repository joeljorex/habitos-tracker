# Feature Specification: Visor de auditoría

**Feature Branch**: `feature/007-visor-auditoria`

**Created**: 2026-10-01

**Status**: Draft

**Input**: User description: "Visor de auditoría: quién hizo qué y cuándo, con un registro que se
pueda comprobar y exportar"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Saber quién hizo qué (Priority: P1)

Como responsable del producto, quiero ver la lista de acciones con valor —accesos, creación,
marcado y borrado de hábitos— con su autor, su hora y su resultado, para poder responder preguntas
sobre lo que pasó.

**Why this priority**: es el propósito del módulo; sin esta lista no hay auditoría.

**Independent Test**: iniciar sesión, crear un hábito y ver los dos eventos en la pestaña
**Auditoría**.

**Acceptance Scenarios**:

1. **Given** que inicio sesión y creo un hábito, **When** abro la pestaña Auditoría, **Then** veo
   los eventos `sesion.iniciada` y `habito.creado` con el correo de la cuenta y la hora. *(CP-A01)*
2. **Given** un intento de acceso fallido, **When** veo la auditoría, **Then** aparece
   `sesion.rechazada` con resultado «Rechazado». *(CP-A02)*
3. **Given** muchos eventos, **When** filtro por resultado o busco texto, **Then** la lista se
   reduce a lo que coincide. *(CP-A03)*

---

### User Story 2 - Comprobar que el registro no fue alterado (Priority: P1)

Como auditor, quiero comprobar que nadie modificó ni borró eventos del historial, para poder
confiar en lo que leo.

**Why this priority**: un registro que cualquiera puede editar no sirve como evidencia. Como el
panel guarda todo en el navegador de la persona, la única defensa posible es poder **detectar** la
alteración.

**Independent Test**: editar a mano un evento en el almacenamiento y ver que la verificación lo
señala.

**Acceptance Scenarios**:

1. **Given** una auditoría sin tocar, **When** pulso «Verificar integridad», **Then** dice que la
   cadena está verificada y cuántos eventos tiene. *(CP-A04)*
2. **Given** que alguien editó el contenido de un evento, **When** verifico, **Then** señala la
   posición y el identificador del evento modificado. *(CP-A05)*
3. **Given** que alguien borró un evento intermedio, **When** verifico, **Then** avisa que falta un
   evento anterior o que fueron reordenados. *(CP-A05)*

---

### User Story 3 - Llevarse la evidencia (Priority: P2)

Como auditor, quiero exportar la auditoría en CSV para revisarla fuera del panel o adjuntarla a un
reporte.

**Why this priority**: la evidencia sirve si se puede sacar del sistema que se audita.

**Independent Test**: exportar y abrir el CSV en una hoja de cálculo.

**Acceptance Scenarios**:

1. **Given** eventos registrados, **When** exporto, **Then** obtengo un CSV con encabezado y una
   fila por evento, incluido su hash.
2. **Given** que reinicio la auditoría, **When** confirmo, **Then** primero se descarga el CSV y el
   borrado queda registrado como el primer evento de la cadena nueva. *(CP-A06)*

---

### Edge Cases

- **Dos eventos a la vez**: calcular el hash es asíncrono; los eventos se encolan para que la
  cadena no se rompa ni se pierda ninguno.
- **Recorte por tamaño**: al pasar de 500 eventos, el más antiguo que queda se marca como inicio de
  cadena para que la verificación no lo confunda con una alteración.
- **Borrar la auditoría** es en sí un evento auditable (`auditoria.limpiada`).
- **Sin `crypto.subtle`** (contexto no seguro): el registro falla de forma controlada y queda un
  aviso en la bitácora; el panel sigue funcionando.
- **Alcance honesto**: los datos viven en el navegador de la persona, así que la cadena **detecta**
  manipulaciones, no las impide. Eso se documenta en lugar de prometer algo falso.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE registrar un evento por cada acción con valor: acceso aceptado,
  acceso rechazado, cierre de sesión, creación (aceptada o rechazada), marcado y eliminación de
  hábitos.
- **FR-002**: Cada evento DEBE guardar identificador, fecha ISO, actor, acción, recurso, detalle y
  resultado (`exito`, `rechazado` o `error`).
- **FR-003**: Cada evento DEBE guardar el hash del evento anterior y su propio hash SHA-256
  calculado sobre su contenido canónico.
- **FR-004**: El primer evento de la cadena DEBE usar un hash inicial conocido.
- **FR-005**: El sistema DEBE poder recalcular toda la cadena y señalar la posición y el
  identificador del primer evento alterado o faltante.
- **FR-006**: Los eventos DEBEN escribirse en orden aunque se pidan varios a la vez.
- **FR-007**: El sistema DEBE conservar como máximo 500 eventos y marcar el nuevo inicio de cadena
  al recortar.
- **FR-008**: El visor DEBE listar los eventos del más reciente al más antiguo y permitir filtrar
  por resultado y por texto.
- **FR-009**: El visor DEBE permitir exportar en CSV.
- **FR-010**: Reiniciar la auditoría DEBE exportar primero y dejar registro del propio borrado.
- **FR-011**: La auditoría NUNCA debe bloquear la interfaz: su escritura es asíncrona y sus fallos
  quedan en la bitácora.

### Key Entities

- **Evento de auditoría**: id, fecha, actor, acción, recurso, detalle, resultado, `hashAnterior`,
  `hash` y, al recortar, la marca `inicioDeCadena`.
- **Resultado de verificación**: `ok`, total de eventos y, si falla, posición, identificador y
  motivo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cualquier modificación de un evento guardado se detecta al verificar, en el 100 % de
  los casos probados.
- **SC-002**: Borrar un evento intermedio también se detecta.
- **SC-003**: Verificar 500 eventos toma menos de 2 segundos en un equipo de escritorio común.
- **SC-004**: Registrar un evento no retrasa la respuesta visible de la interfaz (la escritura es
  asíncrona).
- **SC-005**: La auditoría se puede exportar en un formato que abre cualquier hoja de cálculo.
