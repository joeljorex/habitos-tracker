// Rachas en el panel (spec 004, US2): CP-04 y CP-13.
//
// Fechas deterministas: page.clock.setFixedTime con offset explícito -07:00 (America/Hermosillo,
// la zona configurada en playwright.config.js) y hábitos/registros sembrados en localStorage.
import { expect, test } from '@playwright/test';
import { iniciarSesion, sembrar } from './helpers.js';

const tarjeta = (page, nombre) => page.getByTestId('habit-item').filter({ hasText: nombre });

test.describe('Rachas en el panel', () => {
  test('CP-04 Cálculo de racha tras un día saltado', async ({ page }) => {
    // Día 1 (1 sep): hábito recién creado.
    await page.clock.setFixedTime(new Date('2026-09-01T09:00:00-07:00'));
    await sembrar(page, { habitos: [{ id: 'h-leer', nombre: 'Leer 20 min', creadoEn: '2026-09-01T15:00:00.000Z' }] });
    await iniciarSesion(page);
    const leer = tarjeta(page, 'Leer 20 min');
    const actual = leer.getByTestId('habit-streak-current');
    const mejor = leer.getByTestId('habit-streak-max');

    await expect(actual).toHaveText('Racha: 0 días');
    await expect(mejor).toHaveText('Mejor: 0 días');
    await leer.getByTestId('habit-complete').click();
    await expect(actual).toHaveText('Racha: 1 día'); // Se actualiza sin recargar.
    await expect(mejor).toHaveText('Mejor: 1 día');

    // Día 2 (2 sep): sigue viva desde ayer; al marcar llega a 2.
    await page.clock.setFixedTime(new Date('2026-09-02T09:00:00-07:00'));
    await page.reload();
    await expect(actual).toHaveText('Racha: 1 día');
    await leer.getByTestId('habit-complete').click();
    await expect(actual).toHaveText('Racha: 2 días');
    await expect(mejor).toHaveText('Mejor: 2 días');

    // Día 3 (3 sep): se salta. Día 4 (4 sep): la racha se rompió y la mejor se conserva.
    await page.clock.setFixedTime(new Date('2026-09-04T09:00:00-07:00'));
    await page.reload();
    await expect(actual).toHaveText('Racha: 0 días');
    await expect(mejor).toHaveText('Mejor: 2 días');

    // Completar de nuevo: la racha se reinicia en 1 y la máxima sigue en 2 (caso V06).
    await leer.getByTestId('habit-complete').click();
    await expect(actual).toHaveText('Racha: 1 día');
    await expect(mejor).toHaveText('Mejor: 2 días');
    await expect(leer.getByTestId('habit-days')).toHaveText('3 días cumplidos');
  });

  test('CP-13 La racha sigue viva si el último día cumplido fue ayer y se rompe si fue antes', async ({ page }) => {
    // 10 sep a las 23:59 en Hermosillo: el día todavía no termina.
    await page.clock.setFixedTime(new Date('2026-09-10T23:59:00-07:00'));
    await sembrar(page, {
      habitos: [
        { id: 'h-agua', nombre: 'Tomar agua', creadoEn: '2026-09-01T15:00:00.000Z' },
        { id: 'h-caminar', nombre: 'Caminar 30 min', creadoEn: '2026-09-01T15:05:00.000Z' },
      ],
      registros: [
        { habitoId: 'h-agua', fecha: '2026-09-08' },
        { habitoId: 'h-agua', fecha: '2026-09-09' }, // ayer
        { habitoId: 'h-caminar', fecha: '2026-09-07' },
        { habitoId: 'h-caminar', fecha: '2026-09-08' }, // anteayer
      ],
    });
    await iniciarSesion(page);
    const agua = tarjeta(page, 'Tomar agua');
    const caminar = tarjeta(page, 'Caminar 30 min');

    // Último día cumplido = ayer: la racha sigue viva aunque hoy aún no se marca.
    await expect(agua.getByTestId('habit-complete')).toHaveText('Marcar hoy');
    await expect(agua.getByTestId('habit-streak-current')).toHaveText('Racha: 2 días');
    await expect(agua.getByTestId('habit-streak-max')).toHaveText('Mejor: 2 días');
    // Último día cumplido = anteayer: la racha se rompió y la mejor se conserva.
    await expect(caminar.getByTestId('habit-streak-current')).toHaveText('Racha: 0 días');
    await expect(caminar.getByTestId('habit-streak-max')).toHaveText('Mejor: 2 días');

    // Marcar hoy una racha viva desde ayer la sube sin recargar.
    await agua.getByTestId('habit-complete').click();
    await expect(agua.getByTestId('habit-streak-current')).toHaveText('Racha: 3 días');
    await expect(agua.getByTestId('habit-streak-max')).toHaveText('Mejor: 3 días');

    // 11 sep a las 00:01: lo cumplido "ayer" mantiene la racha y el botón vuelve a "Marcar hoy".
    await page.clock.setFixedTime(new Date('2026-09-11T00:01:00-07:00'));
    await page.reload();
    await expect(agua.getByTestId('habit-complete')).toHaveText('Marcar hoy');
    await expect(agua.getByTestId('habit-streak-current')).toHaveText('Racha: 3 días');

    // 12 sep: el último día cumplido ya fue anteayer; la racha se rompe y la mejor se conserva.
    await page.clock.setFixedTime(new Date('2026-09-12T08:00:00-07:00'));
    await page.reload();
    await expect(agua.getByTestId('habit-streak-current')).toHaveText('Racha: 0 días');
    await expect(agua.getByTestId('habit-streak-max')).toHaveText('Mejor: 3 días');
    await expect(caminar.getByTestId('habit-streak-current')).toHaveText('Racha: 0 días');
  });
});
