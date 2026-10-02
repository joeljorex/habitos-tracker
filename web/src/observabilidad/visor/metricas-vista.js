// Vista de métricas y alarmas — spec 005.
//
// Muestra lo que el panel está midiendo (contadores y duraciones), el estado de cada regla de
// alarma y el texto en formato Prometheus que consume infra/monitoreo/.
import { crear } from '../../ui/dom.js';
import { alarmasActuales, estadoGeneral } from '../alarmas.js';
import { exportarPrometheus, leerMetricas, limpiarMetricas } from '../metricas.js';
import { descargar, formatearNumero } from './util.js';

const ETIQUETA_ESTADO = { ok: 'Normal', aviso: 'Aviso', alarma: 'Alarma' };

/** Separa "nombre{a="1"}" en sus dos partes para mostrarlas distinto. */
function partesClave(clave) {
  const llave = clave.indexOf('{');
  return llave === -1 ? { nombre: clave, etiquetas: '' } : { nombre: clave.slice(0, llave), etiquetas: clave.slice(llave) };
}

function filaMetrica(clave, valor) {
  const { nombre, etiquetas } = partesClave(clave);
  return crear(
    'tr',
    { 'data-testid': 'metrica-fila' },
    crear(
      'td',
      { class: 'visor-celda-clave' },
      crear('span', { class: 'visor-metrica-nombre' }, nombre),
      etiquetas ? crear('span', { class: 'visor-metrica-etiquetas' }, etiquetas) : null,
    ),
    crear('td', { class: 'visor-celda-valor' }, valor),
  );
}

function tabla(titulo, filas, vacioTexto) {
  return crear(
    'div',
    { class: 'visor-bloque' },
    crear('h4', { class: 'visor-subtitulo' }, titulo),
    filas.length
      ? crear(
          'div',
          { class: 'visor-desplazable' },
          crear(
            'table',
            { class: 'visor-tabla' },
            crear('thead', {}, crear('tr', {}, crear('th', {}, 'Métrica'), crear('th', {}, 'Valor'))),
            crear('tbody', {}, ...filas),
          ),
        )
      : crear('p', { class: 'visor-vacio' }, vacioTexto),
  );
}

function tarjetaAlarma(alarma) {
  return crear(
    'li',
    { class: `visor-alarma visor-alarma-${alarma.estado}`, 'data-testid': 'alarma', 'data-alarma': alarma.id },
    crear(
      'div',
      { class: 'visor-alarma-cabecera' },
      crear('span', { class: 'visor-alarma-titulo' }, alarma.titulo),
      crear(
        'span',
        { class: `visor-insignia-estado visor-insignia-${alarma.estado}`, 'data-testid': 'alarma-estado' },
        ETIQUETA_ESTADO[alarma.estado] ?? alarma.estado,
      ),
    ),
    crear(
      'p',
      { class: 'visor-alarma-datos' },
      crear('strong', { 'data-testid': 'alarma-valor' }, alarma.valor),
      crear('span', { class: 'visor-alarma-umbral' }, ` · ${alarma.umbral}`),
    ),
    crear('p', { class: 'visor-alarma-descripcion' }, alarma.descripcion),
  );
}

export function crearVistaMetricas() {
  const alarmas = crear('ul', { class: 'visor-alarmas', 'data-testid': 'lista-alarmas' });
  const resumen = crear('p', { class: 'visor-resumen', 'data-testid': 'metricas-resumen' });
  const tablas = crear('div', { class: 'visor-tablas' });
  const exposicion = crear('pre', { class: 'visor-codigo', 'data-testid': 'metricas-prometheus', tabindex: '0' });

  const botonDescargar = crear(
    'button',
    { type: 'button', class: 'boton boton-secundario boton-chico', 'data-testid': 'metricas-descargar' },
    'Descargar para Prometheus',
  );
  const botonLimpiar = crear(
    'button',
    { type: 'button', class: 'boton boton-texto boton-chico', 'data-testid': 'metricas-limpiar' },
    'Reiniciar métricas',
  );

  botonDescargar.addEventListener('click', () => {
    descargar('metricas-habitos.prom', exportarPrometheus() || '# sin métricas\n', 'text/plain');
  });
  botonLimpiar.addEventListener('click', () => {
    limpiarMetricas();
    refrescar();
  });

  function refrescar() {
    const reglas = alarmasActuales();
    const general = estadoGeneral(reglas);
    alarmas.replaceChildren(...reglas.map(tarjetaAlarma));
    alarmas.dataset.estadoGeneral = general;

    const { contadores, duraciones } = leerMetricas();
    const totales = Object.keys(contadores).length + Object.keys(duraciones).length;
    resumen.textContent =
      totales === 0
        ? 'Aún no hay métricas: usa el panel (agrega o marca un hábito) y vuelve a esta pestaña.'
        : `${totales} series medidas · estado general: ${ETIQUETA_ESTADO[general]}`;
    resumen.dataset.estadoGeneral = general;

    tablas.replaceChildren(
      tabla(
        'Contadores',
        Object.entries(contadores)
          .sort(([a], [b]) => a.localeCompare(b, 'es'))
          .map(([clave, valor]) => filaMetrica(clave, formatearNumero(valor))),
        'Sin contadores todavía.',
      ),
      tabla(
        'Duraciones (ms)',
        Object.entries(duraciones)
          .sort(([a], [b]) => a.localeCompare(b, 'es'))
          .map(([clave, r]) =>
            filaMetrica(
              clave,
              `n=${formatearNumero(r.cuenta)} · prom ${formatearNumero(r.promedio)} · máx ${formatearNumero(r.max)}`,
            ),
          ),
        'Sin duraciones todavía.',
      ),
    );

    exposicion.textContent = exportarPrometheus() || '# sin métricas';
  }

  const raiz = crear(
    'div',
    { class: 'visor-vista' },
    resumen,
    crear('h4', { class: 'visor-subtitulo' }, 'Alarmas'),
    alarmas,
    tablas,
    crear(
      'details',
      { class: 'visor-detalle' },
      crear('summary', {}, 'Exposición en formato Prometheus'),
      crear(
        'p',
        { class: 'visor-ayuda' },
        'Es el mismo texto que el stack de infra/monitoreo/ recolecta para graficar en Grafana.',
      ),
      exposicion,
    ),
    crear('div', { class: 'visor-acciones' }, botonDescargar, botonLimpiar),
  );

  return { id: 'metricas', titulo: 'Métricas', raiz, refrescar };
}
