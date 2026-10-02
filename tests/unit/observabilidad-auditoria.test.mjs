// Pruebas del registro de auditoría y su cadena de hashes (spec 007, T004 y T005).
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  exportarCSV,
  HASH_INICIAL,
  leerAuditoria,
  registrarEvento,
  verificarIntegridad,
} from '../../web/src/observabilidad/auditoria.js';

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

const CLAVE = 'habitos.v1.auditoria';

function instalar() {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new AlmacenEnMemoria(),
    configurable: true,
    writable: true,
  });
}

const guardados = () => JSON.parse(globalThis.localStorage.getItem(CLAVE) ?? '[]');
const guardar = (eventos) => globalThis.localStorage.setItem(CLAVE, JSON.stringify(eventos));

async function sembrarTres() {
  await registrarEvento({ accion: 'sesion.iniciada', actor: 'demo@habitos.app' });
  await registrarEvento({ accion: 'habito.creado', actor: 'demo@habitos.app', recurso: 'Tomar agua' });
  await registrarEvento({ accion: 'habito.eliminado', actor: 'demo@habitos.app', recurso: 'Tomar agua' });
}

describe('auditoría', () => {
  beforeEach(() => instalar());

  test('el primer evento arranca la cadena y el siguiente se encadena a él', async () => {
    const primero = await registrarEvento({ accion: 'sesion.iniciada', actor: 'demo@habitos.app' });
    const segundo = await registrarEvento({ accion: 'habito.creado', actor: 'demo@habitos.app', recurso: 'Leer' });

    assert.equal(primero.hashAnterior, HASH_INICIAL);
    assert.equal(segundo.hashAnterior, primero.hash);
    assert.notEqual(primero.hash, segundo.hash);
  });

  test('guarda quién, qué, sobre qué y con qué resultado', async () => {
    const evento = await registrarEvento({
      accion: 'habito.eliminado',
      actor: 'demo@habitos.app',
      recurso: 'Tomar agua',
      detalle: { diasCumplidos: 3 },
      resultado: 'exito',
    });
    assert.equal(evento.actor, 'demo@habitos.app');
    assert.equal(evento.accion, 'habito.eliminado');
    assert.equal(evento.recurso, 'Tomar agua');
    assert.deepEqual(evento.detalle, { diasCumplidos: 3 });
    assert.equal(evento.resultado, 'exito');
  });

  test('un resultado desconocido se normaliza a éxito', async () => {
    const evento = await registrarEvento({ accion: 'x', actor: 'y', resultado: 'inventado' });
    assert.equal(evento.resultado, 'exito');
  });

  test('una cadena intacta se verifica correctamente', async () => {
    await sembrarTres();
    assert.deepEqual(await verificarIntegridad(), { ok: true, total: 3 });
  });

  test('detecta que alguien modificó el contenido de un evento', async () => {
    await sembrarTres();
    const eventos = guardados();
    eventos[1].recurso = 'Otro hábito'; // se altera sin recalcular el hash
    guardar(eventos);

    const resultado = await verificarIntegridad();
    assert.equal(resultado.ok, false);
    assert.equal(resultado.posicion, 1);
    assert.match(resultado.motivo, /modificado/);
  });

  test('detecta que alguien borró un evento del historial', async () => {
    await sembrarTres();
    const eventos = guardados();
    guardar([eventos[0], eventos[2]]); // se elimina el de en medio

    const resultado = await verificarIntegridad();
    assert.equal(resultado.ok, false);
    assert.equal(resultado.posicion, 1);
    assert.match(resultado.motivo, /falta un evento/);
  });

  test('lista del más reciente al más antiguo y filtra por acción', async () => {
    await sembrarTres();
    assert.deepEqual(
      leerAuditoria().map((e) => e.accion),
      ['habito.eliminado', 'habito.creado', 'sesion.iniciada'],
    );
    assert.equal(leerAuditoria({ accion: 'habito.creado' }).length, 1);
    assert.equal(leerAuditoria({ texto: 'Tomar agua' }).length, 2);
  });

  test('varios eventos sin esperar entre ellos conservan la cadena', async () => {
    // Sin la cola interna, las tres llamadas leerían el mismo estado y se sobreescribirían.
    await Promise.all([
      registrarEvento({ accion: 'habito.creado', actor: 'demo@habitos.app', recurso: 'A' }),
      registrarEvento({ accion: 'habito.creado', actor: 'demo@habitos.app', recurso: 'B' }),
      registrarEvento({ accion: 'habito.creado', actor: 'demo@habitos.app', recurso: 'C' }),
    ]);

    assert.equal(leerAuditoria().length, 3);
    assert.deepEqual(await verificarIntegridad(), { ok: true, total: 3 });
  });

  test('exporta a CSV con encabezado y una fila por evento', async () => {
    await sembrarTres();
    const lineas = exportarCSV().trim().split('\n');
    assert.equal(lineas[0], 'fecha,actor,accion,recurso,resultado,detalle,hash');
    assert.equal(lineas.length, 4);
    assert.match(lineas[1], /sesion\.iniciada/);
  });
});
