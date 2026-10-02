// Orquestación de la interfaz del panel (specs 001, 002, 004, 005, 006 y 007).
//
// Solo presenta y conecta eventos: las reglas viven en dominio/, la persistencia en almacen.js,
// la autenticación simulada en auth.js, la guía en tour/ y la observabilidad en observabilidad/.
// Cada acción de la persona queda medida (métricas), trazada (trazas y bitácora) y auditada.
import {
  crearHabito,
  diasCumplidos,
  eliminarHabito,
  estaHechoHoy,
  fechaLocal,
  marcarHecho,
  ordenarPorCreacion,
} from './dominio/habitos.js';
import { calcularRachas } from './dominio/rachas.js';
import { guardarHabitos, guardarRegistros, leerHabitos, leerRegistros } from './almacen.js';
import { cerrarSesion, iniciarSesion, sesionActual } from './auth.js';
import { cerrarTour, iniciarTour } from './tour/tour.js';
import { crear, porTestId } from './ui/dom.js';
import { registrarEvento } from './observabilidad/auditoria.js';
import { aviso, error as registrarError, info } from './observabilidad/bitacora.js';
import { ahoraMs } from './observabilidad/deposito.js';
import { incrementar, observar } from './observabilidad/metricas.js';
import { conSpan, conTraza } from './observabilidad/trazas.js';
import { montarVisor } from './observabilidad/visor.js';

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
  verObservabilidad: porTestId('ver-observabilidad'),
  zonaVisor: document.getElementById('zona-visor'),
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
const conDias = (n) => (n === 1 ? '1 día' : `${n} días`);
const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** Mensaje para lectores de pantalla (región role="status"). */
function anunciar(mensaje) {
  ui.anuncio.textContent = mensaje;
}

// ─── Observabilidad ────────────────────────────────────────────────────────────────────────

const actorActual = () => sesionActual()?.email ?? 'anonimo';

/**
 * Envuelve una acción de la interfaz: la traza, mide cuánto tardó, la cuenta y, si falla, deja el
 * error en la bitácora y en el contador de errores. Devuelve lo que devuelva la operación.
 *
 * Importante: dentro no debe haber diálogos (confirm/prompt). El tiempo que la persona tarda en
 * contestar inflaría la métrica de latencia y dispararía alarmas falsas.
 */
function accion(nombre, operacion, atributos = {}) {
  const inicio = ahoraMs();
  incrementar('habitos_acciones_total', { accion: nombre });
  try {
    return conTraza(nombre, operacion, atributos);
  } catch (fallo) {
    incrementar('habitos_errores_total', { origen: nombre });
    registrarError(`la acción «${nombre}» falló`, { mensaje: String(fallo?.message ?? fallo) });
    throw fallo;
  } finally {
    observar('habitos_operacion_duracion_ms', ahoraMs() - inicio, { operacion: nombre });
  }
}

/** Registra un evento auditable. Es asíncrono (hash SHA-256) y nunca debe bloquear la interfaz. */
function auditar(datos) {
  registrarEvento({ actor: actorActual(), ...datos }).catch(() =>
    registrarError('no se pudo auditar la acción', { accion: datos.accion }),
  );
}

/** Guarda y, si el navegador no deja escribir, lo cuenta: esa métrica tiene alarma propia. */
function guardar(dato, escribir, valor) {
  const guardado = escribir(valor);
  if (!guardado) {
    incrementar('habitos_almacen_fallos_total', { dato });
    registrarError('el navegador no permitió guardar', { dato });
  }
  return guardado;
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
  const email = ui.loginEmail.value.trim();
  // Los registros se escriben dentro de la traza: así cada uno guarda su identificador y el visor
  // puede saltar del registro a la operación completa.
  const resultado = accion(
    'iniciar sesión',
    () => {
      const intento = conSpan('validar credenciales', () => iniciarSesion(ui.loginEmail.value, ui.loginPassword.value));
      if (intento.ok) info('sesión iniciada', { email: intento.sesion.email });
      else aviso('acceso rechazado', { email, motivo: intento.mensaje });
      return intento;
    },
    { email },
  );
  incrementar('habitos_accesos_total', { resultado: resultado.ok ? 'exito' : 'rechazado' });

  if (!resultado.ok) {
    ui.loginError.textContent = resultado.mensaje;
    auditar({ accion: 'sesion.rechazada', actor: email || 'anonimo', recurso: 'sesion', resultado: 'rechazado' });
    return;
  }
  ui.loginError.textContent = '';
  ui.loginForm.reset();
  auditar({ accion: 'sesion.iniciada', actor: resultado.sesion.email, recurso: 'sesion' });
  mostrarPanel(resultado.sesion);
  ui.tituloPanel.focus();
  iniciarTour();
});

ui.logout.addEventListener('click', () => {
  const email = actorActual();
  accion(
    'cerrar sesión',
    () => {
      cerrarSesion();
      info('sesión cerrada', { email });
    },
    { email },
  );
  auditar({ accion: 'sesion.cerrada', actor: email, recurso: 'sesion' });
  mostrarAcceso();
  ui.loginEmail.focus();
});

ui.verGuia.addEventListener('click', () => {
  info('guía abierta a petición', { origen: 'botón Ver guía' });
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
  const escrito = ui.habitName.value.trim();
  const resultado = accion(
    'crear hábito',
    () => {
      const habitos = conSpan('leer hábitos', () => leerHabitos());
      const creado = conSpan('validar nombre', () => crearHabito(ui.habitName.value, habitos, new Date()));
      if (!creado.ok) {
        aviso('hábito rechazado', { nombre: escrito, motivo: creado.mensaje });
        return creado;
      }
      conSpan('guardar hábitos', () => guardar('habitos', guardarHabitos, [...habitos, creado.habito]));
      info('hábito creado', { nombre: creado.habito.nombre, id: creado.habito.id });
      return creado;
    },
    { nombre: escrito },
  );

  if (!resultado.ok) {
    mostrarErrorHabito(resultado.mensaje);
    ui.habitName.focus();
    incrementar('habitos_creados_total', { resultado: 'rechazado' });
    auditar({
      accion: 'habito.creado',
      recurso: escrito,
      resultado: 'rechazado',
      detalle: { motivo: resultado.mensaje },
    });
    return;
  }
  ui.habitName.value = '';
  limpiarErrorHabito();
  renderizar();
  anunciar(`Hábito «${resultado.habito.nombre}» agregado.`);
  incrementar('habitos_creados_total', { resultado: 'exito' });
  auditar({ accion: 'habito.creado', recurso: resultado.habito.nombre, detalle: { id: resultado.habito.id } });
});

ui.habitName.addEventListener('input', () => {
  if (ui.habitError.textContent) limpiarErrorHabito();
});

/** Insignias "Racha" y "Mejor" (spec 004). La racha del primer hábito es el ancla de la guía. */
function crearRachas(habito, registros, hoy, esPrimero) {
  const fechas = registros.filter((registro) => registro.habitoId === habito.id).map((registro) => registro.fecha);
  const { actual, maxima } = calcularRachas(fechas, hoy);
  return crear(
    'p',
    { class: 'habito-rachas' },
    crear(
      'span',
      {
        class: actual > 0 ? 'insignia insignia-racha insignia-activa' : 'insignia insignia-racha',
        'data-testid': 'habit-streak-current',
        'data-tour': esPrimero ? 'racha' : null,
      },
      `Racha: ${conDias(actual)}`,
    ),
    crear('span', { class: 'solo-lectores' }, ', '),
    crear('span', { class: 'insignia insignia-mejor', 'data-testid': 'habit-streak-max' }, `Mejor: ${conDias(maxima)}`),
  );
}

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
      crearRachas(habito, registros, hoy, esPrimero),
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

/**
 * Vuelve a pintar la lista (días cumplidos y rachas incluidos). "Hoy" se recalcula siempre:
 * un cambio de día se refleja al repintar.
 */
function renderizar() {
  const inicio = ahoraMs();
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
  observar('habitos_render_duracion_ms', ahoraMs() - inicio);
}

function enfocarEnItem(habitoId, testId) {
  const item = ui.lista.querySelector(`[data-habit-id="${CSS.escape(habitoId)}"]`);
  porTestId(testId, item ?? document)?.focus();
}

function marcar(habitoId, conTeclado) {
  const habito = leerHabitos().find((h) => h.id === habitoId);
  const recurso = habito?.nombre ?? habitoId;
  const hoy = fechaLocal(new Date());
  const cambio = accion(
    'marcar hábito',
    () => {
      const registros = conSpan('leer registros', () => leerRegistros());
      const nuevos = conSpan('calcular registros', () => marcarHecho(registros, habitoId, hoy));
      if (nuevos.length === registros.length) {
        info('el hábito ya estaba marcado hoy', { nombre: recurso });
        return false;
      }
      conSpan('guardar registros', () => guardar('registros', guardarRegistros, nuevos));
      info('hábito marcado como hecho hoy', { nombre: recurso, fecha: hoy });
      return true;
    },
    { habitoId, nombre: recurso },
  );
  renderizar();
  if (habito) anunciar(`«${habito.nombre}» marcado como hecho hoy.`);

  if (cambio) {
    incrementar('habitos_marcados_total');
    auditar({ accion: 'habito.marcado', recurso, detalle: { fecha: hoy } });
  }
  // El botón queda deshabilitado: quien usa teclado sigue en el mismo hábito.
  if (conTeclado) enfocarEnItem(habitoId, 'habit-delete');
}

function eliminar(habitoId, conTeclado) {
  const habitos = ordenarPorCreacion(leerHabitos());
  const indice = habitos.findIndex((h) => h.id === habitoId);
  if (indice === -1) return;
  const { nombre } = habitos[indice];
  // La confirmación va antes de la traza: el tiempo de respuesta de la persona no es latencia.
  if (!window.confirm(`¿Eliminar «${nombre}»? También se borrará su historial.`)) {
    info('eliminación cancelada por la persona', { nombre });
    return;
  }

  const resultado = accion(
    'eliminar hábito',
    () => {
      const borrado = conSpan('quitar hábito y su historial', () =>
        eliminarHabito(habitos, leerRegistros(), habitoId),
      );
      conSpan('guardar hábitos', () => guardar('habitos', guardarHabitos, borrado.habitos));
      conSpan('guardar registros', () => guardar('registros', guardarRegistros, borrado.registros));
      info('hábito eliminado', { nombre, restantes: borrado.habitos.length });
      return borrado;
    },
    { habitoId, nombre },
  );
  renderizar();
  anunciar(`Hábito «${nombre}» eliminado.`);
  incrementar('habitos_eliminados_total');
  auditar({ accion: 'habito.eliminado', recurso: nombre, detalle: { restantes: resultado.habitos.length } });
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

montarVisor({ contenedor: ui.zonaVisor, boton: ui.verObservabilidad, actorActual });

const sesion = sesionActual();
info('panel cargado', { conSesion: Boolean(sesion) });
if (sesion) {
  mostrarPanel(sesion);
  iniciarTour();
} else {
  mostrarAcceso();
}
