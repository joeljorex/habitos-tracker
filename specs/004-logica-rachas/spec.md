# Feature Specification: Módulo de rachas de hábitos

**Feature Branch**: `feature/004-logica-rachas`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: "Módulo de rachas: cálculo de racha actual y racha máxima de cada hábito a partir de los días completados"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reglas de racha correctas (Priority: P1)

Como usuario, quiero que mi racha cuente exactamente los días seguidos que cumplí un hábito,
que no se rompa antes de que termine el día y que mi mejor racha nunca se pierda, para confiar en
el número que veo.

**Why this priority**: es la regla de negocio con más ambigüedad del proyecto (señalada en la
propuesta de SDD); si está mal, todo lo demás pierde valor.

**Independent Test**: evaluar la tabla de casos de referencia (contrato) y comprobar que todos
dan el resultado esperado.

**Acceptance Scenarios**:

1. **Given** que cumplí un hábito el día 1 y el día 2, salté el día 3 y lo cumplo hoy (día 4),
   **When** consulto sus rachas, **Then** la racha actual es 1 y la mejor es 2. *(CP-04)*
2. **Given** que cumplí el hábito ayer pero todavía no hoy, **When** consulto la racha, **Then**
   la racha actual sigue contando los días hasta ayer. *(CP-13)*
3. **Given** que el último día cumplido fue anteayer, **When** consulto la racha, **Then** la
   racha actual es 0 y la mejor se conserva. *(CP-13)*
4. **Given** varios registros del mismo día, **When** se calcula la racha, **Then** ese día
   cuenta una sola vez.

---

### User Story 2 - Ver la racha en el panel (Priority: P1)

Como usuario, quiero ver en cada hábito mi racha actual y mi mejor racha, y que se actualicen al
marcar el día, para sentir el avance inmediatamente.

**Why this priority**: la racha es la motivación principal de una app de hábitos.

**Independent Test**: marcar un hábito y ver cómo cambian sus números sin recargar.

**Acceptance Scenarios**:

1. **Given** un hábito sin días cumplidos, **When** lo veo en la lista, **Then** muestra "Racha:
   0 días" y "Mejor: 0 días".
2. **Given** un hábito con racha de 2 días hasta ayer, **When** pulso "Marcar hoy", **Then**
   muestra "Racha: 3 días" sin recargar la página.

---

### User Story 3 - Explicación y contrato compartido (Priority: P2)

Como usuario nuevo quiero que la guía me explique qué es la racha; como equipo queremos que la
app Android y la API calculen exactamente lo mismo que el panel.

**Why this priority**: evita confusiones del usuario y discrepancias entre clientes.

**Independent Test**: abrir la guía y ver el paso de rachas; revisar que el contrato incluye la
tabla de casos lista para reutilizarse en Kotlin y PHP.

**Acceptance Scenarios**:

1. **Given** la guía del panel, **When** la recorro, **Then** hay un paso "Tu racha" antes del
   paso final.
2. **Given** la tabla de casos de referencia, **When** se implementa el cálculo en otro cliente,
   **Then** puede verificarse con los mismos casos sin reinterpretar reglas.

---

### Edge Cases

- Registros con fecha futura (por un reloj mal configurado): se ignoran.
- Registros desordenados: el resultado no depende del orden.
- Cambio de mes, de año y 29 de febrero en años bisiestos: los días siguen siendo consecutivos.
- Cambio de horario de verano: no afecta, porque se cuentan días calendario y no horas.
- Hábito sin registros: racha actual 0 y mejor racha 0.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Un día MUST contar como cumplido si existe al menos un registro del hábito con esa
  fecha (día calendario local).
- **FR-002**: La racha actual MUST ser la cantidad de días cumplidos consecutivos que terminan
  hoy; si hoy aún no está cumplido pero ayer sí, MUST terminar ayer; en cualquier otro caso MUST
  ser 0.
- **FR-003**: La mejor racha MUST ser la secuencia más larga de días cumplidos consecutivos en
  todo el historial, y MUST ser siempre mayor o igual que la racha actual.
- **FR-004**: Varios registros de la misma fecha MUST contar como un solo día.
- **FR-005**: Los registros con fecha posterior a hoy MUST ignorarse.
- **FR-006**: Sin registros, la racha actual y la mejor racha MUST ser 0.
- **FR-007**: El resultado MUST ser independiente del orden de los registros.
- **FR-008**: Los cambios de mes y de año, y el 29 de febrero, MUST tratarse como días consecutivos.
- **FR-009**: El panel MUST mostrar la racha actual y la mejor racha de cada hábito y
  actualizarlas al marcar el día, sin recargar.
- **FR-010**: La guía del panel MUST incluir un paso que explique la racha.
- **FR-011**: El cálculo MUST estar cubierto por pruebas unitarias con todos los casos de
  referencia del contrato y al menos 90 % de cobertura de líneas.

### Key Entities *(include if feature involves data)*

- **Racha**: valor derivado de los registros de un hábito, con dos números: actual y mejor. No se
  almacena; se calcula.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: el 100 % de los casos de referencia del contrato dan el resultado esperado.
- **SC-002**: al marcar un hábito, la racha visible cambia de inmediato (sin recargar).
- **SC-003**: 0 diferencias entre el panel, la app y la API al evaluar los mismos casos de
  referencia (cuando existan los otros clientes).
- **SC-004**: al menos 4 de 5 compañeros explican correctamente qué pasa con la racha si saltan
  un día después de ver la guía.

## Assumptions

- Todos los hábitos son diarios; frecuencias semanales o días de descanso quedan fuera de alcance.
- "Hoy" es la fecha calendario local del dispositivo.
- La racha se muestra por hábito; no hay racha global.
