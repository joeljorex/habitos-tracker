// Pruebas unitarias de la guía (spec 002: T006 y T013).
// Contrato: specs/002-tour-guiado-driverjs/contracts/tour-contract.md.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { resolverPasos } from '../../web/src/tour/tour.js';
import { agregarPaso, PASOS } from '../../web/src/tour/pasos.js';

describe('resolverPasos', () => {
  const pasos = [
    { id: 'a', elemento: '[data-tour="a"]', titulo: 'A', descripcion: 'Descripción A' },
    { id: 'b', elemento: '[data-tour="b"]', titulo: 'B', descripcion: 'Descripción B' },
    {
      id: 'c',
      elemento: '[data-tour="c"]',
      titulo: 'C',
      descripcion: 'Descripción C',
      alternativa: { elemento: '[data-tour="a"]', descripcion: 'Alternativa C' },
    },
  ];
  const existenTodos = () => true;
  const faltan = (...ausentes) => (selector) => !ausentes.includes(selector);

  test('conserva en orden los pasos cuyo elemento existe', () => {
    assert.deepEqual(resolverPasos(pasos, existenTodos), [
      { id: 'a', elemento: '[data-tour="a"]', titulo: 'A', descripcion: 'Descripción A' },
      { id: 'b', elemento: '[data-tour="b"]', titulo: 'B', descripcion: 'Descripción B' },
      { id: 'c', elemento: '[data-tour="c"]', titulo: 'C', descripcion: 'Descripción C' },
    ]);
  });

  test('omite el paso cuyo elemento no existe y no tiene alternativa', () => {
    const resueltos = resolverPasos(pasos, faltan('[data-tour="b"]'));
    assert.deepEqual(resueltos.map((p) => p.id), ['a', 'c']);
  });

  test('usa la alternativa cuando el elemento no existe', () => {
    const resueltos = resolverPasos(pasos, faltan('[data-tour="c"]'));
    assert.deepEqual(resueltos.at(-1), {
      id: 'c',
      elemento: '[data-tour="a"]',
      titulo: 'C',
      descripcion: 'Alternativa C',
    });
  });

  test('omite el paso si tampoco existe el elemento de la alternativa', () => {
    const resueltos = resolverPasos(pasos, faltan('[data-tour="a"]', '[data-tour="c"]'));
    assert.deepEqual(resueltos.map((p) => p.id), ['b']);
  });

  test('es pura: no modifica los pasos recibidos', () => {
    const copia = structuredClone(pasos);
    resolverPasos(pasos, faltan('[data-tour="c"]'));
    assert.deepEqual(pasos, copia);
  });
});

describe('registro PASOS', () => {
  const porId = (id) => PASOS.find((p) => p.id === id);

  test('empieza con nuevo-habito, lista y marcar, y termina con ver-guia', () => {
    const ids = PASOS.map((p) => p.id);
    assert.deepEqual(ids.slice(0, 3), ['nuevo-habito', 'lista', 'marcar']);
    assert.equal(ids.at(-1), 'ver-guia');
  });

  test('usa los textos exactos del contrato', () => {
    assert.equal(porId('nuevo-habito').titulo, 'Crea un hábito');
    assert.equal(
      porId('nuevo-habito').descripcion,
      'Escribe algo que quieras hacer a diario, por ejemplo «Tomar agua», y pulsa Agregar.',
    );
    assert.equal(porId('lista').titulo, 'Tus hábitos');
    assert.equal(porId('lista').descripcion, 'Aquí aparecen tus hábitos con los días que llevas cumplidos.');
    assert.equal(porId('marcar').titulo, 'Marca tu avance');
    assert.equal(
      porId('marcar').descripcion,
      'Pulsa «Marcar hoy» cuando completes el hábito. Solo cuenta una vez por día.',
    );
    assert.deepEqual(porId('marcar').alternativa, {
      elemento: '[data-tour="lista"]',
      descripcion: 'Cuando tengas hábitos, cada uno tendrá un botón «Marcar hoy» para registrar tu avance.',
    });
    assert.equal(porId('ver-guia').titulo, '¿Necesitas ayuda?');
    assert.equal(porId('ver-guia').descripcion, 'Puedes repetir esta guía cuando quieras desde aquí.');
  });

  test('cada ancla tiene la forma [data-tour="<id>"] y los id son únicos', () => {
    for (const paso of PASOS) assert.equal(paso.elemento, `[data-tour="${paso.id}"]`);
    assert.equal(new Set(PASOS.map((p) => p.id)).size, PASOS.length);
  });
});

describe('agregarPaso', () => {
  const quitar = (id) => {
    const indice = PASOS.findIndex((p) => p.id === id);
    if (indice >= 0) PASOS.splice(indice, 1);
  };
  const paso = (id) => ({ id, elemento: `[data-tour="${id}"]`, titulo: id, descripcion: `Paso ${id}` });

  test('inserta el paso justo antes del id indicado', () => {
    agregarPaso(paso('ejemplo'), { antesDe: 'ver-guia' });
    try {
      const ids = PASOS.map((p) => p.id);
      assert.equal(ids[ids.indexOf('ver-guia') - 1], 'ejemplo');
      assert.equal(ids.at(-1), 'ver-guia');
    } finally {
      quitar('ejemplo');
    }
  });

  test('lo agrega al final si no se indica antesDe o si ese id no existe', () => {
    agregarPaso(paso('al-final'));
    agregarPaso(paso('sin-ancla'), { antesDe: 'no-existe' });
    try {
      assert.deepEqual(PASOS.slice(-2).map((p) => p.id), ['al-final', 'sin-ancla']);
    } finally {
      quitar('al-final');
      quitar('sin-ancla');
    }
  });

  test('no duplica un id ya registrado', () => {
    const antes = PASOS.length;
    agregarPaso(paso('lista'), { antesDe: 'ver-guia' });
    assert.equal(PASOS.length, antes);
    assert.equal(PASOS.find((p) => p.id === 'lista').titulo, 'Tus hábitos');
  });
});
