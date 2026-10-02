// Reglas de alarma del panel — spec 005.
//
// Son las mismas condiciones que infra/monitoreo/prometheus/reglas.yml evalúa del lado del
// servidor, pero calculadas con las métricas que el navegador ya tiene: así el visor puede mostrar
// el estado sin depender del stack de monitoreo, y la demostración no necesita Docker.
//
// Cada regla devuelve un estado: "ok", "aviso" (hay que mirarlo) o "alarma" (rompe el objetivo).
import { leerMetricas } from './metricas.js';

export const ESTADOS = Object.freeze(['ok', 'aviso', 'alarma']);

/** Umbrales en un solo lugar para que coincidan con las reglas de Prometheus. */
export const UMBRALES = Object.freeze({
  tasaErrores: { aviso: 0.01, alarma: 0.05 },
  latenciaMs: { aviso: 500, alarma: 1000 },
  accesosRechazados: { minimoIntentos: 4, aviso: 0.5, alarma: 0.8 },
});

const sumarPorNombre = (mapa, nombre) =>
  Object.entries(mapa)
    .filter(([k]) => k === nombre || k.startsWith(`${nombre}{`))
    .reduce((total, [, valor]) => total + (Number.isFinite(valor) ? valor : 0), 0);

const maximoPorNombre = (mapa, nombre) =>
  Object.entries(mapa)
    .filter(([k]) => k === nombre || k.startsWith(`${nombre}{`))
    .reduce((mayor, [, resumen]) => Math.max(mayor, Number.isFinite(resumen?.max) ? resumen.max : 0), 0);

/** Compara un valor contra sus umbrales (a mayor valor, peor estado). */
function estadoPorUmbral(valor, { aviso, alarma }) {
  if (valor >= alarma) return 'alarma';
  if (valor >= aviso) return 'aviso';
  return 'ok';
}

const porcentaje = (fraccion) => `${(fraccion * 100).toFixed(1)} %`;

/**
 * Evalúa las reglas sobre un corte de métricas. Pura: recibe las métricas y no toca almacenamiento,
 * por eso se puede probar sola.
 */
export function evaluarAlarmas(metricas) {
  const contadores = metricas?.contadores ?? {};
  const duraciones = metricas?.duraciones ?? {};

  const acciones = sumarPorNombre(contadores, 'habitos_acciones_total');
  const errores = sumarPorNombre(contadores, 'habitos_errores_total');
  const tasaErrores = acciones > 0 ? errores / acciones : 0;

  const latencia = maximoPorNombre(duraciones, 'habitos_operacion_duracion_ms');

  const fallosAlmacen = sumarPorNombre(contadores, 'habitos_almacen_fallos_total');

  const intentos = sumarPorNombre(contadores, 'habitos_accesos_total');
  const rechazados = contadores['habitos_accesos_total{resultado="rechazado"}'] ?? 0;
  const tasaRechazo = intentos > 0 ? rechazados / intentos : 0;
  const bastantesIntentos = intentos >= UMBRALES.accesosRechazados.minimoIntentos;

  return [
    {
      id: 'tasa-errores',
      titulo: 'Tasa de error de las acciones',
      estado: acciones > 0 ? estadoPorUmbral(tasaErrores, UMBRALES.tasaErrores) : 'ok',
      valor: porcentaje(tasaErrores),
      umbral: `alarma ≥ ${porcentaje(UMBRALES.tasaErrores.alarma)}`,
      descripcion: `${errores} de ${acciones} acciones terminaron en error.`,
    },
    {
      id: 'latencia-operaciones',
      titulo: 'Latencia máxima de una operación',
      estado: estadoPorUmbral(latencia, UMBRALES.latenciaMs),
      valor: `${Math.round(latencia)} ms`,
      umbral: `alarma ≥ ${UMBRALES.latenciaMs.alarma} ms`,
      descripcion: 'Tiempo de la operación más lenta registrada en esta sesión.',
    },
    {
      id: 'fallos-almacenamiento',
      titulo: 'Fallos al guardar en el navegador',
      estado: fallosAlmacen > 0 ? 'alarma' : 'ok',
      valor: String(fallosAlmacen),
      umbral: 'alarma ≥ 1',
      descripcion: 'Un fallo aquí significa que los hábitos no se están guardando.',
    },
    {
      id: 'accesos-rechazados',
      titulo: 'Accesos rechazados',
      estado: bastantesIntentos ? estadoPorUmbral(tasaRechazo, UMBRALES.accesosRechazados) : 'ok',
      valor: porcentaje(tasaRechazo),
      umbral: `alarma ≥ ${porcentaje(UMBRALES.accesosRechazados.alarma)} con ${UMBRALES.accesosRechazados.minimoIntentos}+ intentos`,
      descripcion: `${rechazados} de ${intentos} intentos de inicio de sesión fueron rechazados.`,
    },
  ];
}

/** Lee las métricas guardadas y evalúa las reglas. */
export function alarmasActuales() {
  return evaluarAlarmas(leerMetricas());
}

/** Estado general: el peor de todas las reglas. */
export function estadoGeneral(alarmas) {
  if (alarmas.some((a) => a.estado === 'alarma')) return 'alarma';
  if (alarmas.some((a) => a.estado === 'aviso')) return 'aviso';
  return 'ok';
}
