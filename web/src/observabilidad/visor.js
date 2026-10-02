// Marco del visor de observabilidad (specs 005, 006 y 007).
//
// Un panel con tres pestañas dentro de la misma aplicación: Métricas (con sus alarmas),
// Trazabilidad (bitácora y trazas) y Auditoría. No necesita servidor: todo se arma con lo que los
// módulos de observabilidad ya guardaron en el navegador, así que también funciona en GitHub Pages.
import { crear } from '../ui/dom.js';
import { alarmasActuales, estadoGeneral } from './alarmas.js';
import { alCambiar as alCambiarAuditoria } from './auditoria.js';
import { alCambiar as alCambiarBitacora } from './bitacora.js';
import { alCambiar as alCambiarMetricas } from './metricas.js';
import { alCambiar as alCambiarTrazas } from './trazas.js';
import { crearVistaAuditoria } from './visor/auditoria-vista.js';
import { crearVistaMetricas } from './visor/metricas-vista.js';
import { crearVistaTrazabilidad } from './visor/trazabilidad-vista.js';

const ETIQUETA_ESTADO = { ok: 'todo normal', aviso: 'con avisos', alarma: 'con alarmas' };

/**
 * Monta el visor dentro de `contenedor` y lo conecta a `boton`.
 * @param {{contenedor: HTMLElement, boton: HTMLElement, actorActual?: () => string}} opciones
 */
export function montarVisor({ contenedor, boton, actorActual = () => 'desconocido' }) {
  const vistas = [crearVistaMetricas(), crearVistaTrazabilidad(), crearVistaAuditoria({ actorActual })];

  const pestanas = vistas.map((vista, indice) =>
    crear(
      'button',
      {
        type: 'button',
        role: 'tab',
        class: 'visor-pestana',
        id: `visor-pestana-${vista.id}`,
        'data-testid': `visor-pestana-${vista.id}`,
        'aria-controls': `visor-panel-${vista.id}`,
        'aria-selected': indice === 0 ? 'true' : 'false',
        tabindex: indice === 0 ? '0' : '-1',
      },
      vista.titulo,
    ),
  );

  const paneles = vistas.map((vista, indice) =>
    crear(
      'div',
      {
        role: 'tabpanel',
        class: 'visor-panel',
        id: `visor-panel-${vista.id}`,
        'data-testid': `visor-panel-${vista.id}`,
        'aria-labelledby': `visor-pestana-${vista.id}`,
        tabindex: '0',
        hidden: indice !== 0,
      },
      vista.raiz,
    ),
  );

  const listaPestanas = crear(
    'div',
    { role: 'tablist', class: 'visor-pestanas', 'aria-label': 'Secciones del visor' },
    ...pestanas,
  );

  const botonCerrar = crear(
    'button',
    { type: 'button', class: 'boton boton-texto boton-chico', 'data-testid': 'visor-cerrar' },
    'Cerrar visor',
  );

  const seccion = crear(
    'section',
    { id: 'visor', class: 'tarjeta visor', 'data-testid': 'visor', 'aria-labelledby': 'visor-titulo', hidden: true },
    crear(
      'div',
      { class: 'visor-cabecera' },
      crear('h2', { id: 'visor-titulo', class: 'visor-titulo', tabindex: '-1' }, 'Observabilidad'),
      botonCerrar,
    ),
    listaPestanas,
    ...paneles,
  );
  contenedor.append(seccion);

  let activa = 0;

  function activar(indice, conFoco = true) {
    activa = (indice + vistas.length) % vistas.length;
    pestanas.forEach((pestana, i) => {
      const elegida = i === activa;
      pestana.setAttribute('aria-selected', elegida ? 'true' : 'false');
      pestana.setAttribute('tabindex', elegida ? '0' : '-1');
      paneles[i].hidden = !elegida;
    });
    vistas[activa].refrescar();
    if (conFoco) pestanas[activa].focus();
  }

  listaPestanas.addEventListener('click', (evento) => {
    const indice = pestanas.indexOf(evento.target.closest('[role="tab"]'));
    if (indice !== -1) activar(indice, false);
  });

  listaPestanas.addEventListener('keydown', (evento) => {
    const movimientos = { ArrowRight: activa + 1, ArrowLeft: activa - 1, Home: 0, End: vistas.length - 1 };
    if (!(evento.key in movimientos)) return;
    evento.preventDefault();
    activar(movimientos[evento.key]);
  });

  function actualizarBoton() {
    const estado = estadoGeneral(alarmasActuales());
    boton.dataset.estado = estado;
    boton.setAttribute('aria-label', `Observabilidad: ${ETIQUETA_ESTADO[estado]}`);
  }

  function abrir() {
    seccion.hidden = false;
    boton.setAttribute('aria-expanded', 'true');
    vistas[activa].refrescar();
    seccion.querySelector('.visor-titulo').focus();
    seccion.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function cerrar() {
    seccion.hidden = true;
    boton.setAttribute('aria-expanded', 'false');
    boton.focus();
  }

  const estaAbierto = () => !seccion.hidden;

  boton.setAttribute('aria-expanded', 'false');
  boton.setAttribute('aria-controls', 'visor');
  boton.addEventListener('click', () => (estaAbierto() ? cerrar() : abrir()));
  botonCerrar.addEventListener('click', cerrar);

  seccion.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') cerrar();
  });

  // Mientras está abierto, el visor sigue en vivo lo que la aplicación va registrando.
  let pendiente = false;
  function alHaberCambios() {
    actualizarBoton();
    if (!estaAbierto() || pendiente) return;
    pendiente = true;
    globalThis.requestAnimationFrame?.(() => {
      pendiente = false;
      vistas[activa].refrescar();
    });
  }

  for (const suscribir of [alCambiarMetricas, alCambiarBitacora, alCambiarTrazas, alCambiarAuditoria]) {
    suscribir(alHaberCambios);
  }
  actualizarBoton();

  return { abrir, cerrar, estaAbierto, activar };
}
