// Registro de pasos de la guía (spec 002, T005).
// Contrato: specs/002-tour-guiado-driverjs/contracts/tour-contract.md §1.
//
// Para que un módulo nuevo explique su parte basta con llamar a agregarPaso(); el motor
// (tour.js) no cambia (FR-007).

/**
 * @typedef {object} Paso
 * @property {string} id           Único en el registro.
 * @property {string} elemento     Ancla: siempre `[data-tour="<id>"]`.
 * @property {string} titulo
 * @property {string} descripcion
 * @property {{ elemento: string, descripcion: string }} [alternativa]  Si `elemento` no está en pantalla.
 */

/** @type {Paso[]} */
export const PASOS = [
  {
    id: 'nuevo-habito',
    elemento: '[data-tour="nuevo-habito"]',
    titulo: 'Crea un hábito',
    descripcion: 'Escribe algo que quieras hacer a diario, por ejemplo «Tomar agua», y pulsa Agregar.',
  },
  {
    id: 'lista',
    elemento: '[data-tour="lista"]',
    titulo: 'Tus hábitos',
    descripcion: 'Aquí aparecen tus hábitos con los días que llevas cumplidos.',
  },
  {
    id: 'marcar',
    elemento: '[data-tour="marcar"]',
    titulo: 'Marca tu avance',
    descripcion: 'Pulsa «Marcar hoy» cuando completes el hábito. Solo cuenta una vez por día.',
    alternativa: {
      elemento: '[data-tour="lista"]',
      descripcion: 'Cuando tengas hábitos, cada uno tendrá un botón «Marcar hoy» para registrar tu avance.',
    },
  },
  {
    id: 'ver-guia',
    elemento: '[data-tour="ver-guia"]',
    titulo: '¿Necesitas ayuda?',
    descripcion: 'Puedes repetir esta guía cuando quieras desde aquí.',
  },
];

/**
 * Inserta `paso` antes del paso con id `antesDe`; al final si no se indica o no existe.
 * Un id ya registrado no se duplica.
 * @param {Paso} paso
 * @param {{ antesDe?: string }} [opciones]
 */
export function agregarPaso(paso, { antesDe } = {}) {
  if (PASOS.some((existente) => existente.id === paso.id)) return;
  const indice = antesDe === undefined ? -1 : PASOS.findIndex((existente) => existente.id === antesDe);
  if (indice === -1) PASOS.push(paso);
  else PASOS.splice(indice, 0, paso);
}
