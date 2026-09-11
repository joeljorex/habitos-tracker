// Orquestación de la interfaz del panel (specs 001 y 002).
//
// Solo presenta y conecta eventos: las reglas viven en dominio/, la persistencia en almacen.js,
// la autenticación simulada en auth.js y la guía en tour/.
import {
  crearHabito,
  diasCumplidos,
  eliminarHabito,
  estaHechoHoy,
  fechaLocal,
  marcarHecho,
  ordenarPorCreacion,
} from './dominio/habitos.js';
import { guardarHabitos, guardarRegistros, leerHabitos, leerRegistros } from './almacen.js';
import { cerrarSesion, iniciarSesion, sesionActual } from './auth.js';
import { cerrarTour, iniciarTour } from './tour/tour.js';

const porTestId = (id, raiz = document) => raiz.querySelector(`[data-testid="${id}"]`);

const ui = {
  vistaAcceso: document.getElementById('vista-acceso'),
  vistaPanel: document.getElementById('vista-panel'),
  loginForm: porTestId('login-form'),
  loginEmail: porTestId('login-email'),
  loginPassword: porTestId('login-password'),
  loginError: porTestId('login-error'),
  usuario: porTestId('usuario-actual'),
  logout: porTestId('logout'),
  verGuia: porTestId('ver-guia'),
  tituloPanel: document.getElementById('titulo-panel'),
  fechaHoy: document.getElementById('fecha-hoy'),
  habitForm: porTestId('habit-form'),
  habitName: porTestId('habit-name'),
  habitError: porTestId('habit-error'),
  lista: porTestId('habit-list'),
  vacio: porTestId('empty-state'),
  resumen: document.getElementById('resumen-hoy'),
  anuncio: document.getElementById('anuncio'),
};

const FORMATO_FECHA = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

const textoDiasCumplidos = (n) => (n === 1 ? '1 día cumplido' : `${n} días cumplidos`);
const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** Crea un elemento con atributos y texto seguro (los datos del usuario nunca pasan por innerHTML). */
function crear(etiqueta, atributos = {}, ...hijos) {
  const nodo = document.createElement(etiqueta);
  for (const [nombre, valor] of Object.entries(atributos)) {
    if (valor === false || valor === null || valor === undefined) continue;
    nodo.setAttribute(nombre, valor === true ? '' : String(valor));
  }
  nodo.append(...hijos);
  return nodo;
}

/** Mensaje para lectores de pantalla (región role="status"). */
function anunciar(mensaje) {
  ui.anuncio.textContent = mensaje;
}

// ─── Vistas ────────────────────────────────────────────────────────────────────────────────

function mostrarAcceso() {
  cerrarTour();
  ui.vistaPanel.hidden = true;
  ui.vistaAcceso.hidden = false;
  ui.usuario.textContent = '';
  document.title = 'Iniciar sesión · Hábitos Tracker';
}

function mostrarPanel(sesion) {
  ui.vistaAcceso.hidden = true;
  ui.vistaPanel.hidden = false;
  ui.usuario.textContent = sesion.email;
  document.title = 'Mis hábitos · Hábitos Tracker';
  limpiarErrorHabito();
  renderizar();
}

// ─── Acceso ────────────────────────────────────────────────────────────────────────────────

ui.loginForm.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const resultado = iniciarSesion(ui.loginEmail.value, ui.loginPassword.value);
  if (!resultado.ok) {
    ui.loginError.textContent = resultado.mensaje;
    return;
  }
  ui.loginError.textContent = '';
  ui.loginForm.reset();
  mostrarPanel(resultado.sesion);
  ui.tituloPanel.focus();
  iniciarTour();
});

ui.logout.addEventListener('click', () => {
  cerrarSesion();
  mostrarAcceso();
  ui.loginEmail.focus();
});

ui.verGuia.addEventListener('click', () => {
  iniciarTour({ forzar: true });
});

// ─── Hábitos ───────────────────────────────────────────────────────────────────────────────

function mostrarErrorHabito(mensaje) {
  ui.habitError.textContent = mensaje;
  ui.habitName.setAttribute('aria-invalid', 'true');
}

function limpiarErrorHabito() {
  ui.habitError.textContent = '';
  ui.habitName.removeAttribute('aria-invalid');
}

ui.habitForm.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const habitos = leerHabitos();
  const resultado = crearHabito(ui.habitName.value, habitos, new Date());
  if (!resultado.ok) {
    mostrarErrorHabito(resultado.mensaje);
    ui.habitName.focus();
    return;
  }
  guardarHabitos([...habitos, resultado.habito]);
  ui.habitName.value = '';
  limpiarErrorHabito();
  renderizar();
  anunciar(`Hábito «${resultado.habito.nombre}» agregado.`);
});

ui.habitName.addEventListener('input', () => {
  if (ui.habitError.textContent) limpiarErrorHabito();
});

function crearItem(habito, registros, hoy, esPrimero) {
  const hecho = estaHechoHoy(registros, habito.id, hoy);
  return crear(
    'li',
    { class: hecho ? 'habito habito-hecho' : 'habito', 'data-testid': 'habit-item', 'data-habit-id': habito.id },
    crear(
      'div',
      { class: 'habito-info' },
      crear('h3', { class: 'habito-nombre', 'data-testid': 'habit-name-text' }, habito.nombre),
      crear(
        'p',
        { class: 'habito-dias', 'data-testid': 'habit-days' },
        textoDiasCumplidos(diasCumplidos(registros, habito.id)),
      ),
    ),
    crear(
      'div',
      { class: 'habito-acciones' },
      crear(
        'button',
        {
          type: 'button',
          class: 'boton boton-marcar',
          'data-testid': 'habit-complete',
          'data-accion': 'marcar',
          'data-tour': esPrimero ? 'marcar' : null,
          disabled: hecho,
        },
        hecho ? 'Hecho hoy ✓' : 'Marcar hoy',
      ),
      crear(
        'button',
        {
          type: 'button',
          class: 'boton boton-eliminar',
          'data-testid': 'habit-delete',
          'data-accion': 'eliminar',
          'aria-label': `Eliminar «${habito.nombre}»`,
        },
        'Eliminar',
      ),
    ),
  );
}

/** Vuelve a pintar la lista. "Hoy" se recalcula siempre: un cambio de día se refleja al repintar. */
function renderizar() {
  const ahora = new Date();
  const hoy = fechaLocal(ahora);
  const habitos = ordenarPorCreacion(leerHabitos());
  const registros = leerRegistros();

  ui.fechaHoy.textContent = capitalizar(FORMATO_FECHA.format(ahora));
  ui.lista.replaceChildren(...habitos.map((habito, i) => crearItem(habito, registros, hoy, i === 0)));
  ui.lista.hidden = habitos.length === 0;
  ui.vacio.hidden = habitos.length > 0;
  const hechosHoy = habitos.filter((habito) => estaHechoHoy(registros, habito.id, hoy)).length;
  ui.resumen.textContent = habitos.length > 0 ? `Hoy llevas ${hechosHoy} de ${habitos.length}` : '';
}

function enfocarEnItem(habitoId, testId) {
  const item = ui.lista.querySelector(`[data-habit-id="${CSS.escape(habitoId)}"]`);
  porTestId(testId, item ?? document)?.focus();
}

function marcar(habitoId, conTeclado) {
  const registros = leerRegistros();
  const nuevos = marcarHecho(registros, habitoId, fechaLocal(new Date()));
  if (nuevos.length !== registros.length) guardarRegistros(nuevos);
  renderizar();
  const habito = leerHabitos().find((h) => h.id === habitoId);
  if (habito) anunciar(`«${habito.nombre}» marcado como hecho hoy.`);
  // El botón queda deshabilitado: quien usa teclado sigue en el mismo hábito.
  if (conTeclado) enfocarEnItem(habitoId, 'habit-delete');
}

function eliminar(habitoId, conTeclado) {
  const habitos = ordenarPorCreacion(leerHabitos());
  const indice = habitos.findIndex((h) => h.id === habitoId);
  if (indice === -1) return;
  const { nombre } = habitos[indice];
  if (!window.confirm(`¿Eliminar «${nombre}»? También se borrará su historial.`)) return;

  const resultado = eliminarHabito(habitos, leerRegistros(), habitoId);
  guardarHabitos(resultado.habitos);
  guardarRegistros(resultado.registros);
  renderizar();
  anunciar(`Hábito «${nombre}» eliminado.`);
  if (conTeclado) {
    const vecino = resultado.habitos[Math.min(indice, resultado.habitos.length - 1)];
    if (vecino) enfocarEnItem(vecino.id, 'habit-delete');
    else ui.habitName.focus();
  }
}

ui.lista.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-accion]');
  const item = boton?.closest('[data-testid="habit-item"]');
  if (!boton || !item) return;
  // detail === 0: el clic lo generó el teclado (Enter/Espacio), no un puntero.
  const conTeclado = evento.detail === 0;
  if (boton.dataset.accion === 'marcar') marcar(item.dataset.habitId, conTeclado);
  else if (boton.dataset.accion === 'eliminar') eliminar(item.dataset.habitId, conTeclado);
});

// Al volver a la pestaña (quizá otro día), se repinta para que "Hoy" sea correcto.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !ui.vistaPanel.hidden) renderizar();
});

// ─── Arranque ──────────────────────────────────────────────────────────────────────────────

const sesion = sesionActual();
if (sesion) {
  mostrarPanel(sesion);
  iniciarTour();
} else {
  mostrarAcceso();
}
