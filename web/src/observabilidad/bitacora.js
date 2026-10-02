// Bitácora de registros (logs) del panel — spec 006.
//
// Cada entrada es estructurada: nivel, mensaje, contexto y el identificador de la traza en curso.
// Ese identificador es lo que permite saltar de un registro a la operación completa que lo produjo.
import { agregar, CLAVES_OBS, identificador, leerLista, limpiar } from './deposito.js';
import { spanActivo, trazaActiva } from './trazas.js';

export const NIVELES = Object.freeze(['depuracion', 'info', 'aviso', 'error']);
export const MAXIMO_ENTRADAS = 300;

const esEntrada = (e) =>
  e !== null &&
  typeof e === 'object' &&
  typeof e.id === 'string' &&
  typeof e.fecha === 'string' &&
  NIVELES.includes(e.nivel) &&
  typeof e.mensaje === 'string';

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

/** Agrega una entrada a la bitácora. Devuelve la entrada creada. */
export function registrar(nivel, mensaje, contexto = {}) {
  const entrada = {
    id: identificador(),
    fecha: new Date().toISOString(),
    nivel: NIVELES.includes(nivel) ? nivel : 'info',
    mensaje: String(mensaje),
    contexto,
    trazaId: trazaActiva(),
    spanId: spanActivo(),
  };
  agregar(CLAVES_OBS.bitacora, entrada, MAXIMO_ENTRADAS, esEntrada);
  avisar();
  return entrada;
}

export const depuracion = (mensaje, contexto) => registrar('depuracion', mensaje, contexto);
export const info = (mensaje, contexto) => registrar('info', mensaje, contexto);
export const aviso = (mensaje, contexto) => registrar('aviso', mensaje, contexto);
export const error = (mensaje, contexto) => registrar('error', mensaje, contexto);

/**
 * Entradas guardadas, de la más reciente a la más antigua, con filtros opcionales.
 * @param {{nivel?: string, texto?: string, trazaId?: string, desde?: string}} filtros
 */
export function leerBitacora({ nivel = '', texto = '', trazaId = '', desde = '' } = {}) {
  const busqueda = texto.trim().toLowerCase();
  return leerLista(CLAVES_OBS.bitacora, esEntrada)
    .slice()
    .reverse()
    .filter((e) => !nivel || e.nivel === nivel)
    .filter((e) => !trazaId || e.trazaId === trazaId)
    .filter((e) => !desde || e.fecha >= desde)
    .filter(
      (e) =>
        !busqueda ||
        e.mensaje.toLowerCase().includes(busqueda) ||
        JSON.stringify(e.contexto).toLowerCase().includes(busqueda),
    );
}

export function limpiarBitacora() {
  limpiar(CLAVES_OBS.bitacora);
  avisar();
}

/** Exporta la bitácora completa en JSON, para adjuntarla a un reporte o a un ticket. */
export function exportarJSON() {
  return JSON.stringify(leerLista(CLAVES_OBS.bitacora, esEntrada), null, 2);
}
