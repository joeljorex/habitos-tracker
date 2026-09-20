# Research: Guía interactiva del panel web

## R1. Librería de guías

- **Decisión**: driver.js 1.8.0.
- **Razón**: licencia MIT, sin dependencias, JavaScript puro (funciona sin framework), ~5 KB
  comprimido, soporta progreso, navegación con teclado, textos personalizables y resaltado con
  superposición; es la herramienta que propone la asignatura.
- **Alternativas**:
  - *Intro.js*: madura, pero con licencia AGPL/comercial para proyectos no abiertos.
  - *Shepherd.js*: muy completa, más pesada (depende de Floating UI) y con más configuración.
  - *React Joyride*: exige React, que el panel no usa.
  - *Guía propia*: más código que mantener y probar.

## R2. Cómo cargar la librería

- **Decisión**: copiar el build IIFE de `node_modules/driver.js/dist/` a `web/vendor/driver.js/`
  (con su `LICENSE`) mediante `npm run vendor:driver`, y cargarlo con `<script>` clásico antes de
  `app.js`.
- **Razón**: el panel no tiene paso de compilación; servirlo desde el propio sitio cumple el
  principio V (sin CDN), funciona en GitHub Pages y en las pruebas sin red.
- **Alternativas**: CDN jsDelivr (dependencia externa en tiempo de ejecución), import map hacia
  `node_modules` (no se publica en Pages).

## R3. Cuándo mostrar la guía

- **Decisión**: automáticamente tras iniciar sesión si `habitos.v1.tourVisto` no existe; se marca
  como vista al completar o cerrar (evento de destrucción de driver.js).
- **Razón**: la pantalla de acceso no tiene nada que guiar; marcar también al cerrar evita que
  vuelva a aparecer a quien la descartó.
- **Alternativas**: mostrar solo con botón (el usuario nuevo no la descubre), marcar solo al
  completar (molesta a quien la cierra).

## R4. Pasos dinámicos

- **Decisión**: `resolverPasos(pasos, existe)` —función pura— filtra los pasos sin elemento y
  usa la alternativa cuando existe.
- **Razón**: el paso "Marcar hoy" no tiene botón cuando la lista está vacía; aislar la regla
  permite probarla con `node --test` sin navegador.
- **Alternativas**: pasos fijos (la guía se rompe con la lista vacía).

## R5. Cómo probar la guía

- **Decisión**: Playwright sobre las clases públicas del globo de driver.js
  (`.driver-popover`, `.driver-popover-title`, `.driver-popover-progress-text`,
  `.driver-popover-next-btn`, `.driver-popover-prev-btn`, `.driver-popover-close-btn`).
- **Razón**: son parte del API de estilos documentado de driver.js y no dependen de nuestro HTML.
- **Alternativas**: agregar `data-testid` dentro del globo (driver.js genera ese HTML).
