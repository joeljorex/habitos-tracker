// Visor de observabilidad: métricas del panel y sus alarmas (spec 005).
import { expect, test } from '@playwright/test';
import { CUENTA_DEMO, iniciarSesion, sembrar } from './helpers.js';

/** Abre el visor y deja activa la pestaña indicada. */
async function abrirVisor(page, pestana) {
  await page.getByTestId('ver-observabilidad').click();
  await expect(page.getByTestId('visor')).toBeVisible();
  if (pestana) {
    await page.getByTestId(`visor-pestana-${pestana}`).click();
    await expect(page.getByTestId(`visor-panel-${pestana}`)).toBeVisible();
  }
}

test.describe('visor de observabilidad', () => {
  test('@smoke se abre desde el encabezado y se cierra con Escape', async ({ page }) => {
    await sembrar(page);
    await iniciarSesion(page);

    const visor = page.getByTestId('visor');
    await expect(visor).toBeHidden();

    await abrirVisor(page);
    await expect(page.getByTestId('visor-pestana-metricas')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('visor-panel-metricas')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(visor).toBeHidden();
    await expect(page.getByTestId('ver-observabilidad')).toBeFocused();
  });

  test('las métricas cuentan las acciones y las alarmas quedan en normal', async ({ page }) => {
    await sembrar(page);
    await iniciarSesion(page);
    await page.getByTestId('habit-name').fill('Tomar agua');
    await page.getByTestId('habit-submit').click();
    await page.getByTestId('habit-complete').first().click();

    await abrirVisor(page, 'metricas');

    // Cuatro reglas de alarma, todas en normal: la sesión fue válida y nada falló.
    await expect(page.getByTestId('alarma')).toHaveCount(4);
    await expect(page.getByTestId('alarma-estado').filter({ hasText: 'Normal' })).toHaveCount(4);
    await expect(page.getByTestId('metricas-resumen')).toHaveAttribute('data-estado-general', 'ok');

    const prometheus = page.getByTestId('metricas-prometheus');
    await expect(prometheus).toContainText('habitos_creados_total{resultado="exito"} 1');
    await expect(prometheus).toContainText('habitos_marcados_total 1');
    await expect(prometheus).toContainText('# TYPE habitos_operacion_duracion_ms summary');
  });

  test('un acceso rechazado se cuenta y levanta la alarma de accesos', async ({ page }) => {
    await sembrar(page);
    await page.goto('./');
    // Cuatro intentos fallidos: el mínimo que la regla exige para opinar.
    for (let i = 0; i < 4; i++) {
      await page.getByTestId('login-email').fill(CUENTA_DEMO.email);
      await page.getByTestId('login-password').fill('incorrecta');
      await page.getByTestId('login-submit').click();
      await expect(page.getByTestId('login-error')).toBeVisible();
    }
    await iniciarSesion(page);
    await abrirVisor(page, 'metricas');

    const regla = page.locator('[data-alarma="accesos-rechazados"]');
    await expect(regla.getByTestId('alarma-estado')).toHaveText('Alarma');
    await expect(regla.getByTestId('alarma-valor')).toHaveText('80.0 %');
    await expect(page.getByTestId('ver-observabilidad')).toHaveAttribute('data-estado', 'alarma');
  });
});
