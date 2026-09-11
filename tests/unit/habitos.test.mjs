// Pruebas unitarias del dominio de hábitos (spec 001: T011, T015, T022).
// Contrato: specs/001-panel-web-e2e/contracts/ui-contract.md §3.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crearHabito,
  diasCumplidos,
  eliminarHabito,
  estaHechoHoy,
  fechaLocal,
  marcarHecho,
  ordenarPorCreacion,
  validarNombre,
} from '../../web/src/dominio/habitos.js';

const VACIO = 'Escribe un nombre para el hábito.';
const LARGO = 'El nombre puede tener máximo 60 caracteres.';
const DUPLICADO = 'Ya tienes un hábito con ese nombre.';

const habito = (id, nombre, creadoEn = '2026-09-01T15:00:00.000Z') => ({ id, nombre, creadoEn });

describe('fechaLocal', () => {
  test('devuelve el día calendario local como YYYY-MM-DD', () => {
    assert.equal(fechaLocal(new Date(2026, 8, 11, 23, 59, 59)), '2026-09-11');
    assert.equal(fechaLocal(new Date(2026, 0, 5, 0, 0, 0)), '2026-01-05');
    assert.equal(fechaLocal(new Date(2028, 1, 29, 12, 0, 0)), '2028-02-29');
  });
});

describe('validarNombre', () => {
  test('rechaza el nombre vacío', () => {
    assert.deepEqual(validarNombre('', []), { ok: false, error: 'vacio', mensaje: VACIO });
  });

  test('rechaza un nombre con solo espacios', () => {
    assert.deepEqual(validarNombre('   \t  ', []), { ok: false, error: 'vacio', mensaje: VACIO });
  });

  test('acepta exactamente 60 caracteres', () => {
    const nombre = 'a'.repeat(60);
    assert.deepEqual(validarNombre(nombre, []), { ok: true, valor: nombre });
  });

  test('rechaza 61 caracteres', () => {
    assert.deepEqual(validarNombre('a'.repeat(61), []), { ok: false, error: 'largo', mensaje: LARGO });
  });

  test('recorta los espacios antes de validar la longitud', () => {
    const nombre = 'a'.repeat(60);
    assert.deepEqual(validarNombre(`   ${nombre}   `, []), { ok: true, valor: nombre });
  });

  test('cuenta caracteres y no unidades UTF-16 (emoji)', () => {
    assert.equal(validarNombre('💧'.repeat(60), []).ok, true);
    assert.equal(validarNombre('💧'.repeat(61), []).error, 'largo');
  });

  test('rechaza un duplicado sin distinguir mayúsculas ni espacios extremos', () => {
    const existentes = [habito('h1', 'Tomar agua')];
    assert.deepEqual(validarNombre(' tomar AGUA ', existentes), {
      ok: false,
      error: 'duplicado',
      mensaje: DUPLICADO,
    });
  });

  test('acepta un nombre distinto y lo devuelve recortado', () => {
    const existentes = [habito('h1', 'Tomar agua')];
    assert.deepEqual(validarNombre('  Leer 20 min ', existentes), { ok: true, valor: 'Leer 20 min' });
  });
});

describe('crearHabito', () => {
  const ahora = new Date('2026-09-11T17:00:00.000Z');

  test('crea el hábito con id, nombre recortado y fecha de creación', () => {
    const resultado = crearHabito('  Tomar agua ', [], ahora, () => 'id-fijo');
    assert.deepEqual(resultado, {
      ok: true,
      habito: { id: 'id-fijo', nombre: 'Tomar agua', creadoEn: '2026-09-11T17:00:00.000Z' },
    });
  });

  test('devuelve el error de validación y no crea nada', () => {
    const existentes = [habito('h1', 'Tomar agua')];
    assert.deepEqual(crearHabito('TOMAR AGUA', existentes, ahora, () => 'x'), {
      ok: false,
      error: 'duplicado',
      mensaje: DUPLICADO,
    });
    assert.deepEqual(crearHabito('', existentes, ahora), { ok: false, error: 'vacio', mensaje: VACIO });
    assert.deepEqual(crearHabito('b'.repeat(61), existentes, ahora), { ok: false, error: 'largo', mensaje: LARGO });
  });

  test('no modifica la lista de existentes', () => {
    const existentes = [habito('h1', 'Tomar agua')];
    const copia = structuredClone(existentes);
    crearHabito('Leer', existentes, ahora, () => 'h2');
    assert.deepEqual(existentes, copia);
  });

  test('genera identificadores únicos por defecto', () => {
    const a = crearHabito('A', [], ahora);
    const b = crearHabito('B', [], ahora);
    assert.equal(typeof a.habito.id, 'string');
    assert.ok(a.habito.id.length > 0);
    assert.notEqual(a.habito.id, b.habito.id);
  });
});

describe('marcarHecho', () => {
  test('agrega un registro (habitoId, fecha) sin modificar el arreglo original', () => {
    const registros = [];
    const nuevos = marcarHecho(registros, 'h1', '2026-09-11');
    assert.deepEqual(nuevos, [{ habitoId: 'h1', fecha: '2026-09-11' }]);
    assert.deepEqual(registros, []);
  });

  test('es idempotente: como máximo un registro por (habitoId, fecha)', () => {
    const una = marcarHecho([], 'h1', '2026-09-11');
    const dos = marcarHecho(una, 'h1', '2026-09-11');
    const tres = marcarHecho(dos, 'h1', '2026-09-11');
    assert.deepEqual(tres, [{ habitoId: 'h1', fecha: '2026-09-11' }]);
  });

  test('permite el mismo día en otro hábito y otro día en el mismo hábito', () => {
    let registros = marcarHecho([], 'h1', '2026-09-11');
    registros = marcarHecho(registros, 'h2', '2026-09-11');
    registros = marcarHecho(registros, 'h1', '2026-09-12');
    assert.equal(registros.length, 3);
  });
});

describe('estaHechoHoy', () => {
  const registros = [
    { habitoId: 'h1', fecha: '2026-09-10' },
    { habitoId: 'h2', fecha: '2026-09-11' },
  ];

  test('es verdadero solo si hay un registro del hábito con la fecha de hoy', () => {
    assert.equal(estaHechoHoy(registros, 'h2', '2026-09-11'), true);
    assert.equal(estaHechoHoy(registros, 'h1', '2026-09-11'), false);
    assert.equal(estaHechoHoy([], 'h1', '2026-09-11'), false);
  });
});

describe('diasCumplidos', () => {
  test('cuenta fechas distintas del hábito', () => {
    const registros = [
      { habitoId: 'h1', fecha: '2026-09-09' },
      { habitoId: 'h1', fecha: '2026-09-10' },
      { habitoId: 'h1', fecha: '2026-09-10' },
      { habitoId: 'h2', fecha: '2026-09-10' },
    ];
    assert.equal(diasCumplidos(registros, 'h1'), 2);
    assert.equal(diasCumplidos(registros, 'h2'), 1);
    assert.equal(diasCumplidos(registros, 'h3'), 0);
  });
});

describe('eliminarHabito', () => {
  test('elimina el hábito y sus registros en cascada, sin tocar los demás', () => {
    const habitos = [habito('h1', 'Leer'), habito('h2', 'Tomar agua')];
    const registros = [
      { habitoId: 'h1', fecha: '2026-09-09' },
      { habitoId: 'h1', fecha: '2026-09-10' },
      { habitoId: 'h2', fecha: '2026-09-10' },
    ];
    const copiaHabitos = structuredClone(habitos);
    const copiaRegistros = structuredClone(registros);

    const resultado = eliminarHabito(habitos, registros, 'h1');

    assert.deepEqual(resultado, {
      habitos: [habito('h2', 'Tomar agua')],
      registros: [{ habitoId: 'h2', fecha: '2026-09-10' }],
    });
    assert.deepEqual(habitos, copiaHabitos);
    assert.deepEqual(registros, copiaRegistros);
  });
});

describe('ordenarPorCreacion', () => {
  test('ordena por fecha de creación sin modificar la entrada', () => {
    const habitos = [
      habito('c', 'C', '2026-09-03T10:00:00.000Z'),
      habito('a', 'A', '2026-09-01T10:00:00.000Z'),
      habito('b', 'B', '2026-09-02T10:00:00.000Z'),
    ];
    assert.deepEqual(ordenarPorCreacion(habitos).map((h) => h.id), ['a', 'b', 'c']);
    assert.deepEqual(habitos.map((h) => h.id), ['c', 'a', 'b']);
  });
});
