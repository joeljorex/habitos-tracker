# Hábitos Tracker Constitution

## Core Principles

### I. Especificación primero (NO NEGOCIABLE)

Toda funcionalidad nueva o cambio de comportamiento MUST iniciar con una especificación en
`specs/NNN-nombre/` creada con `/speckit-specify`, seguida de `/speckit-plan` y `/speckit-tasks`.
Ningún Pull Request con código de producto se integra a `develop` sin `spec.md`, `plan.md` y
`tasks.md` en su carpeta de feature. Si durante la implementación aparece una ambigüedad, se
actualiza la spec (o se ejecuta `/speckit-clarify`) antes de seguir codificando.

*Razón*: la spec es la fuente de verdad compartida entre integrantes y agentes de IA; evita
decisiones implícitas que después cuestan retrabajo.

### II. Pruebas como criterio de aceptación

Cada requisito funcional MUST mapear al menos a un caso de prueba `CP-xx` documentado en
`docs/casos-de-prueba.md`. Cuando el caso es automatizable, MUST existir una prueba automatizada
(unitaria o end-to-end) que corra en CI. La lógica de negocio crítica (rachas, sincronización)
MUST mantener una cobertura mínima del 70 %. Un PR con pruebas en rojo no se integra.

*Razón*: una prueba que corre en cada PR es la única evidencia verificable de que la spec se cumple.

### III. Offline-first e idempotencia

Los clientes (app Android y panel web) MUST funcionar con su almacenamiento local como fuente de
verdad inmediata. Las operaciones "marcar hábito como hecho" y de sincronización MUST ser
idempotentes: repetir la misma operación no crea registros duplicados ni altera las rachas.

*Razón*: el uso real ocurre con conectividad intermitente; la idempotencia hace seguros los
reintentos.

### IV. Dominio aislado y testeable

Las reglas de negocio (cálculo de rachas, validaciones de hábitos) MUST vivir en módulos puros,
sin dependencias de UI, red ni almacenamiento, con entradas y salidas explícitas. La UI solo
orquesta y presenta. Cada módulo de dominio MUST tener pruebas unitarias propias.

*Razón*: el mismo contrato de dominio se replica en Kotlin (app), PHP (API) y JavaScript (panel);
aislarlo permite verificarlo con casos idénticos en los tres.

### V. Infraestructura como código

Entornos de desarrollo (Codespaces / Docker), pipelines (GitHub Actions) y configuración de
servicios en la nube (Terraform) MUST estar versionados en el repositorio. Ninguna configuración
de infraestructura se hace "a mano" sin quedar reflejada en código o, si la plataforma no lo
permite, documentada paso a paso en `docs/`. Los secretos MUST vivir en GitHub Secrets o en las
variables del proveedor, nunca en el repositorio.

*Razón*: reproducibilidad ("en mi máquina sí funciona" deja de ser excusa) y auditoría de cambios.

### VI. Trazabilidad y simplicidad

Cada PR MUST referenciar su issue/ticket, la spec que implementa y los casos de prueba que cubre,
usando la plantilla de PR del repositorio. Los commits siguen Conventional Commits. Se implementa
lo mínimo que satisface la spec (YAGNI); cualquier complejidad adicional se justifica en la
sección *Complexity Tracking* del `plan.md`.

*Razón*: el equipo es de dos personas y el proyecto es evaluado por evidencia; la trazabilidad
requisito → spec → prueba → PR es parte del producto.

## Restricciones técnicas y de seguridad

- **App móvil**: Kotlin, Jetpack Compose, Room, Retrofit, WorkManager; minSdk 24, targetSdk 36.
- **API**: Laravel 13 (PHP 8.3+), MySQL 8.4, autenticación con Laravel Sanctum, ejecutada en Docker.
- **Panel web**: HTML, CSS y JavaScript con módulos ES, sin paso de compilación; librerías de
  terceros fijadas a versión exacta y copiadas en `web/vendor/`.
- **Pruebas**: JUnit/MockWebServer (app), PHPUnit (API), `node --test` (dominio JS) y
  Playwright (e2e web); Appium para e2e de la app nativa.
- **Guía interactiva**: driver.js, sin dependencias de CDN en tiempo de ejecución.
- **Infraestructura**: GitHub Actions, GitHub Codespaces (devcontainer), Terraform (proveedores
  GitHub y Railway), GitHub Pages para el panel web, Railway para la API, Firebase App
  Distribution para la app.
- **Accesibilidad**: todo control del panel web MUST tener etiqueta accesible, ser operable con
  teclado y anunciar errores de validación (`aria-live`).
- **Seguridad**: credenciales de demostración solo en el prototipo; ninguna contraseña real ni
  token se versiona; `.env` y `terraform.tfvars` están en `.gitignore`.

## Flujo de desarrollo y quality gates

1. Issue/ticket → rama `feature/<nombre>` creada desde `develop`.
2. `/speckit-specify` → `/speckit-clarify` (si hay dudas) → `/speckit-plan` → `/speckit-tasks`
   → `/speckit-analyze` (sin hallazgos críticos) → implementación (`/speckit-implement`).
3. PR hacia `develop` con la plantilla completa; revisión obligatoria del otro integrante.
4. CI en verde (pruebas web, API, app, validación de Terraform y estructura de specs) antes de
   integrar; `develop` y `main` protegidas contra push directo.
5. Release: PR `develop` → `main`; el pipeline de CD despliega y ejecuta smoke tests.

## Governance

Esta constitución prevalece sobre cualquier otra práctica del repositorio. Las enmiendas se
proponen por PR que modifique únicamente `.specify/memory/constitution.md`, con la etiqueta
`constitucion` y aprobación de ambos integrantes. El versionado sigue SemVer: MAJOR para
eliminar o redefinir principios, MINOR para agregar principios o secciones, PATCH para
aclaraciones. En cada revisión de PR se verifica el cumplimiento de los principios; las
excepciones se justifican en *Complexity Tracking* del plan correspondiente. La guía operativa
del día a día vive en `docs/sdd-implementation.md`.

**Version**: 1.0.0 | **Ratified**: 2026-09-11 | **Last Amended**: 2026-09-11
