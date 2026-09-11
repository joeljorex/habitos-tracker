// Acceso al panel (spec 001, US1: CP-05 y CP-10; SC-005 flujo solo con teclado).
import { expect, test } from '@playwright/test';
import { CUENTA_DEMO, sembrar } from './helpers.js';

const ERROR_CREDENCIALES = 'Correo o contraseña incorrectos.';

test.describe('Acceso al panel', () => {
  test.beforeEach(async ({ page }) => {
    await sembrar(page);
  });

  test('CP-05 Login con credenciales inválidas', async ({ page }) => {
    await page.goto('./');
    const error = page.getByTestId('login-error');

    // Contraseña incorrecta.
    await page.getByTestId('login-email').fill(CUENTA_DEMO.email);
    await page.getByTestId('login-password').fill('otra-clave');
    await page.getByTestId('login-submit').click();
    await expect(error).toHaveText(ERROR_CREDENCIALES);
    await expect(page.getByRole('alert')).toHaveText(ERROR_CREDENCIALES);

    // Correo incorrecto: el mismo mensaje, sin revelar qué campo falló.
    await page.getByTestId('login-email').fill('otra@habitos.app');
    await page.getByTestId('login-password').fill(CUENTA_DEMO.password);
    await page.getByTestId('login-submit').click();
    await expect(error).toHaveText(ERROR_CREDENCIALES);

    // Sigue en la pantalla de acceso y no hay sesión.
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('habit-form')).toBeHidden();
    await expect(page.getByTestId('usuario-actual')).toBeHidden();
    expect(await page.evaluate(() => window.sessionStorage.getItem('habitos.v1.sesion'))).toBeNull();
  });

  test('CP-10 Login válido muestra el panel y cerrar sesión regresa al acceso @smoke', async ({ page }) => {
    // Sin sesión, abrir el panel muestra la pantalla de acceso.
    await page.goto('./');
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('habit-form')).toBeHidden();

    await page.getByLabel('Correo').fill(CUENTA_DEMO.email);
    await page.getByLabel('Contraseña').fill(CUENTA_DEMO.password);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByTestId('usuario-actual')).toHaveText(CUENTA_DEMO.email);
    await expect(page.getByTestId('habit-form')).toBeVisible();
    await expect(page.getByTestId('login-form')).toBeHidden();
    await expect(page.getByTestId('login-error')).toBeEmpty();

    await page.getByTestId('logout').click();
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('usuario-actual')).toBeHidden();

    // La sesión se cerró de verdad: al recargar sigue en el acceso.
    await page.reload();
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('habit-form')).toBeHidden();
  });

  test('CP-10 El flujo principal (acceso, crear, marcar, eliminar y salir) se completa solo con teclado', async ({
    page,
  }) => {
    await page.goto('./');

    // Acceso: Tab, escribir, Enter.
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Correo')).toBeFocused();
    await page.keyboard.type(CUENTA_DEMO.email);
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Contraseña')).toBeFocused();
    await page.keyboard.type(CUENTA_DEMO.password);
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('usuario-actual')).toHaveText(CUENTA_DEMO.email);

    // Crear: Tab hasta el campo, escribir y Enter.
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Nombre del hábito')).toBeFocused();
    await page.keyboard.type('Leer 20 min');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('habit-item')).toHaveCount(1);
    await expect(page.getByLabel('Nombre del hábito')).toBeFocused();
    await expect(page.getByLabel('Nombre del hábito')).toHaveValue('');

    // Marcar: Tab hasta el botón y Espacio.
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('habit-submit')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('habit-complete')).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.getByTestId('habit-complete')).toHaveText('Hecho hoy ✓');
    await expect(page.getByTestId('habit-days')).toHaveText('1 día cumplido');

    // Eliminar: el foco pasa al botón Eliminar; Enter y confirmar.
    await expect(page.getByRole('button', { name: 'Eliminar «Leer 20 min»' })).toBeFocused();
    page.once('dialog', (dialogo) => dialogo.accept());
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('habit-item')).toHaveCount(0);
    await expect(page.getByLabel('Nombre del hábito')).toBeFocused();

    // Salir: Shift+Tab hasta "Cerrar sesión" y Enter.
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByTestId('logout')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByLabel('Correo')).toBeFocused();
  });
});
