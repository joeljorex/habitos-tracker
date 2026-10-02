// Visor de trazabilidad — spec 006.
//
// Dos mitades que se miran entre sí: a la izquierda las trazas (una operación completa con sus
// pasos), a la derecha la bitácora. Al elegir una traza, la bitácora queda filtrada por su
// identificador: de ahí sale la trazabilidad "qué pasó dentro de esta operación".
import { crear } from '../../ui/dom.js';
import { exportarJSON, leerBitacora, limpiarBitacora, NIVELES } from '../bitacora.js';
import { leerTrazas, limpiarTrazas } from '../trazas.js';
import {
  campoFiltro,
  descargar,
  entradaBusqueda,
  formatearDuracion,
  formatearHora,
  resumirContexto,
  selectFiltro,
} from './util.js';

const ETIQUETA_NIVEL = {
  depuracion: 'Depuración',
  info: 'Info',
  aviso: 'Aviso',
  error: 'Error',
};

/** Profundidad de un span según su cadena de padres, para dibujar la jerarquía. */
function profundidad(span, spans) {
  let nivel = 0;
  let actual = span;
  const vistos = new Set();
  while (actual?.padreId && !vistos.has(actual.id)) {
    vistos.add(actual.id);
    actual = spans.find((s) => s.id === actual.padreId);
    nivel += 1;
  }
  return nivel;
}

function filaSpan(span, spans) {
  return crear(
    'li',
    { class: `visor-span visor-span-${span.estado.replace(' ', '-')}`, 'data-testid': 'traza-span' },
    crear('span', { class: 'visor-span-sangria', 'aria-hidden': 'true' }, '└'.padStart(profundidad(span, spans) + 1, ' ')),
    crear('span', { class: 'visor-span-nombre' }, span.nombre),
    crear('span', { class: 'visor-span-duracion' }, formatearDuracion(span.duracionMs)),
    span.error ? crear('span', { class: 'visor-span-error' }, span.error) : null,
  );
}

export function crearVistaTrazabilidad() {
  const filtroNivel = selectFiltro(
    [['', 'Todos los niveles'], ...NIVELES.map((n) => [n, ETIQUETA_NIVEL[n]])],
    'bitacora-nivel',
  );
  const filtroTexto = entradaBusqueda('bitacora-texto', 'Buscar en mensaje o contexto');
  const filtroEstadoTraza = selectFiltro(
    [
      ['', 'Todos los estados'],
      ['ok', 'Correctas'],
      ['error', 'Con error'],
      ['incompleta', 'Incompletas'],
    ],
    'trazas-estado',
  );

  let trazaElegida = '';

  const textoChip = crear('span', { class: 'visor-chip-texto' });
  const botonQuitarTraza = crear(
    'button',
    { type: 'button', class: 'boton boton-texto boton-chico', 'data-testid': 'traza-quitar-filtro' },
    'Ver toda la bitácora',
  );
  const avisoTraza = crear(
    'p',
    { class: 'visor-chip', 'data-testid': 'traza-seleccionada', hidden: true },
    textoChip,
    botonQuitarTraza,
  );

  const listaTrazas = crear('ul', { class: 'visor-trazas', 'data-testid': 'lista-trazas' });
  const cuerpoBitacora = crear('tbody', {});
  const vacioBitacora = crear('p', { class: 'visor-vacio', 'data-testid': 'bitacora-vacia' }, 'Sin registros todavía.');
  const tablaBitacora = crear(
    'table',
    { class: 'visor-tabla visor-tabla-bitacora', 'data-testid': 'tabla-bitacora' },
    crear(
      'thead',
      {},
      crear(
        'tr',
        {},
        crear('th', {}, 'Hora'),
        crear('th', {}, 'Nivel'),
        crear('th', {}, 'Mensaje'),
        crear('th', {}, 'Traza'),
      ),
    ),
    cuerpoBitacora,
  );
  const cajaBitacora = crear('div', { class: 'visor-desplazable visor-desplazable-alto' }, tablaBitacora);

  const botonExportar = crear(
    'button',
    { type: 'button', class: 'boton boton-secundario boton-chico', 'data-testid': 'bitacora-exportar' },
    'Exportar bitácora (JSON)',
  );
  const botonLimpiar = crear(
    'button',
    { type: 'button', class: 'boton boton-texto boton-chico', 'data-testid': 'trazabilidad-limpiar' },
    'Limpiar registros y trazas',
  );

  botonExportar.addEventListener('click', () => descargar('bitacora-habitos.json', exportarJSON()));
  botonLimpiar.addEventListener('click', () => {
    limpiarBitacora();
    limpiarTrazas();
    trazaElegida = '';
    refrescar();
  });
  botonQuitarTraza.addEventListener('click', () => {
    trazaElegida = '';
    refrescar();
  });

  for (const control of [filtroNivel, filtroEstadoTraza]) control.addEventListener('change', () => refrescar());
  filtroTexto.addEventListener('input', () => refrescar());

  listaTrazas.addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-traza-id]');
    if (!boton) return;
    trazaElegida = boton.dataset.trazaId === trazaElegida ? '' : boton.dataset.trazaId;
    refrescar();
  });

  function filaTraza(traza) {
    const elegida = traza.id === trazaElegida;
    const atributos = resumirContexto(traza.atributos);
    return crear(
      'li',
      { class: elegida ? 'visor-traza visor-traza-elegida' : 'visor-traza', 'data-testid': 'traza-item' },
      crear(
        'button',
        {
          type: 'button',
          class: 'visor-traza-boton',
          'data-traza-id': traza.id,
          'data-testid': 'traza-abrir',
          'aria-pressed': elegida ? 'true' : 'false',
        },
        crear(
          'span',
          { class: 'visor-traza-cabecera' },
          crear('span', { class: 'visor-traza-nombre' }, traza.nombre),
          crear(
            'span',
            { class: `visor-insignia-estado visor-insignia-${traza.estado === 'ok' ? 'ok' : 'alarma'}` },
            traza.estado,
          ),
        ),
        crear(
          'span',
          { class: 'visor-traza-meta' },
          `${formatearHora(traza.fecha)} · ${formatearDuracion(traza.duracionMs)} · ${traza.spans.length} pasos · id ${traza.id}`,
        ),
        atributos ? crear('span', { class: 'visor-traza-atributos' }, atributos) : null,
      ),
      traza.spans.length
        ? crear('ul', { class: 'visor-spans' }, ...traza.spans.map((span) => filaSpan(span, traza.spans)))
        : null,
      traza.error ? crear('p', { class: 'visor-span-error' }, traza.error) : null,
    );
  }

  function filaRegistro(entrada) {
    return crear(
      'tr',
      { class: `visor-registro visor-registro-${entrada.nivel}`, 'data-testid': 'bitacora-fila' },
      crear('td', { class: 'visor-celda-hora' }, formatearHora(entrada.fecha)),
      crear(
        'td',
        {},
        crear(
          'span',
          { class: `visor-nivel visor-nivel-${entrada.nivel}`, 'data-testid': 'bitacora-nivel-celda' },
          ETIQUETA_NIVEL[entrada.nivel] ?? entrada.nivel,
        ),
      ),
      crear(
        'td',
        {},
        crear('span', { class: 'visor-registro-mensaje' }, entrada.mensaje),
        resumirContexto(entrada.contexto)
          ? crear('span', { class: 'visor-registro-contexto' }, resumirContexto(entrada.contexto))
          : null,
      ),
      crear('td', { class: 'visor-celda-traza' }, entrada.trazaId ?? '—'),
    );
  }

  function refrescar() {
    const trazas = leerTrazas({ estado: filtroEstadoTraza.value });
    listaTrazas.replaceChildren(...trazas.map(filaTraza));
    if (trazas.length === 0) {
      listaTrazas.append(
        crear('li', { class: 'visor-vacio', 'data-testid': 'trazas-vacias' }, 'Sin trazas todavía: usa el panel.'),
      );
    }

    const entradas = leerBitacora({
      nivel: filtroNivel.value,
      texto: filtroTexto.value,
      trazaId: trazaElegida,
    });
    cuerpoBitacora.replaceChildren(...entradas.map(filaRegistro));
    cajaBitacora.hidden = entradas.length === 0;
    vacioBitacora.hidden = entradas.length > 0;
    vacioBitacora.textContent = trazaElegida
      ? 'Esta traza no dejó registros con los filtros actuales.'
      : 'Sin registros todavía.';

    avisoTraza.hidden = !trazaElegida;
    textoChip.textContent = trazaElegida ? `Bitácora filtrada por la traza ${trazaElegida}` : '';
  }

  const raiz = crear(
    'div',
    { class: 'visor-vista visor-vista-trazabilidad' },
    crear(
      'p',
      { class: 'visor-ayuda' },
      'Elige una traza para ver solo los registros de esa operación. Cada registro guarda el identificador de su traza.',
    ),
    crear(
      'div',
      { class: 'visor-columnas' },
      crear(
        'section',
        { class: 'visor-columna', 'aria-label': 'Trazas de operaciones' },
        crear(
          'div',
          { class: 'visor-filtros' },
          campoFiltro('filtro-trazas-estado', 'Estado de la traza', filtroEstadoTraza),
        ),
        listaTrazas,
      ),
      crear(
        'section',
        { class: 'visor-columna', 'aria-label': 'Bitácora de registros' },
        crear(
          'div',
          { class: 'visor-filtros' },
          campoFiltro('filtro-bitacora-nivel', 'Nivel', filtroNivel),
          campoFiltro('filtro-bitacora-texto', 'Buscar', filtroTexto),
        ),
        avisoTraza,
        cajaBitacora,
        vacioBitacora,
      ),
    ),
    crear('div', { class: 'visor-acciones' }, botonExportar, botonLimpiar),
  );

  return { id: 'trazabilidad', titulo: 'Trazabilidad', raiz, refrescar };
}
