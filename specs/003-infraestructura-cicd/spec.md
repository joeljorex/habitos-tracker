# Feature Specification: Infraestructura como código y pipelines CI/CD

**Feature Branch**: `feature/003-infraestructura-cicd`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: "Infraestructura como código y pipelines CI/CD: entorno Codespaces, Terraform multi-proveedor y despliegue continuo del panel web"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Integración continua que bloquea cambios defectuosos (Priority: P1)

Como integrante del equipo, cuando abro un Pull Request hacia `develop` o `main`, quiero que el
sistema ejecute automáticamente las verificaciones de todos los componentes que existen en el
repositorio (panel web, API, app, infraestructura y specs) y que el PR no pueda integrarse si
alguna falla.

**Why this priority**: sin esta barrera los demás pilotos (pruebas e2e, tour, rachas) no tienen
evidencia de ejecución y el flujo `feature/* → develop → main` documentado no se cumple.

**Independent Test**: abrir un PR con una prueba que falla a propósito y comprobar que el check
queda en rojo y que GitHub bloquea el botón de merge.

**Acceptance Scenarios**:

1. **Given** un PR hacia `develop` que modifica el panel web, **When** se abre o se actualiza,
   **Then** se ejecutan sus pruebas unitarias y end-to-end y el reporte queda disponible como
   artefacto descargable.
2. **Given** un componente que todavía no tiene código (por ejemplo, `api/` solo contiene
   `.gitkeep`), **When** corre la integración continua, **Then** su verificación se reporta como
   omitida y no como fallida.
3. **Given** que una prueba falla, **When** termina la integración continua, **Then** el PR queda
   bloqueado para merge.
4. **Given** una carpeta de `specs/` a la que le falta `tasks.md`, **When** corre la integración
   continua, **Then** la verificación de specs falla indicando la carpeta y el archivo faltante.

---

### User Story 2 - Despliegue continuo del panel web con aprobación (Priority: P1)

Como equipo, cuando `develop` se integra a `main`, queremos que el panel web se publique solo si
pasan todas las pruebas y un smoke test, y que la publicación a producción espere la aprobación
de un integrante.

**Why this priority**: es la estrategia de despliegue que evalúa la asignatura y la que permite al
docente abrir el panel publicado.

**Independent Test**: integrar un cambio visible a `main`, aprobar el ambiente de producción y
abrir la URL pública para comprobar el cambio.

**Acceptance Scenarios**:

1. **Given** un merge a `main`, **When** inicia el despliegue, **Then** se ejecuta de nuevo la
   integración continua completa y, si falla, no se publica nada.
2. **Given** la integración continua en verde, **When** se empaqueta el panel, **Then** se
   ejecutan los smoke tests contra ese mismo paquete servido en un ambiente temporal (staging).
3. **Given** smoke tests en verde, **When** un revisor aprueba el ambiente `production`, **Then**
   el panel se publica y se verifica que la URL pública responde y muestra el panel.
4. **Given** que aún no existen `api/Dockerfile` ni `app/gradlew`, **When** corre el despliegue,
   **Then** las etapas de API y de app se omiten sin error.

---

### User Story 3 - Entorno de desarrollo reproducible en la nube (Priority: P2)

Como integrante (o como docente que revisa el proyecto), quiero abrir el repositorio en un
entorno en la nube que ya tenga todas las herramientas instaladas, para correr las pruebas y
levantar el panel sin configurar mi computadora.

**Why this priority**: elimina diferencias entre máquinas (por ejemplo, PHP 8.2 instalado
localmente contra el 8.3 que exige la API) y sirve como ambiente de demostración.

**Independent Test**: crear un Codespace nuevo y ejecutar la suite de pruebas sin instalar nada
manualmente.

**Acceptance Scenarios**:

1. **Given** un Codespace recién creado, **When** termina la preparación automática, **Then**
   están disponibles Node, PHP 8.3, Python con `uv` y Spec Kit, Terraform y el navegador de
   pruebas, y `npm test` pasa.
2. **Given** el panel levantado dentro del Codespace, **When** se abre la pestaña de puertos,
   **Then** el puerto del panel aparece etiquetado y puede compartirse para una demostración.

---

### User Story 4 - Configuración de la nube declarada como código (Priority: P2)

Como dueño del repositorio, quiero que la protección de ramas, los ambientes de despliegue y el
proyecto de la API en el proveedor de nube estén declarados como código, para recrearlos con un
comando y revisar sus cambios en PRs.

**Why this priority**: cumple el principio V de la constitución y reemplaza la sección "a
configurar en GitHub" del flujo actual por algo verificable.

**Independent Test**: validar la infraestructura sin credenciales y, con un token de
administrador, aplicar el plan y comprobar las reglas en la configuración del repositorio.

**Acceptance Scenarios**:

1. **Given** la definición de infraestructura, **When** corre la integración continua, **Then**
   se validan su formato y su sintaxis sin necesitar credenciales.
2. **Given** un token con permisos de administración, **When** se aplica la infraestructura,
   **Then** `develop` y `main` exigen PR, una aprobación y los checks requeridos, y existen los
   ambientes `staging` y `production` (este último con revisores).
3. **Given** que el proveedor de la API está desactivado (valor por defecto), **When** se genera
   el plan, **Then** no se crea ningún recurso en ese proveedor.

---

### Edge Cases

- PR que viene de un fork: la integración continua no necesita secretos, así que corre igual; el
  despliegue nunca corre en PRs.
- Dos pushes seguidos a `main`: un despliegue en curso no se cancela a medias; las ejecuciones de
  CI obsoletas de un mismo PR sí se cancelan.
- Falla la verificación posterior a la publicación: el pipeline queda en rojo y el rollback
  consiste en volver a ejecutar el despliegue del commit anterior (documentado en el quickstart).
- Faltan los secretos del proveedor de la API o de distribución de la app: esas etapas se omiten
  con un aviso en el resumen de la ejecución, sin marcar falla.
- GitHub Pages no está habilitado en el repositorio: la publicación falla con un mensaje claro y
  el quickstart indica cómo habilitarlo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La integración continua MUST ejecutarse en cada PR hacia `main` y `develop` y en
  cada push a `develop`, y MUST poder invocarse desde el pipeline de despliegue.
- **FR-002**: La integración continua MUST detectar qué componentes existen (panel web, API, app,
  infraestructura) y ejecutar solo las verificaciones aplicables; las no aplicables MUST
  reportarse como omitidas, nunca como fallidas.
- **FR-003**: Para el panel web, la integración continua MUST ejecutar pruebas unitarias y
  pruebas end-to-end en navegador sin interfaz, y publicar el reporte HTML como artefacto
  descargable durante 14 días.
- **FR-004**: La integración continua MUST validar el formato y la sintaxis de la infraestructura
  como código sin requerir credenciales.
- **FR-005**: La integración continua MUST verificar que cada carpeta de `specs/` contiene
  `spec.md`, `plan.md` y `tasks.md`.
- **FR-006**: El despliegue MUST ejecutarse solo en push a `main` o manualmente, y su primera
  etapa MUST ser la integración continua completa.
- **FR-007**: El despliegue MUST ejecutar smoke tests contra el paquete construido antes de
  publicarlo.
- **FR-008**: La publicación a producción MUST requerir la aprobación manual de un revisor.
- **FR-009**: Después de publicar, el despliegue MUST verificar que la URL pública responde y
  muestra el panel.
- **FR-010**: El despliegue de la API y la distribución de la app MUST estar definidos en el
  pipeline y activarse solos cuando existan su código y sus secretos.
- **FR-011**: El repositorio MUST incluir la definición de un entorno de desarrollo en la nube con
  todas las herramientas del proyecto.
- **FR-012**: La protección de ramas y los ambientes de despliegue MUST declararse como código;
  los recursos del proveedor de la API MUST ser opcionales mediante una variable.
- **FR-013**: Ningún secreto MUST versionarse; los archivos de variables reales de la
  infraestructura MUST estar ignorados por git.
- **FR-014**: Los pipelines MUST pasar un linter de GitHub Actions sin errores.

### Key Entities *(include if feature involves data)*

- **Pipeline de integración continua**: conjunto de verificaciones por componente; entrada: un
  commit; salida: un estado por verificación y artefactos (reporte de pruebas).
- **Pipeline de despliegue**: etapas encadenadas CI → paquete → staging → aprobación →
  producción → verificación.
- **Ambiente**: destino de despliegue con reglas propias (`staging`, `production` con revisores,
  `github-pages` administrado por GitHub).
- **Regla de protección de rama**: rama, PR obligatorio, número de aprobaciones y verificaciones
  requeridas.
- **Secreto**: credencial de un proveedor guardada fuera del repositorio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: el 100 % de los PRs hacia `develop` o `main` muestran el resultado de todas sus
  verificaciones en menos de 10 minutos.
- **SC-002**: 0 merges a `develop` o `main` con verificaciones en rojo durante el periodo del curso.
- **SC-003**: un integrante nuevo tiene el entorno listo para correr las pruebas en menos de 10
  minutos desde que abre el Codespace, sin instalar nada manualmente.
- **SC-004**: desde el merge a `main` hasta el panel publicado (sin contar la espera de
  aprobación) transcurren menos de 10 minutos.
- **SC-005**: recrear la configuración de ramas y ambientes requiere un solo comando.

## Assumptions

- La asignatura exige GitHub Actions, Codespaces y Terraform; por eso esos nombres aparecen en la
  spec como restricción externa y no como decisión de implementación.
- El repositorio es público: GitHub Pages, la protección de ramas y los ambientes con revisores
  están disponibles sin costo.
- La API y la app todavía no tienen código; sus etapas quedan preparadas y se activan solas.
- La API se desplegará en Railway (decisión previa de `docs/estrategia-despliegue.md`); su
  proveedor de Terraform es comunitario y por eso queda desactivado por defecto.
- GitHub Pages admite un solo sitio por repositorio, por lo que el staging del panel web es un
  servidor temporal dentro del runner de CI.
- El estado de Terraform se guarda localmente (alcance académico); un backend remoto queda como
  mejora futura.
