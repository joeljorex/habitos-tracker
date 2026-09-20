// Pruebas unitarias del cálculo de rachas (spec 004, T003).
//
// Los casos V01–V13 son los casos de referencia del contrato
// (specs/004-logica-rachas/contracts/rachas-contract.md §2), obligatorios en todos los clientes
// (panel, app Android con JUnit y API con PHPUnit): una prueba por caso, nombrada con su ID.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularRachas } from '../../web/src/dominio/rachas.js';

const CASOS = [
  { id: 'V01', regla: 'FR-006 sin registros', hoy: '2026-09-10', fechas: [], actual: 0, maxima: 0 },
  { id: 'V02', regla: 'FR-002 cumplido hoy', hoy: '2026-09-10', fechas: ['2026-09-10'], actual: 1, maxima: 1 },
  { id: 'V03', regla: 'FR-002 viva desde ayer', hoy: '2026-09-10', fechas: ['2026-09-09'], actual: 1, maxima: 1 },
  { id: 'V04', regla: 'FR-002 rota', hoy: '2026-09-10', fechas: ['2026-09-08'], actual: 0, maxima: 1 },
  {
    id: 'V05',
    regla: 'FR-002 tres días seguidos',
    hoy: '2026-09-10',
    fechas: ['2026-09-08', '2026-09-09', '2026-09-10'],
    actual: 3,
    maxima: 3,
  },
  {
    id: 'V06',
    regla: 'CP-04 día saltado',
    hoy: '2026-09-04',
    fechas: ['2026-09-01', '2026-09-02', '2026-09-04'],
    actual: 1,
    maxima: 2,
  },
  {
    id: 'V07',
    regla: 'FR-004 duplicados',
    hoy: '2026-09-10',
    fechas: ['2026-09-10', '2026-09-10', '2026-09-09'],
    actual: 2,
    maxima: 2,
  },
  {
    id: 'V08',
    regla: 'FR-005 futuro ignorado',
    hoy: '2026-09-10',
    fechas: ['2026-09-10', '2026-09-11'],
    actual: 1,
    maxima: 1,
  },
  {
    id: 'V09',
    regla: 'FR-008 bisiesto',
    hoy: '2028-03-01',
    fechas: ['2028-02-28', '2028-02-29', '2028-03-01'],
    actual: 3,
    maxima: 3,
  },
  {
    id: 'V10',
    regla: 'FR-008 año no bisiesto',
    hoy: '2026-03-01',
    fechas: ['2026-02-28', '2026-03-01'],
    actual: 2,
    maxima: 2,
  },
  {
    id: 'V11',
    regla: 'FR-008 cambio de año',
    hoy: '2027-01-01',
    fechas: ['2026-12-31', '2027-01-01'],
    actual: 2,
    maxima: 2,
  },
  {
    id: 'V12',
    regla: 'FR-003 mejor histórica',
    hoy: '2026-09-10',
    fechas: ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-09', '2026-09-10'],
    actual: 2,
    maxima: 5,
  },
  {
    id: 'V13',
    regla: 'FR-007 desordenadas',
    hoy: '2026-09-10',
    fechas: ['2026-09-10', '2026-09-08', '2026-09-09'],
    actual: 3,
    maxima: 3,
  },
];

describe('Casos de referencia del contrato (V01–V13)', () => {
  for (const { id, regla, hoy, fechas, actual, maxima } of CASOS) {
    test(`${id} ${regla}: hoy ${hoy}, [${fechas.join(', ')}] → actual ${actual}, mejor ${maxima}`, () => {
      assert.deepEqual(calcularRachas(fechas, hoy), { actual, maxima });
    });
  }
});

describe('Casos adicionales', () => {
  test('es pura: no modifica ni reordena las fechas recibidas', () => {
    const fechas = ['2026-09-10', '2026-09-08', '2026-09-09'];
    const copia = [...fechas];
    calcularRachas(fechas, '2026-09-10');
    assert.deepEqual(fechas, copia);
  });

  test('el cambio de horario de verano no afecta (8 de marzo de 2026 en EE. UU.)', () => {
    assert.deepEqual(calcularRachas(['2026-03-07', '2026-03-08', '2026-03-09'], '2026-03-09'), {
      actual: 3,
      maxima: 3,
    });
  });

  test('con un "hoy" inválido devuelve 0 y 0', () => {
    assert.deepEqual(calcularRachas(['2026-09-10'], 'hoy'), { actual: 0, maxima: 0 });
  });

  test('ignora fechas con formato inválido', () => {
    assert.deepEqual(calcularRachas(['2026-09-10', 'ayer', '', '2026-9-9'], '2026-09-10'), {
      actual: 1,
      maxima: 1,
    });
  });
});
