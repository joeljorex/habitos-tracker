// Visor de observabilidad: métricas con alarmas, trazabilidad y auditoría (specs 005, 006 y 007).
import { expect, test } from '@playwright/test';
import { CUENTA_DEMO, iniciarSesion, leerAlmacen, sembrar } from './helpers.js';

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
  test('@smoke se abre, cambia de pestaña y se cierra con Escape', async ({ page }) => {
    await sembrar(page);
    await iniciarSesion(page);

    const visor = page.getByTestId('visor');
    await expect(visor).toBeHidden();

    await abrirVisor(page);
    await expect(page.getByTestId('visor-pestana-metricas')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('visor-panel-trazabilidad')).toBeHidden();

    await page.getByTestId('visor-pestana-auditoria').click();
    await expect(page.getByTestId('visor-panel-auditoria')).toBeVisible();
    await expect(page.getByTestId('visor-panel-metricas')).toBeHidden();

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

  test('un acceso rechazado se cuenta y levanta el aviso de accesos', async ({ page }) => {
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

  test('la trazabilidad une cada registro con la operación que lo produjo', async ({ page }) => {
    await sembrar(page);
    await iniciarSesion(page);
    await page.getByTestId('habit-name').fill('Leer 20 minutos');
    await page.getByTestId('habit-submit').click();

    await abrirVisor(page, 'trazabilidad');

    const trazas = page.getByTestId('traza-item');
    await expect(trazas.filter({ hasText: 'crear hábito' })).toHaveCount(1);
    // La traza de creación guarda sus pasos: leer, validar y guardar.
    const trazaCrear = trazas.filter({ hasText: 'crear hábito' }).first();
    await expect(trazaCrear.getByTestId('traza-span')).toHaveCount(3);

    await expect(page.getByTestId('bitacora-fila').filter({ hasText: 'hábito creado' })).toHaveCount(1);

    // Cada registro guarda el identificador de la traza que lo produjo, no un guion.
    const filaCreado = page.getByTestId('bitacora-fila').filter({ hasText: 'hábito creado' }).first();
    const idTraza = (await filaCreado.locator('.visor-celda-traza').innerText()).trim();
    expect(idTraza).toMatch(/^[0-9a-f]{8}$/);

    // Al elegir la traza, la bitácora se filtra por ese mismo identificador.
    await trazaCrear.getByTestId('traza-abrir').click();
    await expect(page.getByTestId('traza-seleccionada')).toContainText(idTraza);
    await expect(page.getByTestId('bitacora-fila')).toHaveCount(1);
    await expect(page.getByTestId('bitacora-fila').filter({ hasText: 'sesión iniciada' })).toHaveCount(0);

    await page.getByTestId('traza-quitar-filtro').click();
    await expect(page.getByTestId('bitacora-fila').filter({ hasText: 'sesión iniciada' })).toHaveCount(1);

    // El filtro por nivel deja solo los avisos: aquí no hay ninguno todavía.
    await page.getByTestId('bitacora-nivel').selectOption('error');
    await expect(page.getByTestId('bitacora-vacia')).toBeVisible();
  });

  test('la auditoría registra quién hizo qué y verifica su cadena de hashes', async ({ page }) => {
    await sembrar(page);
    await iniciarSesion(page);
    await page.getByTestId('habit-name').fill('Caminar');
    await page.getByTestId('habit-submit').click();

    await abrirVisor(page, 'auditoria');

    const filas = page.getByTestId('auditoria-fila');
    await expect(filas.filter({ hasText: 'sesion.iniciada' })).toHaveCount(1);
    await expect(filas.filter({ hasText: 'habito.creado' })).toHaveCount(1);
    await expect(filas.first()).toContainText(CUENTA_DEMO.email);

    await page.getByTestId('auditoria-verificar').click();
    const integridad = page.getByTestId('auditoria-integridad');
    await expect(integridad).toHaveAttribute('data-estado', 'ok');
    await expect(integridad).toContainText('sin alteraciones');
  });

  test('si alguien edita el almacenamiento, la verificación lo detecta', async ({ page }) => {
    await sembrar(page);
    await iniciarSesion(page);
    await page.getByTestId('habit-name').fill('Estirar');
    await page.getByTestId('habit-submit').click();
    await expect(page.getByTestId('habit-item')).toHaveCount(1);

    // Manipulación: se cambia el recurso de un evento sin recalcular su hash.
    await expect
      .poll(async () => (await leerAlmacen(page, 'habitos.v1.auditoria'))?.length ?? 0)
      .toBeGreaterThanOrEqual(2);
    await page.evaluate(() => {
      const clave = 'habitos.v1.auditoria';
      const eventos = JSON.parse(window.localStorage.getItem(clave));
      eventos[eventos.length - 1].recurso = 'Otro hábito';
      window.localStorage.setItem(clave, JSON.stringify(eventos));
    });

    await abrirVisor(page, 'auditoria');
    await page.getByTestId('auditoria-verificar').click();
    const integridad = page.getByTestId('auditoria-integridad');
    await expect(integridad).toHaveAttribute('data-estado', 'alarma');
    await expect(integridad).toContainText('fue modificado');
  });

  test('el visor se recorre con el teclado', async ({ page }) => {
    await sembrar(page);
    await iniciarSesion(page);
    await abrirVisor(page);

    await page.getByTestId('visor-pestana-metricas').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('visor-pestana-trazabilidad')).toBeFocused();
    await expect(page.getByTestId('visor-panel-trazabilidad')).toBeVisible();

    await page.keyboard.press('End');
    await expect(page.getByTestId('visor-pestana-auditoria')).toBeFocused();
    await expect(page.getByTestId('visor-panel-auditoria')).toBeVisible();

    await page.keyboard.press('Home');
    await expect(page.getByTestId('visor-pestana-metricas')).toBeFocused();
  });
});
