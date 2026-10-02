// Pruebas de las reglas de alarma (spec 005, T005). Son puras: reciben un corte de métricas.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { estadoGeneral, evaluarAlarmas, UMBRALES } from '../../web/src/observabilidad/alarmas.js';

const regla = (metricas, id) => evaluarAlarmas(metricas).find((a) => a.id === id);

const contadores = (valores) => ({ contadores: valores, duraciones: {} });
const duraciones = (valores) => ({ contadores: {}, duraciones: valores });

describe('alarmas', () => {
  test('sin métricas todas las reglas están en ok', () => {
    const alarmas = evaluarAlarmas({});
    assert.equal(alarmas.length, 4);
    assert.ok(alarmas.every((a) => a.estado === 'ok'));
    assert.equal(estadoGeneral(alarmas), 'ok');
  });

  test('tolera que falten las métricas por completo', () => {
    assert.equal(evaluarAlarmas(undefined).length, 4);
    assert.equal(evaluarAlarmas(null).length, 4);
  });

  test('la tasa de error pasa a aviso y luego a alarma', () => {
    const conErrores = (errores, acciones) =>
      regla(
        contadores({
          'habitos_acciones_total{accion="crear"}': acciones,
          'habitos_errores_total{origen="crear"}': errores,
        }),
        'tasa-errores',
      );

    assert.equal(conErrores(0, 100).estado, 'ok');
    assert.equal(conErrores(2, 100).estado, 'aviso'); // 2 % ≥ 1 %
    assert.equal(conErrores(6, 100).estado, 'alarma'); // 6 % ≥ 5 %
    assert.equal(conErrores(6, 100).valor, '6.0 %');
  });

  test('suma las series de un mismo nombre aunque tengan etiquetas distintas', () => {
    const alarma = regla(
      contadores({
        'habitos_acciones_total{accion="crear"}': 5,
        'habitos_acciones_total{accion="marcar"}': 5,
        'habitos_errores_total{origen="crear"}': 1,
      }),
      'tasa-errores',
    );
    assert.equal(alarma.valor, '10.0 %'); // 1 de 10, no 1 de 5
  });

  test('la latencia usa el máximo de todas las operaciones', () => {
    const alarma = regla(
      duraciones({
        'habitos_operacion_duracion_ms{operacion="crear"}': { cuenta: 1, suma: 40, min: 40, max: 40 },
        'habitos_operacion_duracion_ms{operacion="eliminar"}': { cuenta: 1, suma: 1200, min: 1200, max: 1200 },
      }),
      'latencia-operaciones',
    );
    assert.equal(alarma.estado, 'alarma');
    assert.equal(alarma.valor, '1200 ms');
  });

  test('una operación rápida deja la latencia en ok', () => {
    const alarma = regla(
      duraciones({ 'habitos_operacion_duracion_ms{operacion="crear"}': { cuenta: 2, suma: 30, min: 10, max: 20 } }),
      'latencia-operaciones',
    );
    assert.equal(alarma.estado, 'ok');
    assert.equal(alarma.valor, '20 ms');
  });

  test('un solo fallo al guardar levanta alarma: los datos no se están persistiendo', () => {
    assert.equal(regla(contadores({ habitos_almacen_fallos_total: 1 }), 'fallos-almacenamiento').estado, 'alarma');
    assert.equal(regla(contadores({ habitos_almacen_fallos_total: 0 }), 'fallos-almacenamiento').estado, 'ok');
  });

  test('los accesos rechazados no alarman hasta que hay suficientes intentos', () => {
    const accesos = (rechazados, exitos) =>
      regla(
        contadores({
          'habitos_accesos_total{resultado="rechazado"}': rechazados,
          'habitos_accesos_total{resultado="exito"}': exitos,
        }),
        'accesos-rechazados',
      );

    assert.equal(accesos(2, 0).estado, 'ok', `menos de ${UMBRALES.accesosRechazados.minimoIntentos} intentos`);
    assert.equal(accesos(3, 2).estado, 'aviso'); // 60 %
    assert.equal(accesos(5, 0).estado, 'alarma'); // 100 %
  });

  test('el estado general es el peor de las reglas', () => {
    assert.equal(estadoGeneral([{ estado: 'ok' }, { estado: 'aviso' }]), 'aviso');
    assert.equal(estadoGeneral([{ estado: 'aviso' }, { estado: 'alarma' }]), 'alarma');
    assert.equal(estadoGeneral([{ estado: 'ok' }]), 'ok');
  });
});
