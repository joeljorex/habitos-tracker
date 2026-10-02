// Lectura y escritura de las listas de observabilidad (specs 005, 006 y 007).
//
// Mismo criterio que almacen.js: si el almacenamiento está bloqueado, lleno o trae datos con una
// forma inesperada, se trata como vacío en lugar de romper el panel. La observabilidad nunca debe
// tumbar la aplicación que observa.

export const CLAVES_OBS = Object.freeze({
  bitacora: 'habitos.v1.bitacora',
  trazas: 'habitos.v1.trazas',
  auditoria: 'habitos.v1.auditoria',
  metricas: 'habitos.v1.metricas',
});

function almacen() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // Algunos navegadores lanzan al acceder si el usuario bloqueó los datos del sitio.
  }
}

export function leerJSON(clave, pordefecto) {
  try {
    const texto = almacen()?.getItem(clave) ?? null;
    if (texto === null) return pordefecto;
    const valor = JSON.parse(texto);
    return valor === null || valor === undefined ? pordefecto : valor;
  } catch {
    return pordefecto;
  }
}

export function guardarJSON(clave, valor) {
  try {
    almacen()?.setItem(clave, JSON.stringify(valor));
    return true;
  } catch {
    return false; // Cuota llena o almacenamiento bloqueado.
  }
}

export function limpiar(clave) {
  try {
    almacen()?.removeItem(clave);
  } catch {
    // Sin almacenamiento disponible: no hay nada que borrar.
  }
}

/** Lee una lista y descarta los elementos con forma inválida. */
export function leerLista(clave, esValido) {
  const valor = leerJSON(clave, []);
  return Array.isArray(valor) ? valor.filter(esValido) : [];
}

/** Agrega al final y conserva solo los últimos `maximo` elementos (buffer circular). */
export function agregar(clave, elemento, maximo, esValido) {
  const lista = leerLista(clave, esValido);
  lista.push(elemento);
  const recortada = lista.length > maximo ? lista.slice(lista.length - maximo) : lista;
  guardarJSON(clave, recortada);
  return recortada;
}

/** Identificador corto y legible, suficiente para correlacionar en un panel de una sola pestaña. */
export function identificador(largo = 8) {
  const aleatorio = globalThis.crypto?.getRandomValues
    ? Array.from(globalThis.crypto.getRandomValues(new Uint8Array(largo)), (b) => b.toString(16).padStart(2, '0')).join('')
    : Math.random().toString(16).slice(2);
  return aleatorio.slice(0, largo);
}

/** Reloj monótono para medir duraciones; cae a Date.now() si no hay performance. */
export function ahoraMs() {
  return globalThis.performance?.now ? globalThis.performance.now() : Date.now();
}
