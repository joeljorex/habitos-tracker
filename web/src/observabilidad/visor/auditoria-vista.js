// Visor de auditoría — spec 007.
//
// Responde "quién hizo qué, sobre qué y cuándo", y además permite comprobarlo: cada evento guarda
// el hash del anterior, así que el botón de verificación recalcula la cadena completa y señala el
// evento exacto si alguien editó el almacenamiento a mano.
import { crear } from '../../ui/dom.js';
import { exportarCSV, leerAuditoria, limpiarAuditoria, RESULTADOS, verificarIntegridad } from '../auditoria.js';
import { campoFiltro, descargar, entradaBusqueda, formatearHora, resumirContexto, selectFiltro } from './util.js';

const ETIQUETA_RESULTADO = { exito: 'Éxito', rechazado: 'Rechazado', error: 'Error' };
const ESTADO_POR_RESULTADO = { exito: 'ok', rechazado: 'aviso', error: 'alarma' };

export function crearVistaAuditoria({ actorActual = () => 'desconocido' } = {}) {
  const filtroResultado = selectFiltro(
    [['', 'Todos los resultados'], ...RESULTADOS.map((r) => [r, ETIQUETA_RESULTADO[r]])],
    'auditoria-resultado',
  );
  const filtroTexto = entradaBusqueda('auditoria-texto', 'Buscar por acción, recurso o detalle');

  const resumen = crear('p', { class: 'visor-resumen', 'data-testid': 'auditoria-resumen' });
  const integridad = crear('p', { class: 'visor-integridad', 'data-testid': 'auditoria-integridad' }, 'Sin verificar.');
  const cuerpo = crear('tbody', {});
  const tabla = crear(
    'table',
    { class: 'visor-tabla visor-tabla-auditoria', 'data-testid': 'tabla-auditoria' },
    crear(
      'thead',
      {},
      crear(
        'tr',
        {},
        crear('th', {}, 'Hora'),
        crear('th', {}, 'Actor'),
        crear('th', {}, 'Acción'),
        crear('th', {}, 'Recurso'),
        crear('th', {}, 'Resultado'),
        crear('th', {}, 'Hash'),
      ),
    ),
    cuerpo,
  );
  const caja = crear('div', { class: 'visor-desplazable visor-desplazable-alto' }, tabla);
  const vacio = crear(
    'p',
    { class: 'visor-vacio', 'data-testid': 'auditoria-vacia' },
    'Sin eventos de auditoría todavía.',
  );

  const botonVerificar = crear(
    'button',
    { type: 'button', class: 'boton boton-secundario boton-chico', 'data-testid': 'auditoria-verificar' },
    'Verificar integridad',
  );
  const botonExportar = crear(
    'button',
    { type: 'button', class: 'boton boton-secundario boton-chico', 'data-testid': 'auditoria-exportar' },
    'Exportar auditoría (CSV)',
  );
  const botonLimpiar = crear(
    'button',
    { type: 'button', class: 'boton boton-texto boton-chico', 'data-testid': 'auditoria-limpiar' },
    'Archivar y reiniciar',
  );

  botonVerificar.addEventListener('click', async () => {
    botonVerificar.disabled = true;
    integridad.textContent = 'Verificando la cadena…';
    integridad.dataset.estado = 'verificando';
    try {
      await mostrarIntegridad();
    } finally {
      botonVerificar.disabled = false;
    }
  });

  botonExportar.addEventListener('click', () => descargar('auditoria-habitos.csv', exportarCSV(), 'text/csv'));

  botonLimpiar.addEventListener('click', async () => {
    if (!window.confirm('Se descargará la auditoría en CSV y se reiniciará la cadena. ¿Continuar?')) return;
    descargar('auditoria-habitos.csv', exportarCSV(), 'text/csv');
    await limpiarAuditoria(actorActual());
    refrescar();
  });

  filtroResultado.addEventListener('change', () => refrescar());
  filtroTexto.addEventListener('input', () => refrescar());

  async function mostrarIntegridad() {
    const resultado = await verificarIntegridad();
    integridad.dataset.estado = resultado.ok ? 'ok' : 'alarma';
    integridad.textContent = resultado.ok
      ? `Cadena verificada: ${resultado.total} eventos sin alteraciones.`
      : `Cadena alterada en el evento ${resultado.posicion + 1} de ${resultado.total} (${resultado.eventoId}): ${resultado.motivo}.`;
    return resultado;
  }

  function fila(evento) {
    const estado = ESTADO_POR_RESULTADO[evento.resultado] ?? 'aviso';
    const detalle = resumirContexto(evento.detalle);
    return crear(
      'tr',
      { class: 'visor-evento', 'data-testid': 'auditoria-fila', 'data-evento-id': evento.id },
      crear('td', { class: 'visor-celda-hora' }, formatearHora(evento.fecha)),
      crear('td', {}, evento.actor),
      crear(
        'td',
        {},
        crear('span', { class: 'visor-accion' }, evento.accion),
        detalle ? crear('span', { class: 'visor-registro-contexto' }, detalle) : null,
      ),
      crear('td', {}, evento.recurso || '—'),
      crear(
        'td',
        {},
        crear(
          'span',
          { class: `visor-insignia-estado visor-insignia-${estado}`, 'data-testid': 'auditoria-resultado-celda' },
          ETIQUETA_RESULTADO[evento.resultado] ?? evento.resultado,
        ),
      ),
      crear('td', { class: 'visor-celda-hash', title: `anterior: ${evento.hashAnterior}` }, evento.hash),
    );
  }

  function refrescar() {
    const eventos = leerAuditoria({ resultado: filtroResultado.value, texto: filtroTexto.value });
    cuerpo.replaceChildren(...eventos.map(fila));
    caja.hidden = eventos.length === 0;
    vacio.hidden = eventos.length > 0;
    resumen.textContent =
      eventos.length === 0
        ? 'Aún no hay eventos con estos filtros. Inicia sesión o crea un hábito para generarlos.'
        : `${eventos.length} eventos · cada uno encadenado por hash al anterior`;
    // La verificación es asíncrona y la dispara la persona: al cambiar la lista se invalida.
    if (integridad.dataset.estado !== 'verificando') {
      integridad.dataset.estado = 'pendiente';
      integridad.textContent = 'Sin verificar: usa «Verificar integridad».';
    }
  }

  const raiz = crear(
    'div',
    { class: 'visor-vista visor-vista-auditoria' },
    crear(
      'p',
      { class: 'visor-ayuda' },
      'Registro inalterable de las acciones con valor para el negocio: accesos, creación, marcado y borrado de hábitos.',
    ),
    resumen,
    integridad,
    crear(
      'div',
      { class: 'visor-filtros' },
      campoFiltro('filtro-auditoria-resultado', 'Resultado', filtroResultado),
      campoFiltro('filtro-auditoria-texto', 'Buscar', filtroTexto),
    ),
    caja,
    vacio,
    crear('div', { class: 'visor-acciones' }, botonVerificar, botonExportar, botonLimpiar),
  );

  return { id: 'auditoria', titulo: 'Auditoría', raiz, refrescar };
}
