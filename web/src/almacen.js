// Persistencia del panel en el navegador (spec 001, T006; data-model.md).
//
// localStorage: hábitos, registros y guía vista. sessionStorage: sesión de la pestaña.
// Tolerante a fallos: un JSON inválido, un valor con forma inesperada o un almacenamiento
// bloqueado se tratan como vacío en lugar de romper el panel.

export const CLAVES = Object.freeze({
  habitos: 'habitos.v1.habitos',
  registros: 'habitos.v1.registros',
  tourVisto: 'habitos.v1.tourVisto',
  sesion: 'habitos.v1.sesion',
});

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function almacen(nombre) {
  try {
    return globalThis[nombre] ?? null;
  } catch {
    return null; // Algunos navegadores lanzan al acceder si el usuario bloqueó los datos del sitio.
  }
}

function leerTexto(nombre, clave) {
  try {
    return almacen(nombre)?.getItem(clave) ?? null;
  } catch {
    return null;
  }
}

function escribirTexto(nombre, clave, valor) {
  try {
    almacen(nombre)?.setItem(clave, valor);
    return true;
  } catch {
    return false; // Cuota llena o almacenamiento bloqueado: el panel sigue funcionando.
  }
}

function borrarClave(nombre, clave) {
  try {
    almacen(nombre)?.removeItem(clave);
  } catch {
    // Sin almacenamiento disponible: no hay nada que borrar.
  }
}

function leerJSON(nombre, clave) {
  const texto = leerTexto(nombre, clave);
  if (texto === null) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

const esObjeto = (valor) => valor !== null && typeof valor === 'object';
const esHabito = (h) =>
  esObjeto(h) && typeof h.id === 'string' && typeof h.nombre === 'string' && typeof h.creadoEn === 'string';
const esRegistro = (r) =>
  esObjeto(r) && typeof r.habitoId === 'string' && typeof r.fecha === 'string' && FORMATO_FECHA.test(r.fecha);

function leerLista(clave, esValido) {
  const valor = leerJSON('localStorage', clave);
  return Array.isArray(valor) ? valor.filter(esValido) : [];
}

export const leerHabitos = () => leerLista(CLAVES.habitos, esHabito);
export const guardarHabitos = (habitos) => escribirTexto('localStorage', CLAVES.habitos, JSON.stringify(habitos));

export const leerRegistros = () => leerLista(CLAVES.registros, esRegistro);
export const guardarRegistros = (registros) =>
  escribirTexto('localStorage', CLAVES.registros, JSON.stringify(registros));

export function leerSesion() {
  const sesion = leerJSON('sessionStorage', CLAVES.sesion);
  return esObjeto(sesion) && typeof sesion.email === 'string' ? sesion : null;
}
export const guardarSesion = (sesion) => escribirTexto('sessionStorage', CLAVES.sesion, JSON.stringify(sesion));
export const borrarSesion = () => borrarClave('sessionStorage', CLAVES.sesion);

export const leerTourVisto = () => leerTexto('localStorage', CLAVES.tourVisto) === '1';
export const guardarTourVisto = () => escribirTexto('localStorage', CLAVES.tourVisto, '1');
