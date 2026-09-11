// Motor de la guía interactiva (spec 002, T008, T011 y T012).
//
// Usa driver.js 1.8.0 servido desde web/vendor/ (global `window.driver.js.driver`, sin CDN).
// Los pasos viven en pasos.js: agregar uno no requiere tocar este archivo (FR-007).
// Contrato: specs/002-tour-guiado-driverjs/contracts/tour-contract.md §2 y §3.
import { guardarTourVisto, leerTourVisto } from '../almacen.js';
import { PASOS } from './pasos.js';

/** Instancia activa de driver.js (o null): evita abrir dos guías superpuestas. */
let guia = null;

/**
 * Pura: decide qué pasos se muestran. Si el elemento de un paso no existe se usa su
 * alternativa (si la tiene y su elemento existe); si no, el paso se omite (FR-006).
 * @param {import('./pasos.js').Paso[]} pasos
 * @param {(selector: string) => boolean} existe
 * @returns {{ id: string, elemento: string, titulo: string, descripcion: string }[]}
 */
export function resolverPasos(pasos, existe) {
  const resueltos = [];
  for (const { id, elemento, titulo, descripcion, alternativa } of pasos) {
    if (existe(elemento)) {
      resueltos.push({ id, elemento, titulo, descripcion });
    } else if (alternativa && existe(alternativa.elemento)) {
      resueltos.push({ id, elemento: alternativa.elemento, titulo, descripcion: alternativa.descripcion });
    }
  }
  return resueltos;
}

/** true si la guía ya se completó o cerró en este dispositivo. */
export function tourVisto() {
  return leerTourVisto();
}

/** Registra la guía como vista (tolerante a errores de almacenamiento). */
export function marcarVisto() {
  guardarTourVisto();
}

const prefiereMenosMovimiento = () =>
  globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * Abre la guía. Sin `forzar`, solo si todavía no se ha visto.
 * @returns {boolean} false si ya estaba abierta, ya se vio (sin forzar) o no hay pasos/librería.
 */
export function iniciarTour({ forzar = false } = {}) {
  if (guia?.isActive()) return false;
  if (!forzar && tourVisto()) return false;

  const crearGuia = globalThis.driver?.js?.driver;
  if (typeof crearGuia !== 'function') return false; // Sin la librería el panel sigue siendo usable.

  const pasos = resolverPasos(PASOS, (selector) => document.querySelector(selector) !== null);
  if (pasos.length === 0) return false;

  guia = crearGuia({
    // Configuración del contrato (§2).
    showProgress: true,
    progressText: '{{current}} de {{total}}',
    nextBtnText: 'Siguiente',
    prevBtnText: 'Anterior',
    doneBtnText: 'Listo',
    allowClose: true,
    allowKeyboardControl: true,
    onDestroyed: () => {
      guia = null;
      marcarVisto();
    },
    // driver.js 1.8.0 solo invoca onDestroyed si la animación del paso ya terminó (~400 ms):
    // quien cierra muy rápido (Listo, X, Esc o clic fuera) no quedaría registrado. Este gancho
    // se ejecuta en todo cierre iniciado por el usuario; marca la guía y la destruye.
    onDestroyStarted: (_elemento, _paso, { driver }) => {
      guia = null;
      marcarVisto();
      driver.destroy();
    },
    // Presentación: estilos propios, sin animación si el usuario la reduce, y el elemento
    // resaltado no se puede pulsar para que la guía no pierda su ancla a mitad del recorrido.
    popoverClass: 'guia-habitos',
    animate: !prefiereMenosMovimiento(),
    overlayOpacity: 0.55,
    stagePadding: 6,
    stageRadius: 12,
    disableActiveInteraction: true,
    onPopoverRender: (globo) => {
      globo.closeButton.setAttribute('aria-label', 'Cerrar guía');
      globo.closeButton.setAttribute('title', 'Cerrar guía');
    },
    steps: pasos.map((paso) => ({
      element: paso.elemento,
      popover: { title: paso.titulo, description: paso.descripcion },
    })),
  });
  guia.drive();
  return true;
}

/** Cierra la guía si está abierta (p. ej. al cerrar sesión) y la deja registrada como vista. */
export function cerrarTour() {
  if (!guia?.isActive()) return;
  const activa = guia;
  guia = null;
  marcarVisto();
  activa.destroy();
}
