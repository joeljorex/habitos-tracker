// Pruebas unitarias del almacenamiento del navegador (spec 001, T006 y caso borde
// "datos guardados corruptos"). Se sustituye localStorage/sessionStorage por dobles en memoria.
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  borrarSesion,
  CLAVES,
  guardarHabitos,
  guardarRegistros,
  guardarSesion,
  guardarTourVisto,
  leerHabitos,
  leerRegistros,
  leerSesion,
  leerTourVisto,
} from '../../web/src/almacen.js';

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

class AlmacenQueFalla {
  getItem() {
    throw new Error('SecurityError');
  }
  setItem() {
    throw new Error('QuotaExceededError');
  }
  removeItem() {
    throw new Error('SecurityError');
  }
}

function instalar(nombre, valor) {
  Object.defineProperty(globalThis, nombre, { value: valor, configurable: true, writable: true });
}

beforeEach(() => {
  instalar('localStorage', new AlmacenEnMemoria());
  instalar('sessionStorage', new AlmacenEnMemoria());
});

describe('claves', () => {
  test('usan el prefijo versionado habitos.v1.', () => {
    assert.deepEqual(CLAVES, {
      habitos: 'habitos.v1.habitos',
      registros: 'habitos.v1.registros',
      tourVisto: 'habitos.v1.tourVisto',
      sesion: 'habitos.v1.sesion',
    });
  });
});

describe('hábitos y registros (localStorage)', () => {
  test('sin datos devuelve listas vacías', () => {
    assert.deepEqual(leerHabitos(), []);
    assert.deepEqual(leerRegistros(), []);
  });

  test('guarda y lee de ida y vuelta', () => {
    const habitos = [{ id: 'h1', nombre: 'Tomar agua', creadoEn: '2026-09-11T17:00:00.000Z' }];
    const registros = [{ habitoId: 'h1', fecha: '2026-09-11' }];
    guardarHabitos(habitos);
    guardarRegistros(registros);
    assert.deepEqual(leerHabitos(), habitos);
    assert.deepEqual(leerRegistros(), registros);
    assert.equal(localStorage.getItem('habitos.v1.habitos'), JSON.stringify(habitos));
  });

  test('un JSON inválido se trata como vacío', () => {
    localStorage.setItem(CLAVES.habitos, '{esto no es JSON');
    localStorage.setItem(CLAVES.registros, '[1, 2');
    assert.deepEqual(leerHabitos(), []);
    assert.deepEqual(leerRegistros(), []);
  });

  test('un JSON que no es arreglo se trata como vacío', () => {
    localStorage.setItem(CLAVES.habitos, '{"id":"h1"}');
    localStorage.setItem(CLAVES.registros, 'null');
    assert.deepEqual(leerHabitos(), []);
    assert.deepEqual(leerRegistros(), []);
  });

  test('descarta elementos con forma inválida', () => {
    localStorage.setItem(
      CLAVES.habitos,
      JSON.stringify([{ id: 'h1', nombre: 'Leer', creadoEn: '2026-09-11T17:00:00.000Z' }, { nombre: 'sin id' }, 7]),
    );
    localStorage.setItem(
      CLAVES.registros,
      JSON.stringify([{ habitoId: 'h1', fecha: '2026-09-11' }, { habitoId: 'h1', fecha: 'ayer' }, null]),
    );
    assert.deepEqual(leerHabitos().map((h) => h.id), ['h1']);
    assert.deepEqual(leerRegistros(), [{ habitoId: 'h1', fecha: '2026-09-11' }]);
  });
});

describe('sesión (sessionStorage)', () => {
  test('guarda, lee y borra la sesión', () => {
    assert.equal(leerSesion(), null);
    const sesion = { email: 'demo@habitos.app', iniciadaEn: '2026-09-11T17:00:00.000Z' };
    guardarSesion(sesion);
    assert.deepEqual(leerSesion(), sesion);
    assert.equal(localStorage.getItem(CLAVES.sesion), null, 'la sesión no va en localStorage');
    borrarSesion();
    assert.equal(leerSesion(), null);
  });

  test('una sesión corrupta se trata como ausente', () => {
    sessionStorage.setItem(CLAVES.sesion, 'no-json');
    assert.equal(leerSesion(), null);
    sessionStorage.setItem(CLAVES.sesion, '{"iniciadaEn":"x"}');
    assert.equal(leerSesion(), null);
  });
});

describe('guía vista (localStorage)', () => {
  test('se marca con "1"', () => {
    assert.equal(leerTourVisto(), false);
    guardarTourVisto();
    assert.equal(localStorage.getItem(CLAVES.tourVisto), '1');
    assert.equal(leerTourVisto(), true);
  });
});

describe('almacenamiento no disponible', () => {
  test('los errores del navegador no rompen la aplicación', () => {
    instalar('localStorage', new AlmacenQueFalla());
    instalar('sessionStorage', new AlmacenQueFalla());
    assert.deepEqual(leerHabitos(), []);
    assert.deepEqual(leerRegistros(), []);
    assert.equal(leerSesion(), null);
    assert.equal(leerTourVisto(), false);
    assert.doesNotThrow(() => {
      guardarHabitos([]);
      guardarRegistros([]);
      guardarSesion({ email: 'demo@habitos.app', iniciadaEn: '2026-09-11T17:00:00.000Z' });
      borrarSesion();
      guardarTourVisto();
    });
  });

  test('funciona aunque no existan localStorage ni sessionStorage', () => {
    instalar('localStorage', undefined);
    instalar('sessionStorage', undefined);
    assert.deepEqual(leerHabitos(), []);
    assert.equal(leerSesion(), null);
    assert.doesNotThrow(() => guardarTourVisto());
  });
});
