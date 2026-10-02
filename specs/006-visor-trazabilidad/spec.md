# Feature Specification: Visor de trazabilidad (registros y trazas)

**Feature Branch**: `feature/006-visor-trazabilidad`

**Created**: 2026-10-01

**Status**: Draft

**Input**: User description: "Visor de trazabilidad con logs y tracers: poder seguir qué pasó
dentro de una operación del panel y en qué paso se fue el tiempo o falló"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Seguir una operación completa (Priority: P1)

Como persona que da soporte, quiero abrir una operación —por ejemplo «crear hábito»— y ver sus
pasos con la duración de cada uno, para saber qué se hizo y dónde se fue el tiempo sin tener que
leer el código.

**Why this priority**: es la diferencia entre "la aplicación falló" y "falló al guardar el hábito,
en el paso de escritura, a las 18:51".

**Independent Test**: crear un hábito, abrir la pestaña **Trazabilidad** y ver la traza con sus
tres pasos y sus tiempos.

**Acceptance Scenarios**:

1. **Given** que creo un hábito, **When** abro la pestaña Trazabilidad, **Then** aparece una traza
   «crear hábito» en estado `ok` con sus pasos «leer hábitos», «validar nombre» y «guardar
   hábitos», cada uno con su duración. *(CP-T01)*
2. **Given** una operación que falla, **When** veo su traza, **Then** la traza y el paso quedan en
   estado `error` con el mensaje. *(CP-T02)*
3. **Given** pasos anidados, **When** los veo en la traza, **Then** se muestra la jerarquía (un
   paso dentro de otro). *(CP-T01)*

---

### User Story 2 - Correlacionar registros con su operación (Priority: P1)

Como persona que da soporte, quiero que cada registro diga a qué operación pertenece y poder
filtrar la bitácora por esa operación, para no adivinar qué líneas van juntas.

**Why this priority**: sin correlación, una bitácora es una lista de frases sueltas.

**Independent Test**: elegir una traza y comprobar que la bitácora solo muestra los registros de
esa operación.

**Acceptance Scenarios**:

1. **Given** un registro escrito durante una operación, **When** lo veo en la bitácora, **Then**
   muestra el identificador de su traza. *(CP-T03)*
2. **Given** que elijo una traza, **When** miro la bitácora, **Then** solo quedan los registros de
   esa traza y aparece un aviso con el identificador. *(CP-T03)*
3. **Given** el filtro activo, **When** pulso «Ver toda la bitácora», **Then** vuelven todos los
   registros. *(CP-T03)*

---

### User Story 3 - Buscar en la bitácora (Priority: P2)

Como persona que da soporte, quiero filtrar por nivel y buscar texto en el mensaje o en el
contexto, para llegar rápido a lo que me interesa.

**Why this priority**: con 300 entradas, leer todo no es opción.

**Independent Test**: filtrar por nivel «error» y comprobar que la lista queda vacía o solo con
errores.

**Acceptance Scenarios**:

1. **Given** registros de varios niveles, **When** filtro por «aviso», **Then** solo veo avisos.
2. **Given** un registro con `codigo=QUOTA` en su contexto, **When** busco «QUOTA», **Then**
   aparece ese registro. *(CP-T04)*
3. **Given** una búsqueda sin resultados, **When** la aplico, **Then** veo un mensaje de lista
   vacía, no una tabla en blanco.

---

### Edge Cases

- **Operación interrumpida**: si se abre una traza nueva sin cerrar la anterior, la anterior se
  guarda como `incompleta` en lugar de perderse.
- **Paso fuera de una traza**: no rompe nada y no genera basura.
- **Memoria acotada**: la bitácora conserva las últimas 300 entradas y las trazas las últimas 100.
- **Entradas corruptas** en el almacenamiento: se descartan al leer.
- **Sin almacenamiento**: registrar no lanza y el visor muestra las listas vacías.
- **Datos personales**: los registros guardan el correo de la cuenta de demostración y nombres de
  hábitos; no se guardan contraseñas en ningún caso.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE registrar entradas con fecha ISO, nivel, mensaje y contexto
  estructurado.
- **FR-002**: Los niveles DEBEN ser `depuracion`, `info`, `aviso` y `error`; un nivel desconocido se
  trata como `info` en vez de perder la entrada.
- **FR-003**: Cada entrada DEBE guardar el identificador de la traza y del paso en curso, o `null`
  si no hay ninguno.
- **FR-004**: El sistema DEBE permitir envolver una operación en una traza con pasos anidados, y
  medir la duración de cada uno.
- **FR-005**: Una traza DEBE terminar en estado `ok`, `error` o `incompleta`, y conservar el mensaje
  de error cuando lo haya.
- **FR-006**: Un error dentro de una traza DEBE marcarse y volver a lanzarse, sin alterar el
  comportamiento de la aplicación.
- **FR-007**: El sistema DEBE conservar como máximo 300 entradas y 100 trazas, descartando las más
  antiguas.
- **FR-008**: El visor DEBE listar las trazas de la más reciente a la más antigua, con nombre,
  hora, duración, estado, número de pasos e identificador.
- **FR-009**: El visor DEBE permitir filtrar la bitácora por nivel, por texto (mensaje o contexto) y
  por traza seleccionada.
- **FR-010**: El visor DEBE permitir exportar la bitácora completa en JSON.
- **FR-011**: La trazabilidad NUNCA debe romper la aplicación observada.

### Key Entities

- **Entrada de bitácora**: id, fecha, nivel, mensaje, contexto, `trazaId`, `spanId`.
- **Traza**: id, nombre, atributos, fecha, duración, estado, error y lista de pasos.
- **Paso (span)**: id, `padreId`, nombre, atributos, duración y estado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde un registro cualquiera se llega a la operación completa que lo produjo en un
  solo clic.
- **SC-002**: Una operación del panel deja traza con todos sus pasos en el 100 % de los casos
  (verificado por pruebas end-to-end).
- **SC-003**: El almacenamiento usado por la observabilidad no crece sin límite: 300 entradas y
  100 trazas como máximo.
- **SC-004**: Con el almacenamiento bloqueado, el panel sigue funcionando sin errores en consola.
