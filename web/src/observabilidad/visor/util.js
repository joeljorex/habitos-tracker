// Utilidades compartidas por las vistas del visor (spec 005).
import { crear } from '../../ui/dom.js';

const FORMATO_NUMERO = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });

export const formatearNumero = (valor) => (Number.isFinite(valor) ? FORMATO_NUMERO.format(valor) : '—');

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
