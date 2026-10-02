// Pruebas de las métricas del panel y su exportación a Prometheus (spec 005, T004).
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clave,
  exportarPrometheus,
  incrementar,
  leerMetricas,
  limpiarMetricas,
  observar,
} from '../../web/src/observabilidad/metricas.js';

class AlmacenEnMemoria {
  #datos = new Map();
  getItem(c) {
    return this.#datos.has(c) ? this.#datos.get(c) : null;
  }
  setItem(c, valor) {
    this.#datos.set(c, String(valor));
  }
  removeItem(c) {
    this.#datos.delete(c);
  }
}

function instalar() {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new AlmacenEnMemoria(),
    configurable: true,
    writable: true,
  });
}

describe('métricas', () => {
  beforeEach(() => {
    instalar();
    limpiarMetricas();
  });

  test('el contador suma cada vez que se incrementa', () => {
    incrementar('habitos_creados_total');
    incrementar('habitos_creados_total');
    incrementar('habitos_creados_total', {}, 3);
    assert.equal(leerMetricas().contadores['habitos_creados_total'], 5);
  });

  test('las etiquetas separan series y no dependen del orden en que se escriban', () => {
    incrementar('acciones_total', { accion: 'crear', resultado: 'exito' });
    incrementar('acciones_total', { resultado: 'exito', accion: 'crear' });
    incrementar('acciones_total', { accion: 'crear', resultado: 'rechazado' });

    const contadores = leerMetricas().contadores;
    assert.equal(contadores['acciones_total{accion="crear",resultado="exito"}'], 2);
    assert.equal(contadores['acciones_total{accion="crear",resultado="rechazado"}'], 1);
    assert.equal(clave('x', { b: 2, a: 1 }), 'x{a="1",b="2"}');
  });

  test('la duración guarda cuenta, suma, mínimo, máximo y promedio', () => {
    observar('operacion_duracion_ms', 10, { operacion: 'crear' });
    observar('operacion_duracion_ms', 30, { operacion: 'crear' });

    const resumen = leerMetricas().duraciones['operacion_duracion_ms{operacion="crear"}'];
    assert.equal(resumen.cuenta, 2);
    assert.equal(resumen.suma, 40);
    assert.equal(resumen.min, 10);
    assert.equal(resumen.max, 30);
    assert.equal(resumen.promedio, 20);
  });

  test('un valor que no es número se ignora', () => {
    assert.equal(observar('operacion_duracion_ms', Number.NaN), null);
    assert.deepEqual(leerMetricas().duraciones, {});
  });

  test('exporta en el formato de texto de Prometheus, con segundos en las duraciones', () => {
    incrementar('habitos_creados_total', { resultado: 'exito' });
    observar('operacion_duracion_ms', 250, { operacion: 'crear' });

    const texto = exportarPrometheus();
    assert.match(texto, /# TYPE habitos_creados_total counter/);
    assert.match(texto, /habitos_creados_total\{resultado="exito"\} 1/);
    assert.match(texto, /# TYPE operacion_duracion_ms summary/);
    assert.match(texto, /operacion_duracion_ms_count\{operacion="crear"\} 1/);
    assert.match(texto, /operacion_duracion_ms_sum\{operacion="crear"\} 0\.25/);
  });

  test('sin métricas, la exportación queda vacía en vez de fallar', () => {
    assert.equal(exportarPrometheus(), '');
  });
});
