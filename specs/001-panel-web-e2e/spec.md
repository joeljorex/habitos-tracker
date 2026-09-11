# Feature Specification: Panel web de hábitos verificado con pruebas end-to-end

**Feature Branch**: `feature/panel-web-e2e-tour`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: "Panel web de hábitos verificado con pruebas end-to-end automatizadas que cubren los casos de prueba del proyecto y se ejecutan en CI"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acceso al panel (Priority: P1)

Como usuario, quiero entrar al panel con mi correo y contraseña para ver y administrar mis
hábitos desde cualquier computadora, y poder cerrar sesión al terminar.

**Why this priority**: todas las demás historias ocurren dentro del panel; sin acceso no hay
producto que probar.

**Independent Test**: abrir el panel, iniciar sesión con la cuenta de demostración, ver el panel
y cerrar sesión.

**Acceptance Scenarios**:

1. **Given** la pantalla de acceso, **When** ingreso la cuenta de demostración, **Then** veo el
   panel con mi correo en el encabezado. *(CP-10)*
2. **Given** la pantalla de acceso, **When** ingreso un correo o una contraseña incorrectos,
   **Then** veo "Correo o contraseña incorrectos." y sigo en la pantalla de acceso. *(CP-05)*
3. **Given** que estoy en el panel, **When** pulso "Cerrar sesión", **Then** regreso a la
   pantalla de acceso. *(CP-10)*

---

### User Story 2 - Registrar y ver hábitos (Priority: P1)

Como usuario, quiero crear hábitos con un nombre y verlos en una lista, para tener claro qué
quiero cumplir cada día.

**Why this priority**: es el núcleo del producto; sin hábitos no hay seguimiento ni rachas.

**Independent Test**: crear un hábito, verlo en la lista, recargar la página y seguir viéndolo.

**Acceptance Scenarios**:

1. **Given** que no tengo hábitos, **When** entro al panel, **Then** veo "Aún no tienes hábitos.
   Crea el primero."
2. **Given** el formulario de nuevo hábito, **When** guardo con el nombre vacío o solo espacios,
   **Then** veo "Escribe un nombre para el hábito." y no se crea nada. *(CP-01)*
3. **Given** el formulario, **When** guardo un nombre de más de 60 caracteres, **Then** veo "El
   nombre puede tener máximo 60 caracteres." y no se crea nada. *(CP-07)*
4. **Given** que ya existe "Tomar agua", **When** intento crear " tomar AGUA ", **Then** veo
   "Ya tienes un hábito con ese nombre." y no se crea nada. *(CP-09)*
5. **Given** que creé hábitos, **When** recargo la página o vuelvo a iniciar sesión, **Then** los
   hábitos siguen en la lista en el orden en que los creé. *(CP-08)*

---

### User Story 3 - Marcar un hábito como hecho hoy (Priority: P1)

Como usuario, quiero marcar un hábito como hecho en el día, una sola vez, para registrar mi
avance sin preocuparme por pulsar dos veces.

**Why this priority**: es la acción diaria principal y la base del cálculo de rachas.

**Independent Test**: marcar un hábito, intentar marcarlo otra vez y comprobar que el total de
días cumplidos solo aumentó en uno.

**Acceptance Scenarios**:

1. **Given** un hábito no marcado hoy, **When** pulso "Marcar hoy", **Then** el botón cambia a
   "Hecho hoy ✓", queda deshabilitado y el hábito muestra "1 día cumplido".
2. **Given** un hábito ya marcado hoy, **When** intento marcarlo de nuevo (doble clic o tras
   recargar), **Then** no se crea otro registro y el total de días no cambia. *(CP-02)*

---

### User Story 4 - Eliminar un hábito (Priority: P2)

Como usuario, quiero eliminar un hábito que ya no me interesa, confirmando antes, para mantener
mi lista limpia sin borrar algo por accidente.

**Why this priority**: importante para el uso real, pero el producto sirve sin ella.

**Independent Test**: eliminar un hábito con historial, confirmar, y comprobar que desaparece
junto con su historial; repetir cancelando y comprobar que se conserva.

**Acceptance Scenarios**:

1. **Given** un hábito con días cumplidos, **When** pulso "Eliminar" y confirmo, **Then** el
   hábito y su historial desaparecen, también después de recargar. *(CP-06)*
2. **Given** el diálogo de confirmación, **When** cancelo, **Then** el hábito sigue en la lista.

---

### User Story 5 - Suite end-to-end automatizada y trazable (Priority: P1)

Como integrante del equipo, quiero ejecutar con un solo comando todas las pruebas del panel,
local y en CI, y que cada prueba diga qué caso de prueba cubre, para demostrar que el panel
cumple la spec en cada PR.

**Why this priority**: es el objetivo del piloto a) "pruebas automáticas" de la asignatura.

**Independent Test**: ejecutar la suite y abrir el reporte HTML; cada prueba empieza con su ID
`CP-xx` y todas pasan en tamaño escritorio y móvil.

**Acceptance Scenarios**:

1. **Given** el repositorio recién clonado, **When** ejecuto el comando de pruebas, **Then** se
   ejecutan las pruebas unitarias y end-to-end y se genera un reporte HTML.
2. **Given** la suite, **When** filtro solo las pruebas smoke, **Then** puedo ejecutarlas contra
   cualquier URL (local, staging o producción).
3. **Given** que el panel se publica bajo una subruta, **When** corro las pruebas smoke contra
   esa URL, **Then** pasan igual que en local.

---

### Edge Cases

- Datos guardados corruptos (JSON inválido) en el navegador: el panel arranca con listas vacías
  en lugar de romperse.
- Doble clic muy rápido en "Marcar hoy": un solo registro.
- Cambio de día con el panel abierto: al volver a pintar la lista (por ejemplo, tras marcar otro
  hábito o recargar) el botón vuelve a "Marcar hoy".
- Nombre con espacios al inicio o al final: se recortan antes de validar y guardar.
- Usuario que no inició sesión y abre el panel directamente: ve la pantalla de acceso.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST pedir correo y contraseña antes de mostrar los hábitos; en este
  prototipo la única cuenta válida es la de demostración.
- **FR-002**: Ante credenciales inválidas, el sistema MUST mostrar "Correo o contraseña
  incorrectos." sin indicar cuál de los dos campos falló.
- **FR-003**: Los usuarios MUST poder crear un hábito con un nombre de 1 a 60 caracteres después
  de recortar espacios.
- **FR-004**: El sistema MUST rechazar nombres vacíos, de más de 60 caracteres o duplicados (sin
  distinguir mayúsculas ni espacios extremos), con el mensaje específico de cada caso, anunciado
  a lectores de pantalla.
- **FR-005**: El sistema MUST mostrar los hábitos en orden de creación o, si no hay, el mensaje
  "Aún no tienes hábitos. Crea el primero."
- **FR-006**: Los usuarios MUST poder marcar un hábito como hecho en el día actual; la operación
  MUST ser idempotente (como máximo un registro por hábito y fecha).
- **FR-007**: El sistema MUST mostrar para cada hábito si ya está hecho hoy y su total de días
  cumplidos ("1 día cumplido", "N días cumplidos").
- **FR-008**: Los usuarios MUST poder eliminar un hábito tras confirmar; se eliminan también sus
  registros.
- **FR-009**: El sistema MUST conservar hábitos y registros en el dispositivo entre recargas y
  sesiones.
- **FR-010**: Los usuarios MUST poder cerrar sesión.
- **FR-011**: Cada caso de prueba web (CP-01, CP-02, CP-05 a CP-10) MUST tener al menos una
  prueba automatizada cuyo título inicia con su ID.
- **FR-012**: La suite MUST ejecutarse con un solo comando, local y en CI, en tamaño escritorio y
  móvil, y generar un reporte HTML.
- **FR-013**: Un subconjunto marcado como smoke MUST poder ejecutarse contra cualquier URL.
- **FR-014**: El panel MUST funcionar publicado bajo una subruta del dominio.
- **FR-015**: Todos los controles MUST ser operables con teclado y tener una etiqueta accesible.

### Key Entities *(include if feature involves data)*

- **Hábito**: algo que el usuario quiere hacer a diario; tiene identificador, nombre único y
  fecha de creación.
- **Registro de cumplimiento**: constancia de que un hábito se hizo en un día calendario;
  pertenece a un hábito; como máximo uno por hábito y día.
- **Sesión**: usuario que inició sesión en la pestaña actual.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: un usuario nuevo crea su primer hábito y lo marca como hecho en menos de 1 minuto.
- **SC-002**: el 100 % de los casos web listados en FR-011 están automatizados y en verde en cada PR.
- **SC-003**: la suite completa se ejecuta en menos de 3 minutos en CI.
- **SC-004**: 0 registros duplicados tras marcar el mismo hábito cualquier número de veces en un día.
- **SC-005**: todo el flujo principal (acceso, crear, marcar, eliminar, cerrar sesión) se puede
  completar solo con teclado.

## Assumptions

- Prototipo sin backend: los datos viven en el navegador y el modelo coincide con el de la API
  (`habits`, `habit_logs`), para conectarlo cuando exista.
- Autenticación simulada con una cuenta de demostración (`demo@habitos.app` / `Habitos123`); en la
  fase de API se reemplaza por Laravel Sanctum.
- El "día" es la fecha calendario local del dispositivo.
- La sincronización sin conexión (CP-03) aplica a la app Android; el panel web no la implementa.
- Un usuario por navegador.
