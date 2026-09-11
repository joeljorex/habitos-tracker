---
name: caso-de-prueba-e2e
description: Convierte un caso de prueba CP-xx de docs/casos-de-prueba.md en una prueba end-to-end de Playwright para el panel web de habitos-tracker, con las convenciones del proyecto (títulos con ID, @smoke, data-testid, reloj fijo, rutas relativas). Úsala cuando pidan "automatizar un caso", "prueba e2e", "test de Playwright" o citen un CP-xx.
---

# Caso de prueba → prueba e2e (Playwright)

## Entradas

- La fila del caso en `docs/casos-de-prueba.md` (ID, pasos, resultado esperado).
- El contrato de UI: `specs/001-panel-web-e2e/contracts/ui-contract.md` (data-testid y textos exactos).

## Convenciones obligatorias

1. **Título**: empieza con el ID y la descripción del caso: `test('CP-07 Nombre de hábito de más de 60 caracteres', …)`.
2. **Smoke**: agrega `@smoke` al título solo si el caso es rápido, no destructivo y válido contra producción.
3. **Selectores**: `page.getByTestId('…')` con los IDs del contrato; roles (`getByRole`) cuando además verificas accesibilidad. Nunca clases CSS propias.
4. **Navegación**: `page.goto('./')` (relativa), porque en producción el panel vive en `/habitos-tracker/`.
5. **Datos**: usa `sembrar(page, { habitos, registros, tourVisto: true })` y `iniciarSesion(page)` de `tests/e2e/helpers.js`. `tourVisto: true` salvo que el caso sea de la guía.
6. **Fechas**: `await page.clock.setFixedTime(new Date('2026-09-04T10:00:00-07:00'))` antes de navegar; la configuración fija `timezoneId: America/Hermosillo`.
7. **Esperas**: solo aserciones con reintento (`await expect(locator).toHaveText(…)`); prohibido `waitForTimeout`.
8. **Diálogos**: registra `page.once('dialog', d => d.accept())` (o `dismiss`) antes de la acción que lo abre.

## Plantilla

```js
import { test, expect } from '@playwright/test';
import { iniciarSesion, sembrar } from './helpers.js';

test('CP-xx <descripción del caso>', async ({ page }) => {
  await sembrar(page, { tourVisto: true });
  await iniciarSesion(page);
  // Pasos del caso…
  await expect(page.getByTestId('…')).toHaveText('…');
});
```

## Dónde va

- Autenticación → `tests/e2e/autenticacion.spec.js`
- Hábitos → `tests/e2e/habitos.spec.js`
- Guía → `tests/e2e/tour.spec.js`
- Rachas → `tests/e2e/rachas.spec.js`

## Explorar la UI con IA (opcional)

Para descubrir selectores o flujos, conecta Playwright MCP a Claude Code:

```bash
claude mcp add playwright -- npx @playwright/mcp@latest
```

y pide al agente navegar `http://127.0.0.1:4173/` (con `npm run serve` activo).

## Verificar y registrar

```bash
npx playwright test -g "CP-xx"
npm test
```

Después actualiza la columna "Automatizado en" del caso en `docs/casos-de-prueba.md` y su fila en `docs/trazabilidad.md`.
