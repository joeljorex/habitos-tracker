// Pruebas de las trazas de operaciones (spec 006, T005).
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  conSpan,
  conTraza,
  iniciarTraza,
  leerTrazas,
  limpiarTrazas,
  MAXIMO_TRAZAS,
  terminarTraza,
  trazaActiva,
} from '../../web/src/observabilidad/trazas.js';

class AlmacenEnMemoria {
  #datos = new Map();
  getItem(clave) {
    return this.#datos.has(clave) ? this.#datos.get(clave) : null;
  }
  setItem(clave, valor) {
    this.#datos.set(clave, String(valor));
  }
  removeItem(clave) {
    this.#datos.delete(clave);
  }
}

function instalar(valor) {
  Object.defineProperty(globalThis, 'localStorage', { value: valor, configurable: true, writable: true });
}

describe('trazas', () => {
  beforeEach(() => {
    instalar(new AlmacenEnMemoria());
    limpiarTrazas();
  });

  test('una traza completa guarda nombre, duración y estado', () => {
    conTraza('crear hábito', () => {}, { origen: 'formulario' });
    const [traza] = leerTrazas();
    assert.equal(traza.nombre, 'crear hábito');
    assert.equal(traza.estado, 'ok');
    assert.deepEqual(traza.atributos, { origen: 'formulario' });
    assert.ok(traza.duracionMs >= 0);
    assert.equal(trazaActiva(), null, 'al terminar no debe quedar traza abierta');
  });

  test('los spans guardan su jerarquía de padre e hijo', () => {
    conTraza('crear hábito', () => {
      conSpan('validar', () => {
        conSpan('normalizar nombre', () => {});
      });
      conSpan('guardar', () => {});
    });

    const [traza] = leerTrazas();
    const porNombre = Object.fromEntries(traza.spans.map((s) => [s.nombre, s]));
    assert.equal(traza.spans.length, 3);
    assert.equal(porNombre['validar'].padreId, null);
    assert.equal(porNombre['normalizar nombre'].padreId, porNombre['validar'].id);
    assert.equal(porNombre['guardar'].padreId, null, 'el hermano vuelve al nivel de arriba');
    for (const span of traza.spans) assert.ok(span.duracionMs >= 0);
  });

  test('un error marca la traza y el span, y se vuelve a lanzar', () => {
    assert.throws(
      () =>
        conTraza('marcar hábito', () => {
          conSpan('guardar', () => {
            throw new Error('cuota llena');
          });
        }),
      /cuota llena/,
    );

    const [traza] = leerTrazas();
    assert.equal(traza.estado, 'error');
    assert.match(traza.error, /cuota llena/);
    assert.equal(traza.spans[0].estado, 'error');
  });

  test('abrir una traza nueva cierra la anterior como incompleta', () => {
    iniciarTraza('primera');
    iniciarTraza('segunda');
    terminarTraza({ estado: 'ok' });

    const estados = Object.fromEntries(leerTrazas().map((t) => [t.nombre, t.estado]));
    assert.equal(estados.primera, 'incompleta');
    assert.equal(estados.segunda, 'ok');
  });

  test('un span fuera de una traza no rompe nada', () => {
    assert.doesNotThrow(() => conSpan('suelto', () => {}));
    assert.deepEqual(leerTrazas(), []);
  });

  test('filtra por nombre y por estado', () => {
    conTraza('crear hábito', () => {});
    conTraza('eliminar hábito', () => {});
    assert.equal(leerTrazas({ nombre: 'crear' }).length, 1);
    assert.equal(leerTrazas({ estado: 'ok' }).length, 2);
    assert.equal(leerTrazas({ estado: 'error' }).length, 0);
  });

  test('conserva solo las últimas trazas', () => {
    for (let i = 0; i < MAXIMO_TRAZAS + 10; i++) conTraza(`traza ${i}`, () => {});
    const trazas = leerTrazas();
    assert.equal(trazas.length, MAXIMO_TRAZAS);
    assert.equal(trazas[0].nombre, `traza ${MAXIMO_TRAZAS + 9}`);
  });
});
