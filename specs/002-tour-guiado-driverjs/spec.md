# Feature Specification: Guía interactiva del panel web

**Feature Branch**: `feature/panel-web-e2e-tour`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: "Guía interactiva (tour) que explica el panel web la primera vez que el usuario entra y que puede relanzarse cuando quiera"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guía en la primera visita (Priority: P1)

Como usuario que entra por primera vez, quiero que el panel me muestre paso a paso para qué
sirve cada parte, para empezar a usarlo sin leer instrucciones.

**Why this priority**: es el objetivo del piloto b) de la asignatura y reduce el abandono en el
primer uso.

**Independent Test**: iniciar sesión en un navegador sin datos y recorrer la guía hasta el final.

**Acceptance Scenarios**:

1. **Given** que nunca he visto la guía en este dispositivo, **When** inicio sesión, **Then** la
   guía empieza sola resaltando el formulario de nuevo hábito y mostrando "1 de N". *(CP-11)*
2. **Given** la guía abierta, **When** pulso "Siguiente" hasta el final, **Then** recorro el
   formulario, la lista, el botón para marcar, y el botón "Ver guía", y el último paso ofrece
   "Listo". *(CP-11)*
3. **Given** la guía abierta, **When** pulso "Anterior", **Then** regreso al paso previo.
4. **Given** que todavía no tengo hábitos, **When** llega el paso de marcar, **Then** la guía
   explica el botón "Marcar hoy" sobre la lista en lugar de romperse.

---

### User Story 2 - No repetir y poder relanzar (Priority: P1)

Como usuario que ya vio la guía, no quiero que vuelva a aparecer sola, pero sí poder abrirla
cuando la necesite.

**Why this priority**: una guía que aparece siempre se vuelve un estorbo; una que no se puede
repetir deja sin ayuda a quien la cerró por error.

**Independent Test**: completar o cerrar la guía, recargar, comprobar que no aparece, y abrirla
con "Ver guía".

**Acceptance Scenarios**:

1. **Given** que completé la guía, **When** recargo o vuelvo a iniciar sesión, **Then** la guía
   no aparece sola. *(CP-12)*
2. **Given** que cerré la guía con la X o con la tecla Esc, **When** recargo, **Then** tampoco
   aparece sola. *(CP-12)*
3. **Given** que ya vi la guía, **When** pulso "Ver guía", **Then** empieza de nuevo desde el
   primer paso. *(CP-12)*

---

### User Story 3 - Guía extensible por módulo (Priority: P2)

Como integrante del equipo, quiero que cada módulo nuevo agregue su propio paso a la guía sin
modificar cómo funciona la guía, para que la ayuda crezca junto con el producto.

**Why this priority**: mantiene la guía al día sin retrabajo; se comprueba cuando la spec 004
(rachas) agrega su paso.

**Independent Test**: agregar un paso de ejemplo en el registro de pasos y verlo en la guía sin
tocar el motor.

**Acceptance Scenarios**:

1. **Given** el registro de pasos, **When** un módulo agrega un paso antes de "Ver guía",
   **Then** la guía lo muestra en esa posición y el total de pasos se actualiza.
2. **Given** un paso cuyo elemento no está en pantalla y no tiene alternativa, **When** se abre
   la guía, **Then** ese paso se omite y la guía sigue funcionando.

---

### Edge Cases

- El usuario cierra sesión con la guía abierta: la guía se cierra.
- Se pulsa "Ver guía" con la guía ya abierta: no se abren dos guías superpuestas.
- El navegador no permite guardar datos locales: la guía se muestra al iniciar sesión, pero
  nunca bloquea el uso del panel.
- Pantalla de móvil: los globos de la guía se reacomodan para quedar visibles.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La guía MUST iniciar sola después del primer inicio de sesión en el dispositivo.
- **FR-002**: Cada paso MUST resaltar un elemento y explicarlo con un título y una descripción
  breve en español.
- **FR-003**: La guía MUST permitir avanzar, retroceder y cerrarse (botón y tecla Esc) y mostrar
  el progreso como "n de total".
- **FR-004**: Al completarse o cerrarse, la guía MUST quedar registrada como vista en el
  dispositivo y no iniciar sola otra vez.
- **FR-005**: Los usuarios MUST poder relanzar la guía desde el botón "Ver guía" en cualquier momento.
- **FR-006**: Un paso cuyo elemento no existe MUST usar su explicación alternativa si la tiene o,
  si no, omitirse, sin interrumpir la guía.
- **FR-007**: Los pasos MUST definirse en un único registro; agregar un paso MUST NOT requerir
  cambios en el motor de la guía.
- **FR-008**: La guía MUST funcionar sin conexión a servicios externos (sus recursos se sirven
  desde el propio sitio) y con una versión fija de sus componentes.
- **FR-009**: La guía MUST poder recorrerse solo con teclado (flechas y Esc).
- **FR-010**: Los casos CP-11 y CP-12 MUST tener pruebas automatizadas.

### Key Entities *(include if feature involves data)*

- **Paso de guía**: elemento a resaltar, título, descripción y, opcionalmente, una explicación
  alternativa si el elemento no está presente.
- **Estado de la guía**: indica si la guía ya se vio en este dispositivo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: al menos 4 de 5 compañeros que prueban el panel por primera vez completan la guía
  sin ayuda.
- **SC-002**: recorrer la guía completa leyendo todo toma menos de 60 segundos.
- **SC-003**: 0 apariciones automáticas de la guía después de marcarse como vista (verificado
  por CP-12).
- **SC-004**: agregar el paso de un módulo nuevo requiere menos de 10 líneas de cambio
  (verificado al integrar la spec 004).

## Assumptions

- "Vista" se guarda por dispositivo/navegador, no por cuenta (no hay backend todavía).
- La guía solo aplica al panel (después de iniciar sesión); la pantalla de acceso no la necesita.
- Los textos están en español; no se requiere otro idioma en este curso.
