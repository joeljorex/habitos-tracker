# Feature Specification: Métricas y alarmas de monitoreo

**Feature Branch**: `feature/005-metricas-monitoreo`

**Created**: 2026-10-01

**Status**: Draft

**Input**: User description: "Métricas para el monitoreo del sistema con alarmas y alertas: medir el
entorno de liberación y lo que hace la gente en el panel, y avisar cuando algo se sale de lo
esperado"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Saber si el panel publicado está arriba y responde a tiempo (Priority: P1)

Como responsable de la liberación, quiero ver en un tablero si el panel publicado responde y en
cuánto tiempo, y que me avise solo cuando se rompe un objetivo, para enterarme de una caída sin
tener que abrir la página a cada rato.

**Why this priority**: sin esto, el equipo se entera de una caída porque alguien se queja. Es el
mínimo que justifica hablar de "monitoreo del entorno de liberación".

**Independent Test**: levantar el stack (`npm run monitoreo:levantar`), abrir el tablero y ver la
disponibilidad y la latencia de los dos entornos; apagar el panel local y ver la alerta.

**Acceptance Scenarios**:

1. **Given** el stack de monitoreo levantado, **When** abro Grafana, **Then** el tablero muestra
   disponibilidad, latencia, código HTTP y días de certificado del panel publicado. *(CP-M01)*
2. **Given** el panel local sirviendo en `http://localhost:4173/`, **When** lo apago, **Then** a
   los 2 minutos la alerta `PanelCaido` pasa a *Firing* y aparece en Alertmanager. *(CP-M02)*
3. **Given** el panel vuelve a responder, **When** pasa una recolección, **Then** la alerta se
   resuelve sola sin intervención. *(CP-M02)*

---

### User Story 2 - Medir lo que la gente hace en el panel (Priority: P1)

Como equipo, queremos contar cuántos hábitos se crean y se marcan, cuánto tarda cada operación y
cuántos accesos se rechazan, para decidir con datos y no con impresiones.

**Why this priority**: el panel es una aplicación de navegador sin servidor propio; si no se mide
desde dentro, no hay ninguna métrica de uso.

**Independent Test**: usar el panel, abrir la pestaña **Métricas** del visor y ver los contadores y
las duraciones crecer.

**Acceptance Scenarios**:

1. **Given** que creo dos hábitos y marco uno, **When** abro la pestaña Métricas, **Then**
   `habitos_creados_total{resultado="exito"}` vale 2 y `habitos_marcados_total` vale 1. *(CP-M03)*
2. **Given** cualquier operación del panel, **When** termina, **Then** queda registrada su duración
   en `habitos_operacion_duracion_ms` con la etiqueta de la operación. *(CP-M03)*
3. **Given** las métricas acumuladas, **When** pulso «Descargar para Prometheus», **Then** obtengo
   un archivo en formato de texto de Prometheus con esas mismas series. *(CP-M04)*

---

### User Story 3 - Que el panel avise solo cuando algo se sale de lo normal (Priority: P2)

Como persona que revisa el panel, quiero ver en un vistazo si hay algo mal (errores, lentitud,
fallos al guardar, accesos rechazados) sin tener que leer todas las métricas.

**Why this priority**: una lista de números no es monitoreo; lo que sirve es la regla que dice
"esto ya no está bien".

**Independent Test**: fallar cuatro veces el inicio de sesión y ver la regla «Accesos rechazados»
en estado de alarma, con el botón del encabezado en rojo.

**Acceptance Scenarios**:

1. **Given** un panel recién abierto, **When** veo las alarmas, **Then** las cuatro reglas están en
   «Normal». *(CP-M05)*
2. **Given** cuatro intentos de acceso rechazados de cinco, **When** abro la pestaña Métricas,
   **Then** la regla «Accesos rechazados» está en «Alarma» con el valor 80,0 %. *(CP-M06)*
3. **Given** cualquier regla en alarma, **When** miro el encabezado, **Then** el botón
   «Observabilidad» muestra el punto rojo aunque el visor esté cerrado. *(CP-M06)*

---

### Edge Cases

- **Sin almacenamiento disponible** (modo privado o datos del sitio bloqueados): las métricas se
  tratan como vacías y el panel sigue funcionando; nunca lanza.
- **Datos corruptos** en `habitos.v1.metricas`: se descartan y se empieza de cero.
- **Sin acciones todavía**: la tasa de error es 0 % y no 0/0; ninguna regla alarma por falta de datos.
- **Pocos intentos de acceso**: con menos de 4 intentos la regla de accesos no opina (evita que un
  solo error de dedo dispare una alarma).
- **El panel local apagado** es una condición esperada, no un fallo del monitoreo: la alerta se
  dispara para `entorno="local"` y el entorno de producción sigue en verde.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE contar cada acción del panel en `habitos_acciones_total` etiquetada
  con la acción.
- **FR-002**: El sistema DEBE contar las creaciones (`habitos_creados_total`), marcados
  (`habitos_marcados_total`), eliminaciones (`habitos_eliminados_total`) y accesos
  (`habitos_accesos_total`), distinguiendo resultado exitoso de rechazado donde aplique.
- **FR-003**: El sistema DEBE registrar la duración de cada operación en
  `habitos_operacion_duracion_ms` (cuenta, suma, mínimo, máximo y promedio) y la del repintado en
  `habitos_render_duracion_ms`.
- **FR-004**: El sistema DEBE contar en `habitos_almacen_fallos_total` cada vez que el navegador no
  permita guardar.
- **FR-005**: Las etiquetas DEBEN producir la misma serie sin importar el orden en que se escriban.
- **FR-006**: El sistema DEBE poder exportar todas las métricas en el formato de texto de
  Prometheus, con las duraciones como resumen (`_count`, `_sum`, `_max`) en segundos.
- **FR-007**: El sistema DEBE evaluar cuatro reglas de alarma —tasa de error, latencia máxima,
  fallos al guardar y accesos rechazados— con estados «ok», «aviso» y «alarma».
- **FR-008**: Los umbrales de esas reglas DEBEN coincidir con los de `infra/monitoreo/prometheus/reglas.yml`
  y con los objetivos de `docs/niveles-de-servicio.md`.
- **FR-009**: El estado general (el peor de las reglas) DEBE verse en el encabezado aunque el visor
  esté cerrado.
- **FR-010**: El stack de monitoreo DEBE levantarse con un solo comando y aprovisionar solo su
  fuente de datos y su tablero, sin configuración manual.
- **FR-011**: El monitoreo DEBE sondear el panel publicado y el panel local, y alertar por caída,
  respuesta no exitosa, latencia alta y certificado por vencer.
- **FR-012**: La observabilidad NUNCA debe romper la aplicación observada: cualquier fallo al medir
  se descarta en silencio.

### Key Entities

- **Contador**: nombre, etiquetas y valor acumulado (solo crece).
- **Resumen de duración**: nombre, etiquetas, cuenta, suma, mínimo, máximo y promedio en milisegundos.
- **Regla de alarma**: identificador, título, estado, valor actual, umbral y descripción en lenguaje
  claro.
- **Sonda**: objetivo (URL), entorno, éxito, duración, código HTTP y vencimiento del certificado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una caída del panel se detecta y se notifica en menos de 3 minutos.
- **SC-002**: El tablero muestra la disponibilidad de las últimas 24 h con el objetivo de 99 %.
- **SC-003**: Las cuatro reglas del panel y las seis alertas de Prometheus están cubiertas por
  pruebas automatizadas (unitarias y end-to-end) o por `promtool check rules` en la integración.
- **SC-004**: Levantar todo el monitoreo en una máquina limpia toma un solo comando y menos de
  5 minutos.
- **SC-005**: Con el almacenamiento bloqueado, el panel sigue funcionando y no aparece ningún error
  en la consola.
