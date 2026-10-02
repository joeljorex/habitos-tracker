// Métricas del panel — spec 005.
//
// Contadores y resúmenes de duración que el panel recolecta del lado del navegador. Se pueden ver
// en el visor y exportar en el formato de texto de Prometheus, que es el que entiende el stack de
// monitoreo (infra/monitoreo/): así la misma métrica sirve para la demostración y para el tablero.
import { CLAVES_OBS, guardarJSON, leerJSON, limpiar } from './deposito.js';

const esNumero = (v) => typeof v === 'number' && Number.isFinite(v);

const vacio = () => ({ contadores: {}, duraciones: {} });

function leerEstado() {
  const estado = leerJSON(CLAVES_OBS.metricas, null);
  if (estado === null || typeof estado !== 'object') return vacio();
  return {
    contadores: typeof estado.contadores === 'object' && estado.contadores !== null ? estado.contadores : {},
    duraciones: typeof estado.duraciones === 'object' && estado.duraciones !== null ? estado.duraciones : {},
  };
}

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

/** Clave estable "nombre{etiqueta="valor"}" para que las etiquetas no dependan del orden. */
export function clave(nombre, etiquetas = {}) {
  const pares = Object.keys(etiquetas)
    .sort()
    .map((k) => `${k}="${String(etiquetas[k]).replace(/"/g, '')}"`);
  return pares.length ? `${nombre}{${pares.join(',')}}` : nombre;
}

/** Suma uno (o lo indicado) a un contador. */
export function incrementar(nombre, etiquetas = {}, valor = 1) {
  const estado = leerEstado();
  const k = clave(nombre, etiquetas);
  estado.contadores[k] = (esNumero(estado.contadores[k]) ? estado.contadores[k] : 0) + valor;
  guardarJSON(CLAVES_OBS.metricas, estado);
  avisar();
  return estado.contadores[k];
}

/** Registra una duración en milisegundos: cuenta, suma, mínimo y máximo. */
export function observar(nombre, milisegundos, etiquetas = {}) {
  if (!esNumero(milisegundos)) return null;
  const estado = leerEstado();
  const k = clave(nombre, etiquetas);
  const actual = estado.duraciones[k] ?? { cuenta: 0, suma: 0, min: null, max: null };
  const resumen = {
    cuenta: actual.cuenta + 1,
    suma: Number((actual.suma + milisegundos).toFixed(3)),
    min: actual.min === null ? milisegundos : Math.min(actual.min, milisegundos),
    max: actual.max === null ? milisegundos : Math.max(actual.max, milisegundos),
  };
  resumen.promedio = Number((resumen.suma / resumen.cuenta).toFixed(3));
  estado.duraciones[k] = resumen;
  guardarJSON(CLAVES_OBS.metricas, estado);
  avisar();
  return resumen;
}

export function leerMetricas() {
  return leerEstado();
}

export function limpiarMetricas() {
  limpiar(CLAVES_OBS.metricas);
  avisar();
}

/**
 * Exporta en el formato de texto de Prometheus. Las duraciones salen como un resumen
 * (_count, _sum, _max), que es lo que permite calcular promedios en el tablero.
 */
export function exportarPrometheus() {
  const { contadores, duraciones } = leerEstado();
  const lineas = [];
  for (const [k, valor] of Object.entries(contadores)) {
    const nombre = k.split('{')[0];
    lineas.push(`# TYPE ${nombre} counter`, `${k} ${valor}`);
  }
  for (const [k, resumen] of Object.entries(duraciones)) {
    const nombre = k.split('{')[0];
    const etiquetas = k.includes('{') ? k.slice(k.indexOf('{')) : '';
    lineas.push(`# TYPE ${nombre} summary`);
    lineas.push(`${nombre}_count${etiquetas} ${resumen.cuenta}`);
    lineas.push(`${nombre}_sum${etiquetas} ${Number((resumen.suma / 1000).toFixed(4))}`);
    lineas.push(`${nombre}_max${etiquetas} ${Number((resumen.max / 1000).toFixed(4))}`);
  }
  return lineas.join('\n') + (lineas.length ? '\n' : '');
}
