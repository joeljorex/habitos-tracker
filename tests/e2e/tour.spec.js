// Guía interactiva (spec 002): CP-11 y CP-12.
//
// Las pruebas NO fijan el número total de pasos (la spec 004 agrega uno): leen "1 de N" con una
// expresión regular y verifican el título del primer paso y el del último ("¿Necesitas ayuda?").
// Selectores del globo: clases públicas de driver.js 1.8.0 (tour-contract.md §4).
import { expect, test } from '@playwright/test';
import { CUENTA_DEMO, iniciarSesion, sembrar } from './helpers.js';

const PRIMER_TITULO = 'Crea un hábito';
const ULTIMO_TITULO = '¿Necesitas ayuda?';

const globo = (page) => page.locator('.driver-popover');
const titulo = (page) => page.locator('.driver-popover-title');
const descripcion = (page) => page.locator('.driver-popover-description');
const progreso = (page) => page.locator('.driver-popover-progress-text');
const siguiente = (page) => page.locator('.driver-popover-next-btn');
const anterior = (page) => page.locator('.driver-popover-prev-btn');
const cerrar = (page) => page.locator('.driver-popover-close-btn');

/** Espera "1 de N" y devuelve N. */
async function totalDePasos(page) {
  await expect(progreso(page)).toHaveText(/^1 de \d+$/);
  return Number((await progreso(page).textContent()).match(/de (\d+)$/)[1]);
}

/** Desde el paso 1, avanza con "Siguiente" hasta el último y devuelve lo que mostró cada paso. */
async function recorrer(page) {
  const total = await totalDePasos(page);
  const pasos = [];
  for (let n = 1; n <= total; n += 1) {
    await expect(progreso(page)).toHaveText(`${n} de ${total}`);
    await expect(globo(page)).toBeInViewport({ ratio: 1 });
    pasos.push({ titulo: await titulo(page).textContent(), descripcion: await descripcion(page).textContent() });
    if (n < total) await siguiente(page).click();
  }
  return pasos;
}

/** Tras cargar el panel, la guía NO se abrió sola. */
async function esperarPanelSinGuia(page) {
  await expect(page.getByTestId('usuario-actual')).toHaveText(CUENTA_DEMO.email);
  // La app arranca la guía en la misma tarea en que pinta el correo; driver.js marca <body>
  // con "driver-active" de forma síncrona, así que en este punto la comprobación es fiable.
  await expect(page.locator('body')).not.toHaveClass(/driver-active/);
  await expect(globo(page)).toHaveCount(0);
}

test.describe('Guía en la primera visita', () => {
  test('CP-11 El tour se muestra en la primera visita y se recorre completo', async ({ page }) => {
    await iniciarSesion(page); // Navegador sin datos: primera visita.

    await expect(globo(page)).toBeVisible();
    await expect(titulo(page)).toHaveText(PRIMER_TITULO);
    await expect(descripcion(page)).toHaveText(
      'Escribe algo que quieras hacer a diario, por ejemplo «Tomar agua», y pulsa Agregar.',
    );
    await expect(page.getByTestId('habit-form')).toHaveClass(/driver-active-element/);
    const total = await totalDePasos(page);
    expect(total).toBeGreaterThanOrEqual(4);

    // "Anterior" regresa al paso previo.
    await siguiente(page).click();
    await expect(progreso(page)).toHaveText(`2 de ${total}`);
    await expect(titulo(page)).toHaveText('Tus hábitos');
    await expect(anterior(page)).toHaveText('Anterior');
    await anterior(page).click();
    await expect(progreso(page)).toHaveText(`1 de ${total}`);
    await expect(titulo(page)).toHaveText(PRIMER_TITULO);

    // Recorrido completo: formulario, lista, marcar (alternativa: aún no hay hábitos) y Ver guía.
    const pasos = await recorrer(page);
    expect(pasos.slice(0, 3).map((p) => p.titulo)).toEqual([PRIMER_TITULO, 'Tus hábitos', 'Marca tu avance']);
    expect(pasos[2].descripcion).toBe(
      'Cuando tengas hábitos, cada uno tendrá un botón «Marcar hoy» para registrar tu avance.',
    );
    expect(pasos.at(-1).titulo).toBe(ULTIMO_TITULO);
    // Spec 004: "Tu racha" va justo antes del último paso (sin hábitos, con su alternativa).
    expect(pasos.at(-2)).toEqual({
      titulo: 'Tu racha',
      descripcion: 'Cada hábito mostrará su racha: los días seguidos que lo cumples y tu mejor marca.',
    });
    await expect(page.getByTestId('ver-guia')).toHaveClass(/driver-active-element/);

    await expect(siguiente(page)).toHaveText('Listo');
    await siguiente(page).click();
    await expect(globo(page)).toHaveCount(0);
    expect(await page.evaluate(() => window.localStorage.getItem('habitos.v1.tourVisto'))).toBe('1');
  });

  test('CP-11 Con hábitos, el paso para marcar resalta el botón del primer hábito', async ({ page }) => {
    await sembrar(page, {
      habitos: [
        { id: 'h-agua', nombre: 'Tomar agua', creadoEn: '2026-09-01T15:00:00.000Z' },
        { id: 'h-leer', nombre: 'Leer 20 min', creadoEn: '2026-09-02T15:00:00.000Z' },
      ],
      tourVisto: false,
    });
    await iniciarSesion(page);
    const total = await totalDePasos(page);

    await siguiente(page).click();
    await siguiente(page).click();
    await expect(progreso(page)).toHaveText(`3 de ${total}`);
    await expect(titulo(page)).toHaveText('Marca tu avance');
    await expect(descripcion(page)).toHaveText(
      'Pulsa «Marcar hoy» cuando completes el hábito. Solo cuenta una vez por día.',
    );
    const primerBoton = page.getByTestId('habit-item').first().getByTestId('habit-complete');
    await expect(primerBoton).toHaveAttribute('data-tour', 'marcar');
    await expect(primerBoton).toHaveClass(/driver-active-element/);
    await expect(page.locator('[data-tour="marcar"]')).toHaveCount(1);
    await expect(globo(page)).toBeInViewport({ ratio: 1 });
  });

  test('CP-11 El paso «Tu racha» va justo antes de «¿Necesitas ayuda?» y resalta la racha del primer hábito', async ({
    page,
  }) => {
    await sembrar(page, {
      habitos: [
        { id: 'h-agua', nombre: 'Tomar agua', creadoEn: '2026-09-01T15:00:00.000Z' },
        { id: 'h-leer', nombre: 'Leer 20 min', creadoEn: '2026-09-02T15:00:00.000Z' },
      ],
      tourVisto: false,
    });
    await iniciarSesion(page);
    const total = await totalDePasos(page);

    // Avanza hasta el penúltimo paso.
    for (let n = 1; n < total - 1; n += 1) {
      await siguiente(page).click();
      await expect(progreso(page)).toHaveText(`${n + 1} de ${total}`);
    }
    await expect(titulo(page)).toHaveText('Tu racha');
    await expect(descripcion(page)).toHaveText(
      'La racha cuenta los días seguidos que cumples el hábito. Si saltas un día vuelve a empezar, pero tu mejor racha se conserva.',
    );
    const racha = page.getByTestId('habit-item').first().getByTestId('habit-streak-current');
    await expect(racha).toHaveAttribute('data-tour', 'racha');
    await expect(racha).toHaveClass(/driver-active-element/);
    await expect(page.locator('[data-tour="racha"]')).toHaveCount(1);
    await expect(globo(page)).toBeInViewport({ ratio: 1 });

    await siguiente(page).click();
    await expect(progreso(page)).toHaveText(`${total} de ${total}`);
    await expect(titulo(page)).toHaveText(ULTIMO_TITULO);
  });

  test('CP-11 La guía se recorre con las flechas del teclado y conserva el foco', async ({ page }) => {
    // driver.js ignora las flechas mientras anima el cambio de paso (~400 ms, con Date.now y
    // requestAnimationFrame). Con el reloj simulado de Playwright cada animación se completa
    // de forma determinista, sin esperas fijas.
    await page.clock.install({ time: new Date('2026-09-11T10:00:00-07:00') });
    await iniciarSesion(page);
    await page.clock.runFor(1000);
    const total = await totalDePasos(page);
    // Al terminar de resaltar cada paso, el foco queda en "Siguiente" (no en la X).
    await expect(siguiente(page)).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await page.clock.runFor(1000);
    await expect(progreso(page)).toHaveText(`2 de ${total}`);
    await expect(siguiente(page)).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.clock.runFor(1000);
    await expect(progreso(page)).toHaveText(`3 de ${total}`);
    await page.keyboard.press('ArrowLeft');
    await page.clock.runFor(1000);
    await expect(progreso(page)).toHaveText(`2 de ${total}`);

    // Enter sobre "Siguiente" (enfocado) también avanza.
    await expect(siguiente(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await page.clock.runFor(1000);
    await expect(progreso(page)).toHaveText(`3 de ${total}`);

    // Tab no se escapa de la guía mientras está abierta.
    for (let i = 0; i < 4; i += 1) {
      await page.keyboard.press('Tab');
      expect(
        await page.evaluate(() => Boolean(document.activeElement?.closest('.driver-popover, .driver-active-element'))),
      ).toBe(true);
    }
  });
});

test.describe('No repetir y poder relanzar', () => {
  test('CP-12 El tour no reaparece y se relanza con Ver guía', async ({ page }) => {
    await iniciarSesion(page);
    await recorrer(page);
    await siguiente(page).click(); // Listo
    await expect(globo(page)).toHaveCount(0);

    // Recargar: no aparece sola.
    await page.reload();
    await esperarPanelSinGuia(page);

    // Volver a iniciar sesión: tampoco.
    await page.getByTestId('logout').click();
    await iniciarSesion(page);
    await esperarPanelSinGuia(page);

    // "Ver guía" la relanza desde el primer paso.
    await page.getByTestId('ver-guia').click();
    await expect(globo(page)).toBeVisible();
    await expect(titulo(page)).toHaveText(PRIMER_TITULO);
    await expect(progreso(page)).toHaveText(/^1 de \d+$/);

    // Con la guía abierta, pedirla otra vez no abre una segunda. (La superposición de driver.js
    // bloquea los clics reales en el botón, así que el evento se envía directamente.)
    await siguiente(page).click();
    await expect(progreso(page)).toHaveText(/^2 de \d+$/);
    await page.getByTestId('ver-guia').dispatchEvent('click');
    await expect(globo(page)).toHaveCount(1);
    await expect(progreso(page)).toHaveText(/^2 de \d+$/);
  });

  test('CP-12 Cerrar la guía con la X también la marca como vista', async ({ page }) => {
    await iniciarSesion(page);
    await expect(globo(page)).toBeVisible();
    await expect(cerrar(page)).toHaveAttribute('aria-label', 'Cerrar guía');
    await cerrar(page).click();
    await expect(globo(page)).toHaveCount(0);

    await page.reload();
    await esperarPanelSinGuia(page);
  });

  test('CP-12 Cerrar la guía con Esc también la marca como vista', async ({ page }) => {
    await iniciarSesion(page);
    await expect(globo(page)).toBeVisible();
    await siguiente(page).click();
    await expect(progreso(page)).toHaveText(/^2 de \d+$/);
    await page.keyboard.press('Escape');
    await expect(globo(page)).toHaveCount(0);

    await page.reload();
    await esperarPanelSinGuia(page);
  });

  test('CP-12 Cerrar sesión con la guía abierta la cierra y no reaparece', async ({ page }) => {
    await iniciarSesion(page);
    await expect(globo(page)).toBeVisible();
    // La superposición bloquea el clic real; se envía el evento al botón para simular el caso.
    await page.getByTestId('logout').dispatchEvent('click');
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(globo(page)).toHaveCount(0);

    await iniciarSesion(page);
    await esperarPanelSinGuia(page);
  });
});
