// Cálculo de rachas (spec 004, T004).
//
// Módulo PURO: no lee el reloj, el DOM ni el almacenamiento; `hoy` siempre llega por parámetro.
// Contrato y casos de referencia V01–V13: specs/004-logica-rachas/contracts/rachas-contract.md.
//
// Las fechas "YYYY-MM-DD" se convierten a número de día con Date.UTC: en UTC todos los días duran
// 24 h, así que el horario de verano y la zona horaria no alteran la resta; los bisiestos y los
// cambios de mes o de año los resuelve Date.UTC (research.md R2).

const MS_POR_DIA = 86_400_000;
const FORMATO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Número de día (entero) de una fecha "YYYY-MM-DD", o null si el formato no es válido. */
function numeroDeDia(fecha) {
  const partes = FORMATO_FECHA.exec(fecha);
  if (!partes) return null;
  const [, anio, mes, dia] = partes.map(Number);
  return Date.UTC(anio, mes - 1, dia) / MS_POR_DIA;
}

/**
 * Racha actual y mejor racha de UN hábito.
 *
 * - Un día cuenta si hay al menos un registro con esa fecha; los repetidos cuentan una vez (FR-001, FR-004).
 * - Se ignoran las fechas posteriores a hoy (FR-005); el orden no importa (FR-007).
 * - La racha actual es la secuencia que termina hoy o, si hoy aún no se cumple, ayer; si no, 0 (FR-002).
 * - La mejor racha es la secuencia más larga del historial, nunca menor que la actual (FR-003).
 *
 * @param {string[]} fechas  Fechas "YYYY-MM-DD" de los registros del hábito.
 * @param {string} hoy       Fecha "YYYY-MM-DD" del día actual (quien llama usa fechaLocal(new Date())).
 * @returns {{ actual: number, maxima: number }}
 */
export function calcularRachas(fechas, hoy) {
  const diaHoy = numeroDeDia(hoy);
  if (diaHoy === null) return { actual: 0, maxima: 0 };

  const dias = [...new Set(fechas.map(numeroDeDia))]
    .filter((dia) => dia !== null && dia <= diaHoy)
    .sort((a, b) => a - b);

  let maxima = 0;
  let corrida = 0;
  for (let i = 0; i < dias.length; i += 1) {
    corrida = i > 0 && dias[i] === dias[i - 1] + 1 ? corrida + 1 : 1;
    if (corrida > maxima) maxima = corrida;
  }

  // Al terminar el recorrido, `corrida` es la secuencia que acaba en el último día cumplido.
  const ultimo = dias.at(-1);
  const actual = ultimo === diaHoy || ultimo === diaHoy - 1 ? corrida : 0;
  return { actual, maxima };
}
