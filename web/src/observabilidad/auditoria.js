// Registro de auditoría del panel — spec 007.
//
// Diferencia con la bitácora: la bitácora sirve para depurar y se puede borrar; la auditoría
// responde "quién hizo qué, cuándo y con qué resultado" y debe poder comprobarse.
//
// Cada evento guarda el hash SHA-256 del evento anterior, formando una cadena. Si alguien edita o
// borra un evento del historial, la verificación lo detecta. En un sistema real la cadena vive en
// el servidor y va firmada; aquí demuestra el mecanismo del lado del panel.
import { CLAVES_OBS, guardarJSON, identificador, leerLista, limpiar } from './deposito.js';

export const MAXIMO_EVENTOS = 500;
export const RESULTADOS = Object.freeze(['exito', 'rechazado', 'error']);
export const HASH_INICIAL = '0'.repeat(16);

const esEvento = (e) =>
  e !== null &&
  typeof e === 'object' &&
  typeof e.id === 'string' &&
  typeof e.fecha === 'string' &&
  typeof e.accion === 'string' &&
  typeof e.actor === 'string' &&
  typeof e.hash === 'string';

const suscriptores = new Set();

function avisar() {
  for (const suscriptor of suscriptores) {
    try {
      suscriptor();
    } catch {
      // Un visor con error no debe afectar a la aplicación.
    }
  }
}

export function alCambiar(suscriptor) {
  suscriptores.add(suscriptor);
  return () => suscriptores.delete(suscriptor);
}

/** Texto canónico del evento: el mismo contenido produce siempre el mismo hash. */
function contenido(evento) {
  return [
    evento.fecha,
    evento.actor,
    evento.accion,
    evento.recurso ?? '',
    evento.resultado,
    JSON.stringify(evento.detalle ?? {}),
    evento.hashAnterior,
  ].join('|');
}

/** SHA-256 recortado a 16 caracteres: suficiente para detectar alteraciones en este panel. */
export async function calcularHash(evento) {
  const datos = new TextEncoder().encode(contenido(evento));
  const resumen = await globalThis.crypto.subtle.digest('SHA-256', datos);
  return Array.from(new Uint8Array(resumen), (b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

/**
 * Agrega un evento a la auditoría, encadenado al anterior.
 *
 * Calcular el hash es asíncrono, así que dos llamadas sin esperar entre ellas podrían leer la misma
 * cola y romper la cadena. Para evitarlo, los eventos se encolan: `registrarEvento` siempre escribe
 * de uno en uno, en el orden en que se le pidió.
 * @param {{accion: string, actor: string, recurso?: string, detalle?: object, resultado?: string}} datos
 * @returns {Promise<object>} el evento guardado
 */
export function registrarEvento(datos) {
  const siguiente = () => escribirEvento(datos);
  cola = cola.then(siguiente, siguiente);
  return cola;
}

let cola = Promise.resolve();

async function escribirEvento({ accion, actor, recurso = '', detalle = {}, resultado = 'exito' }) {
  const eventos = leerLista(CLAVES_OBS.auditoria, esEvento);
  const anterior = eventos[eventos.length - 1];
  const evento = {
    id: identificador(),
    fecha: new Date().toISOString(),
    actor: String(actor),
    accion: String(accion),
    recurso: String(recurso),
    resultado: RESULTADOS.includes(resultado) ? resultado : 'exito',
    detalle,
    hashAnterior: anterior ? anterior.hash : HASH_INICIAL,
  };
  evento.hash = await calcularHash(evento);

  eventos.push(evento);
  // La auditoría conserva los eventos más recientes; al recortar, el primero que queda se vuelve
  // el inicio de la cadena, y se marca para que la verificación no lo tome como alteración.
  if (eventos.length > MAXIMO_EVENTOS) {
    const recortados = eventos.slice(eventos.length - MAXIMO_EVENTOS);
    recortados[0] = { ...recortados[0], inicioDeCadena: true };
    guardarJSON(CLAVES_OBS.auditoria, recortados);
  } else {
    guardarJSON(CLAVES_OBS.auditoria, eventos);
  }
  avisar();
  return evento;
}

/** Eventos guardados, del más reciente al más antiguo, con filtros opcionales. */
export function leerAuditoria({ actor = '', accion = '', resultado = '', texto = '' } = {}) {
  const busqueda = texto.trim().toLowerCase();
  return leerLista(CLAVES_OBS.auditoria, esEvento)
    .slice()
    .reverse()
    .filter((e) => !actor || e.actor === actor)
    .filter((e) => !accion || e.accion === accion)
    .filter((e) => !resultado || e.resultado === resultado)
    .filter(
      (e) =>
        !busqueda ||
        e.accion.toLowerCase().includes(busqueda) ||
        e.recurso.toLowerCase().includes(busqueda) ||
        JSON.stringify(e.detalle).toLowerCase().includes(busqueda),
    );
}

/**
 * Recalcula toda la cadena y detecta si algún evento fue alterado o eliminado.
 * @returns {Promise<{ok: boolean, total: number, motivo?: string, eventoId?: string, posicion?: number}>}
 */
export async function verificarIntegridad() {
  const eventos = leerLista(CLAVES_OBS.auditoria, esEvento);
  let esperado = HASH_INICIAL;
  for (const [posicion, evento] of eventos.entries()) {
    if (posicion === 0 && evento.inicioDeCadena) esperado = evento.hashAnterior;
    if (evento.hashAnterior !== esperado) {
      return { ok: false, total: eventos.length, posicion, eventoId: evento.id, motivo: 'falta un evento anterior o fue reordenado' };
    }
    if ((await calcularHash(evento)) !== evento.hash) {
      return { ok: false, total: eventos.length, posicion, eventoId: evento.id, motivo: 'el contenido del evento fue modificado' };
    }
    esperado = evento.hash;
  }
  return { ok: true, total: eventos.length };
}

/** Exporta la auditoría como CSV, que es lo que suele pedir un revisor. */
export function exportarCSV() {
  const eventos = leerLista(CLAVES_OBS.auditoria, esEvento);
  const escapar = (valor) => `"${String(valor).replace(/"/g, '""')}"`;
  const filas = eventos.map((e) =>
    [e.fecha, e.actor, e.accion, e.recurso, e.resultado, JSON.stringify(e.detalle), e.hash].map(escapar).join(','),
  );
  return ['fecha,actor,accion,recurso,resultado,detalle,hash', ...filas].join('\n');
}

/** Borrar la auditoría es, en sí, un evento auditable: queda como primer eslabón de la cadena nueva. */
export async function limpiarAuditoria(actor) {
  limpiar(CLAVES_OBS.auditoria);
  avisar();
  return registrarEvento({ accion: 'auditoria.limpiada', actor, recurso: 'auditoria', detalle: {} });
}
