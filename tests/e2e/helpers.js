// Ayudantes de las pruebas end-to-end.
// Contrato: specs/001-panel-web-e2e/contracts/ui-contract.md §5.
import { expect } from '@playwright/test';

export const CUENTA_DEMO = Object.freeze({ email: 'demo@habitos.app', password: 'Habitos123' });

/** Abre `./` (relativo a baseURL, funciona bajo /habitos-tracker/) e inicia sesión con la cuenta de demostración. */
export async function iniciarSesion(page) {
  await page.goto('./');
  await page.getByTestId('login-email').fill(CUENTA_DEMO.email);
  await page.getByTestId('login-password').fill(CUENTA_DEMO.password);
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('usuario-actual')).toHaveText(CUENTA_DEMO.email);
}

/**
 * Antes de cargar la página escribe hábitos, registros y el estado de la guía en localStorage,
 * SOLO si la clave no existe: así una recarga no borra lo que la prueba creó (CP-08).
 * Por defecto marca la guía como vista para que no tape el panel.
 */
export async function sembrar(page, { habitos = [], registros = [], tourVisto = true } = {}) {
  await page.addInitScript(
    (datos) => {
      const escribirSiFalta = (clave, valor) => {
        try {
          if (window.localStorage.getItem(clave) === null) window.localStorage.setItem(clave, valor);
        } catch {
          // Documento sin acceso a localStorage (p. ej. about:blank): nada que sembrar.
        }
      };
      escribirSiFalta('habitos.v1.habitos', JSON.stringify(datos.habitos));
      escribirSiFalta('habitos.v1.registros', JSON.stringify(datos.registros));
      if (datos.tourVisto) escribirSiFalta('habitos.v1.tourVisto', '1');
    },
    { habitos, registros, tourVisto },
  );
}

/** Lee y decodifica una clave JSON de localStorage de la página. */
export async function leerAlmacen(page, clave) {
  return page.evaluate((c) => JSON.parse(window.localStorage.getItem(c) ?? 'null'), clave);
}
