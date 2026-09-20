// Registrar, marcar y eliminar hábitos (spec 001: US2, US3 y US4).
// CP-01, CP-02, CP-06, CP-07, CP-08 y CP-09.
import { expect, test } from '@playwright/test';
import { iniciarSesion, leerAlmacen, sembrar } from './helpers.js';

const VACIO = 'Escribe un nombre para el hábito.';
const LARGO = 'El nombre puede tener máximo 60 caracteres.';
const DUPLICADO = 'Ya tienes un hábito con ese nombre.';
const LISTA_VACIA = 'Aún no tienes hábitos. Crea el primero.';

const habito = (id, nombre, creadoEn) => ({ id, nombre, creadoEn });

async function agregar(page, nombre) {
  await page.getByTestId('habit-name').fill(nombre);
  await page.getByTestId('habit-submit').click();
}

test.describe('Registrar y ver hábitos', () => {
  test('CP-01 Crear hábito con nombre vacío @smoke', async ({ page }) => {
    await sembrar(page);
    await iniciarSesion(page);
    const error = page.getByTestId('habit-error');

    await expect(page.getByTestId('empty-state')).toHaveText(LISTA_VACIA);

    await page.getByTestId('habit-submit').click();
    await expect(error).toHaveText(VACIO);
    await expect(error).toBeVisible();
    await expect(error).toHaveAttribute('aria-live', 'polite');
    await expect(page.getByTestId('habit-item')).toHaveCount(0);

    // Solo espacios: también es un nombre vacío.
    await agregar(page, '     ');
    await expect(error).toHaveText(VACIO);
    await expect(page.getByTestId('habit-item')).toHaveCount(0);
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('CP-07 Nombre de más de 60 caracteres', async ({ page }) => {
    await sembrar(page);
    await iniciarSesion(page);

    await agregar(page, 'a'.repeat(61));
    await expect(page.getByTestId('habit-error')).toHaveText(LARGO);
    await expect(page.getByTestId('habit-item')).toHaveCount(0);

    // El límite exacto (60) sí se acepta.
    const sesenta = 'b'.repeat(60);
    await agregar(page, sesenta);
    await expect(page.getByTestId('habit-item')).toHaveCount(1);
    await expect(page.getByTestId('habit-name-text')).toHaveText(sesenta);
    await expect(page.getByTestId('habit-error')).toBeEmpty();
  });

  test('CP-08 Los hábitos se conservan al recargar y al volver a iniciar sesión', async ({ page }) => {
    await sembrar(page);
    await iniciarSesion(page);
    const nombres = ['Tomar agua', 'Leer 20 min', 'Caminar 30 min'];
    for (const [indice, nombre] of nombres.entries()) {
      await agregar(page, nombre);
      await expect(page.getByTestId('habit-item')).toHaveCount(indice + 1);
    }
    await expect(page.getByTestId('habit-name-text')).toHaveText(nombres);
    await expect(page.getByTestId('empty-state')).toBeHidden();

    await page.reload();
    await expect(page.getByTestId('usuario-actual')).toHaveText('demo@habitos.app');
    await expect(page.getByTestId('habit-name-text')).toHaveText(nombres);

    await page.getByTestId('logout').click();
    await iniciarSesion(page);
    await expect(page.getByTestId('habit-name-text')).toHaveText(nombres);
  });

  test('CP-08 Datos guardados corruptos no rompen el panel', async ({ page }) => {
    await page.addInitScript(() => {
      if (window.localStorage.getItem('habitos.v1.habitos') === null) {
        window.localStorage.setItem('habitos.v1.habitos', '{esto no es JSON');
        window.localStorage.setItem('habitos.v1.registros', '[1, 2');
        window.localStorage.setItem('habitos.v1.tourVisto', '1');
      }
    });
    await iniciarSesion(page);
    await expect(page.getByTestId('empty-state')).toHaveText(LISTA_VACIA);
    await expect(page.getByTestId('habit-item')).toHaveCount(0);

    // El panel sigue funcionando y reemplaza los datos corruptos.
    await agregar(page, 'Tomar agua');
    await expect(page.getByTestId('habit-item')).toHaveCount(1);
    expect((await leerAlmacen(page, 'habitos.v1.habitos')).map((h) => h.nombre)).toEqual(['Tomar agua']);
  });

  test('CP-09 Nombre duplicado sin distinguir mayúsculas ni espacios', async ({ page }) => {
    await sembrar(page, { habitos: [habito('h-agua', 'Tomar agua', '2026-09-01T15:00:00.000Z')] });
    await iniciarSesion(page);

    await agregar(page, ' tomar AGUA ');
    await expect(page.getByTestId('habit-error')).toHaveText(DUPLICADO);
    await expect(page.getByTestId('habit-item')).toHaveCount(1);

    // También contra un hábito creado en esta misma sesión.
    await agregar(page, 'Leer');
    await expect(page.getByTestId('habit-item')).toHaveCount(2);
    await agregar(page, '  LEER');
    await expect(page.getByTestId('habit-error')).toHaveText(DUPLICADO);
    await expect(page.getByTestId('habit-name-text')).toHaveText(['Tomar agua', 'Leer']);
  });
});

test.describe('Marcar un hábito como hecho hoy', () => {
  test('CP-02 Marcar hábito completado dos veces el mismo día', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-09-11T10:00:00-07:00'));
    await sembrar(page, { habitos: [habito('h-agua', 'Tomar agua', '2026-09-01T15:00:00.000Z')] });
    await iniciarSesion(page);
    const item = page.getByTestId('habit-item');
    const boton = item.getByTestId('habit-complete');
    const dias = item.getByTestId('habit-days');

    await expect(boton).toHaveText('Marcar hoy');
    await expect(boton).toBeEnabled();
    await expect(dias).toHaveText('0 días cumplidos');

    // Doble clic muy rápido: un solo registro.
    await boton.dblclick();
    await expect(boton).toHaveText('Hecho hoy ✓');
    await expect(boton).toBeDisabled();
    await expect(dias).toHaveText('1 día cumplido');

    // Tras recargar sigue marcado y no se puede volver a marcar.
    await page.reload();
    await expect(boton).toHaveText('Hecho hoy ✓');
    await expect(boton).toBeDisabled();
    await expect(dias).toHaveText('1 día cumplido');
    expect(await leerAlmacen(page, 'habitos.v1.registros')).toEqual([{ habitoId: 'h-agua', fecha: '2026-09-11' }]);

    // Al día siguiente el botón vuelve a "Marcar hoy".
    await page.clock.setFixedTime(new Date('2026-09-12T08:00:00-07:00'));
    await page.reload();
    await expect(boton).toHaveText('Marcar hoy');
    await expect(boton).toBeEnabled();
    await boton.click();
    await expect(dias).toHaveText('2 días cumplidos');
  });
});

test.describe('Eliminar un hábito', () => {
  test('CP-06 Eliminar hábito', async ({ page }) => {
    await sembrar(page, {
      habitos: [
        habito('h-leer', 'Leer 20 min', '2026-09-01T15:00:00.000Z'),
        habito('h-agua', 'Tomar agua', '2026-09-02T15:00:00.000Z'),
      ],
      registros: [
        { habitoId: 'h-leer', fecha: '2026-09-08' },
        { habitoId: 'h-leer', fecha: '2026-09-09' },
        { habitoId: 'h-agua', fecha: '2026-09-09' },
      ],
    });
    await iniciarSesion(page);
    const leer = page.getByTestId('habit-item').filter({ hasText: 'Leer 20 min' });
    await expect(leer).toHaveAttribute('data-habit-id', 'h-leer');
    await expect(leer.getByTestId('habit-days')).toHaveText('2 días cumplidos');
    const eliminar = page.getByRole('button', { name: 'Eliminar «Leer 20 min»' });
    await expect(eliminar).toHaveText('Eliminar');

    // Cancelar conserva el hábito.
    const mensajes = [];
    page.once('dialog', async (dialogo) => {
      mensajes.push(dialogo.message());
      await dialogo.dismiss();
    });
    await eliminar.click();
    await expect(page.getByTestId('habit-item')).toHaveCount(2);
    expect(mensajes).toEqual(['¿Eliminar «Leer 20 min»? También se borrará su historial.']);

    // Confirmar elimina el hábito y su historial.
    page.once('dialog', (dialogo) => dialogo.accept());
    await eliminar.click();
    await expect(page.getByTestId('habit-item')).toHaveCount(1);
    await expect(page.getByTestId('habit-name-text')).toHaveText(['Tomar agua']);
    expect(await leerAlmacen(page, 'habitos.v1.registros')).toEqual([{ habitoId: 'h-agua', fecha: '2026-09-09' }]);

    // También después de recargar.
    await page.reload();
    await expect(page.getByTestId('habit-name-text')).toHaveText(['Tomar agua']);
    await expect(page.getByTestId('habit-item').getByTestId('habit-days')).toHaveText('1 día cumplido');
  });
});
