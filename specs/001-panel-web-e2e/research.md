# Research: Panel web de hábitos verificado con pruebas end-to-end

Fase 0 de `/speckit-plan`. Formato Decisión / Razón / Alternativas.

## R1. Herramienta de pruebas end-to-end

- **Decisión**: Playwright (`@playwright/test` 1.63.0).
- **Razón**: espera automática de elementos (menos pruebas intermitentes), API de reloj
  (`page.clock`) para simular días —indispensable para rachas—, emulación de dispositivos
  móviles, reporte HTML y *trace viewer* incluidos, ejecución paralela gratuita en GitHub
  Actions y un servidor MCP oficial (Playwright MCP) que permite a un agente de IA explorar el
  panel y proponer pruebas, tal como sugiere la asignatura ("playwright + MCP-IA").
- **Alternativas**:
  - *Selenium WebDriver*: estándar W3C y base de Appium (que el proyecto usará para la app
    Android), pero requiere más código de sincronización y gestión de drivers.
  - *Cypress*: buena experiencia local, pero limitado a una pestaña/origen, sin API de reloj tan
    directa para fechas y con funciones de paralelización en su servicio de pago.
  - *Katalon*: bajo código y útil para testers manuales, pero la ejecución en CI requiere
    licencia de Runtime Engine y los proyectos no son tan fáciles de revisar en un PR.

## R2. Tecnología del panel

- **Decisión**: HTML + CSS + JavaScript con módulos ES, sin framework ni compilación.
- **Razón**: el panel tiene 2 pantallas; se publica como archivos estáticos en GitHub Pages sin
  paso de build; cualquier integrante puede leerlo. Cumple el principio de simplicidad.
- **Alternativas**: React/Vue con Vite (compilación, más dependencias); Laravel Blade (exige que
  la API exista primero).

## R3. Persistencia del prototipo

- **Decisión**: `localStorage` con claves versionadas `habitos.v1.*`; sesión en `sessionStorage`.
- **Razón**: datos pequeños, API síncrona y simple; el prefijo con versión permite migrar el
  formato y evita choques con otros sitios del mismo dominio `github.io`.
- **Alternativas**: IndexedDB (asíncrona, innecesaria para este volumen); consumir la API
  (todavía no existe).

## R4. Autenticación

- **Decisión**: simulada con una cuenta de demostración.
- **Razón**: permite automatizar CP-05 y CP-10 hoy; el contrato de pantalla no cambia cuando se
  conecte Laravel Sanctum.
- **Alternativas**: Firebase Auth (otra plataforma y otra configuración), sin acceso (dejaría sin
  cubrir los casos de autenticación).

## R5. Pruebas unitarias del dominio

- **Decisión**: `node --test` (ejecutor integrado de Node).
- **Razón**: cero dependencias; el mismo archivo de dominio se importa en navegador y en Node.
- **Alternativas**: Jest o Vitest (dependencias y configuración adicionales).

## R6. Fechas deterministas en pruebas

- **Decisión**: `timezoneId: America/Hermosillo` y `locale: es-MX` en la configuración, y
  `page.clock.setFixedTime()` en las pruebas que dependen del día.
- **Razón**: el runner de CI está en UTC y los integrantes en Hermosillo (UTC-7); sin fijar la zona
  una prueba podría cambiar de resultado según la hora.
- **Alternativas**: inyectar la fecha por parámetro de URL (código de prueba dentro del producto).

## R7. Selectores

- **Decisión**: atributos `data-testid` estables, más roles/etiquetas accesibles cuando la prueba
  verifica accesibilidad.
- **Razón**: los textos pueden cambiar sin romper las pruebas; los `data-testid` son el contrato
  entre UI y pruebas (`contracts/ui-contract.md`).
- **Alternativas**: selectores CSS por clase (frágiles ante cambios de estilo).

## R8. Dispositivos

- **Decisión**: proyectos `escritorio` (Desktop Chrome) y `movil` (Pixel 7), ambos con Chromium.
- **Razón**: el público objetivo usa móvil; un solo navegador descargado mantiene la CI en < 3 min.
- **Alternativas**: Chromium + Firefox + WebKit (triplica tiempo de CI; se puede activar después).
