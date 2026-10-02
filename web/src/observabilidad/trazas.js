// Trazas (rastros) de las operaciones del panel — spec 006.
//
// Una traza representa una operación completa de la persona que usa el panel ("crear hábito") y se
// compone de spans, que son los pasos dentro de esa operación ("validar", "guardar", "repintar").
// Cada span registra cuánto tardó, quién es su padre y si terminó bien.
//
// El modelo sigue la idea de OpenTelemetry, en versión mínima y sin dependencias: lo que importa
// aquí es poder responder "¿qué pasó en esta operación y en qué se fue el tiempo?".
import { agregar, ahoraMs, CLAVES_OBS, identificador, leerLista, limpiar } from './deposito.js';

export const MAXIMO_TRAZAS = 100;

const esTraza = (t) =>
  t !== null &&
  typeof t === 'object' &&
  typeof t.id === 'string' &&
  typeof t.nombre === 'string' &&
  Array.isArray(t.spans);

let trazaEnCurso = null;
let spanEnCurso = null;
const suscriptores = new Set();

/** Avisa al visor que hay datos nuevos. */
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

/** Identificador de la traza en curso, para que la bitácora pueda correlacionar sus entradas. */
export const trazaActiva = () => trazaEnCurso?.id ?? null;
export const spanActivo = () => spanEnCurso?.id ?? null;

/** Abre una traza. Si ya había una abierta, se cierra como incompleta: nunca se pierden datos. */
export function iniciarTraza(nombre, atributos = {}) {
  if (trazaEnCurso) terminarTraza({ estado: 'incompleta' });
  trazaEnCurso = {
    id: identificador(),
    nombre,
    atributos,
    fecha: new Date().toISOString(),
    inicio: ahoraMs(),
    spans: [],
  };
  spanEnCurso = null;
  return trazaEnCurso;
}

/** Abre un span dentro de la traza en curso. Sin traza abierta, no hace nada. */
export function iniciarSpan(nombre, atributos = {}) {
  if (!trazaEnCurso) return null;
  const span = {
    id: identificador(6),
    padreId: spanEnCurso?.id ?? null,
    nombre,
    atributos,
    inicio: ahoraMs(),
    duracionMs: null,
    estado: 'en curso',
  };
  trazaEnCurso.spans.push(span);
  spanEnCurso = span;
  return span;
}

/** Cierra un span y devuelve el control a su padre. */
export function terminarSpan(span, { estado = 'ok', error = null } = {}) {
  if (!span) return null;
  span.duracionMs = Number((ahoraMs() - span.inicio).toFixed(2));
  span.estado = estado;
  if (error) span.error = String(error.message ?? error);
  if (spanEnCurso === span) {
    spanEnCurso = trazaEnCurso?.spans.find((s) => s.id === span.padreId) ?? null;
  }
  return span;
}

/** Cierra la traza en curso y la guarda. */
export function terminarTraza({ estado = 'ok', error = null } = {}) {
  if (!trazaEnCurso) return null;
  const traza = trazaEnCurso;
  for (const span of traza.spans) {
    if (span.estado === 'en curso') terminarSpan(span, { estado: 'incompleto' });
  }
  traza.duracionMs = Number((ahoraMs() - traza.inicio).toFixed(2));
  traza.estado = estado;
  if (error) traza.error = String(error.message ?? error);
  delete traza.inicio;
  for (const span of traza.spans) delete span.inicio;

  trazaEnCurso = null;
  spanEnCurso = null;
  agregar(CLAVES_OBS.trazas, traza, MAXIMO_TRAZAS, esTraza);
  avisar();
  return traza;
}

/**
 * Envuelve una operación completa: abre la traza, la cierra al terminar y marca el error si lo hay.
 * Devuelve lo que devuelva la operación.
 */
export function conTraza(nombre, operacion, atributos = {}) {
  iniciarTraza(nombre, atributos);
  try {
    const resultado = operacion();
    terminarTraza({ estado: 'ok' });
    return resultado;
  } catch (error) {
    terminarTraza({ estado: 'error', error });
    throw error;
  }
}

/** Envuelve un paso dentro de la traza en curso. */
export function conSpan(nombre, operacion, atributos = {}) {
  const span = iniciarSpan(nombre, atributos);
  try {
    const resultado = operacion();
    terminarSpan(span, { estado: 'ok' });
    return resultado;
  } catch (error) {
    terminarSpan(span, { estado: 'error', error });
    throw error;
  }
}

/** Trazas guardadas, de la más reciente a la más antigua. */
export function leerTrazas({ nombre = '', estado = '' } = {}) {
  const trazas = leerLista(CLAVES_OBS.trazas, esTraza).slice().reverse();
  return trazas.filter(
    (t) =>
      (!nombre || t.nombre.toLowerCase().includes(nombre.toLowerCase())) &&
      (!estado || t.estado === estado),
  );
}

export function limpiarTrazas() {
  limpiar(CLAVES_OBS.trazas);
  avisar();
}
