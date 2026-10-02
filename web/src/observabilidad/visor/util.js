// Utilidades compartidas por las vistas del visor (specs 005 y 006).
import { crear } from '../../ui/dom.js';

const FORMATO_NUMERO = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });
const FORMATO_HORA = new Intl.DateTimeFormat('es-MX', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

export const formatearNumero = (valor) => (Number.isFinite(valor) ? FORMATO_NUMERO.format(valor) : '—');

/** Hora local legible; si la fecha viene mal, se muestra tal cual en vez de "Invalid Date". */
export function formatearHora(iso) {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? String(iso ?? '—') : FORMATO_HORA.format(fecha);
}

export const formatearDuracion = (ms) => (Number.isFinite(ms) ? `${FORMATO_NUMERO.format(ms)} ms` : '—');

/** Resume un objeto de contexto en una línea corta: clave=valor separados por espacios. */
export function resumirContexto(contexto) {
  if (!contexto || typeof contexto !== 'object') return '';
  return Object.entries(contexto)
    .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
    .join(' · ');
}

/** Campo de filtro con etiqueta accesible. `control` es un input o un select ya creado. */
export function campoFiltro(idEtiqueta, texto, control) {
  control.setAttribute('id', idEtiqueta);
  return crear('div', { class: 'visor-campo' }, crear('label', { for: idEtiqueta }, texto), control);
}

export function selectFiltro(opciones, testId) {
  return crear(
    'select',
    { class: 'visor-select', 'data-testid': testId },
    ...opciones.map(([valor, texto]) => crear('option', { value: valor }, texto)),
  );
}

export function entradaBusqueda(testId, marcador) {
  return crear('input', {
    type: 'search',
    class: 'visor-entrada',
    'data-testid': testId,
    placeholder: marcador,
    autocomplete: 'off',
    spellcheck: 'false',
  });
}

/**
 * Ofrece un archivo para descargar. Si el navegador no permite blobs (o el entorno de pruebas no
 * tiene URL.createObjectURL), no hace nada en lugar de lanzar.
 */
export function descargar(nombre, contenido, tipo = 'application/json') {
  try {
    const url = URL.createObjectURL(new Blob([contenido], { type: `${tipo};charset=utf-8` }));
    const enlace = crear('a', { href: url, download: nombre });
    document.body.append(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}
