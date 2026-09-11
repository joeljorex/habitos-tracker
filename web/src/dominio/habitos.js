// Reglas de negocio de los hábitos (spec 001).
//
// Módulo PURO: sin DOM, sin almacenamiento y sin reloj implícito (la fecha y la hora siempre
// llegan por parámetro). Se importa igual desde el navegador y desde Node (`node --test`).
// Contrato: specs/001-panel-web-e2e/contracts/ui-contract.md §3.

export const LONGITUD_MAXIMA = 60;

export const MENSAJES = Object.freeze({
  vacio: 'Escribe un nombre para el hábito.',
  largo: `El nombre puede tener máximo ${LONGITUD_MAXIMA} caracteres.`,
  duplicado: 'Ya tienes un hábito con ese nombre.',
});

const dosDigitos = (numero) => String(numero).padStart(2, '0');
const claveNombre = (nombre) => nombre.trim().toLowerCase();
const rechazo = (error) => ({ ok: false, error, mensaje: MENSAJES[error] });

/** Día calendario LOCAL de `fecha` como "YYYY-MM-DD". */
export function fechaLocal(fecha) {
  const anio = String(fecha.getFullYear()).padStart(4, '0');
  return `${anio}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

/**
 * Valida el nombre de un hábito: se recorta, debe tener de 1 a 60 caracteres y no repetirse
 * (sin distinguir mayúsculas ni espacios extremos).
 * @returns {{ ok: true, valor: string } | { ok: false, error: 'vacio'|'largo'|'duplicado', mensaje: string }}
 */
export function validarNombre(nombre, existentes = []) {
  const valor = String(nombre ?? '').trim();
  if (valor === '') return rechazo('vacio');
  // Se cuentan caracteres (puntos de código), como VARCHAR(60) en MySQL, no unidades UTF-16.
  if (Array.from(valor).length > LONGITUD_MAXIMA) return rechazo('largo');
  const buscado = valor.toLowerCase();
  if (existentes.some((habito) => claveNombre(habito.nombre) === buscado)) return rechazo('duplicado');
  return { ok: true, valor };
}

/**
 * Crea un hábito válido a partir de `nombre`.
 * @returns {{ ok: true, habito: { id: string, nombre: string, creadoEn: string } } | { ok: false, error: string, mensaje: string }}
 */
export function crearHabito(nombre, existentes, ahora, generarId = generarIdAleatorio) {
  const validacion = validarNombre(nombre, existentes);
  if (!validacion.ok) return validacion;
  return {
    ok: true,
    habito: { id: generarId(), nombre: validacion.valor, creadoEn: ahora.toISOString() },
  };
}

/**
 * Registra que `habitoId` se cumplió en `fecha`. Idempotente: si ya existe el par
 * (habitoId, fecha) devuelve el mismo arreglo sin cambios; si no, un arreglo nuevo.
 */
export function marcarHecho(registros, habitoId, fecha) {
  if (estaHechoHoy(registros, habitoId, fecha)) return registros;
  return [...registros, { habitoId, fecha }];
}

/** true si hay un registro de `habitoId` con la fecha `hoy`. */
export function estaHechoHoy(registros, habitoId, hoy) {
  return registros.some((registro) => registro.habitoId === habitoId && registro.fecha === hoy);
}

/** Cantidad de fechas distintas en que se cumplió `habitoId`. */
export function diasCumplidos(registros, habitoId) {
  const fechas = registros.filter((registro) => registro.habitoId === habitoId).map((registro) => registro.fecha);
  return new Set(fechas).size;
}

/** Elimina el hábito y, en cascada, sus registros. No modifica las entradas. */
export function eliminarHabito(habitos, registros, habitoId) {
  return {
    habitos: habitos.filter((habito) => habito.id !== habitoId),
    registros: registros.filter((registro) => registro.habitoId !== habitoId),
  };
}

/** Copia de `habitos` ordenada por fecha de creación (orden estable). */
export function ordenarPorCreacion(habitos) {
  return [...habitos].sort((a, b) => (a.creadoEn < b.creadoEn ? -1 : a.creadoEn > b.creadoEn ? 1 : 0));
}

/** UUID v4 con `crypto.randomUUID()`; respaldo aleatorio si no existe (contexto no seguro). */
function generarIdAleatorio() {
  const cripto = globalThis.crypto;
  if (typeof cripto?.randomUUID === 'function') return cripto.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof cripto?.getRandomValues === 'function') cripto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
