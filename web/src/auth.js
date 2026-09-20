// Autenticación simulada del prototipo (spec 001, T009; research.md R4).
// En la fase de API se reemplaza por Laravel Sanctum sin cambiar la pantalla de acceso.
import { borrarSesion, guardarSesion, leerSesion } from './almacen.js';

export const CUENTA_DEMO = Object.freeze({ email: 'demo@habitos.app', password: 'Habitos123' });

// Mismo mensaje para correo o contraseña incorrectos: no se revela cuál falló (FR-002).
export const MENSAJE_CREDENCIALES = 'Correo o contraseña incorrectos.';

/** Valida la cuenta de demostración y guarda la sesión en sessionStorage. */
export function iniciarSesion(email, password, ahora = new Date()) {
  const correo = String(email ?? '').trim().toLowerCase();
  if (correo !== CUENTA_DEMO.email || password !== CUENTA_DEMO.password) {
    return { ok: false, mensaje: MENSAJE_CREDENCIALES };
  }
  const sesion = { email: CUENTA_DEMO.email, iniciadaEn: ahora.toISOString() };
  guardarSesion(sesion);
  return { ok: true, sesion };
}

export function cerrarSesion() {
  borrarSesion();
}

/** Sesión de la pestaña actual o null. */
export function sesionActual() {
  return leerSesion();
}
