// Pruebas de la bitácora de registros (spec 006, T004). Se sustituye localStorage por un doble.
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  aviso,
  error,
  info,
  leerBitacora,
  limpiarBitacora,
  MAXIMO_ENTRADAS,
  registrar,
} from '../../web/src/observabilidad/bitacora.js';
import { conTraza, limpiarTrazas, trazaActiva } from '../../web/src/observabilidad/trazas.js';

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

function instalar(valor) {
  Object.defineProperty(globalThis, 'localStorage', { value: valor, configurable: true, writable: true });
}

describe('bitácora', () => {
  beforeEach(() => {
    instalar(new AlmacenEnMemoria());
    limpiarBitacora();
    limpiarTrazas();
  });

  test('guarda una entrada con nivel, mensaje y contexto', () => {
    const entrada = info('hábito creado', { nombre: 'Tomar agua' });
    assert.equal(entrada.nivel, 'info');
    assert.equal(entrada.mensaje, 'hábito creado');
    assert.deepEqual(entrada.contexto, { nombre: 'Tomar agua' });
    assert.match(entrada.fecha, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(leerBitacora().length, 1);
  });

  test('un nivel desconocido cae a info en vez de perder la entrada', () => {
    assert.equal(registrar('catastrofe', 'algo').nivel, 'info');
  });

  test('devuelve las entradas de la más reciente a la más antigua', () => {
    info('primera');
    info('segunda');
    assert.deepEqual(
      leerBitacora().map((e) => e.mensaje),
      ['segunda', 'primera'],
    );
  });

  test('filtra por nivel, por texto del mensaje y por texto del contexto', () => {
    info('hábito creado', { nombre: 'Leer' });
    aviso('nombre duplicado', { nombre: 'Leer' });
    error('falló al guardar', { codigo: 'QUOTA' });

    assert.equal(leerBitacora({ nivel: 'error' }).length, 1);
    assert.equal(leerBitacora({ texto: 'duplicado' })[0].nivel, 'aviso');
    assert.equal(leerBitacora({ texto: 'QUOTA' })[0].mensaje, 'falló al guardar');
    assert.equal(leerBitacora({ nivel: 'info', texto: 'nada de esto' }).length, 0);
  });

  test('cada entrada guarda la traza en curso, para poder correlacionar', () => {
    let idDuranteLaTraza = null;
    conTraza('crear hábito', () => {
      idDuranteLaTraza = trazaActiva();
      info('validado');
    });
    info('fuera de la traza');

    const [fuera, dentro] = leerBitacora();
    assert.equal(dentro.trazaId, idDuranteLaTraza);
    assert.equal(fuera.trazaId, null);
    assert.equal(leerBitacora({ trazaId: idDuranteLaTraza }).length, 1);
  });

  test('conserva solo las últimas entradas y no crece sin límite', () => {
    for (let i = 0; i < MAXIMO_ENTRADAS + 25; i++) info(`entrada ${i}`);
    const entradas = leerBitacora();
    assert.equal(entradas.length, MAXIMO_ENTRADAS);
    assert.equal(entradas[0].mensaje, `entrada ${MAXIMO_ENTRADAS + 24}`);
  });

  test('descarta entradas corruptas en vez de romper el visor', () => {
    globalThis.localStorage.setItem(
      'habitos.v1.bitacora',
      JSON.stringify([{ sin: 'forma' }, { id: 'a1', fecha: '2026-10-01T00:00:00.000Z', nivel: 'info', mensaje: 'buena' }]),
    );
    assert.deepEqual(
      leerBitacora().map((e) => e.mensaje),
      ['buena'],
    );
  });

  test('con el almacenamiento bloqueado no lanza y la aplicación sigue', () => {
    instalar(new AlmacenQueFalla());
    assert.doesNotThrow(() => info('sin almacenamiento'));
    assert.deepEqual(leerBitacora(), []);
  });
});
