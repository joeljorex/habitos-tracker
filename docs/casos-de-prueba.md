# Casos de Prueba

Los casos aplican a todos los clientes. En el panel web se automatizan con Playwright: el título
de cada prueba empieza con el ID del caso (`CP-xx`), así el reporte muestra qué caso cubre cada
prueba. En la app Android se automatizarán con Appium.

## Catálogo

| ID | Descripción | Pasos | Resultado esperado | Cliente | Automatizado en |
|---|---|---|---|---|---|
| CP-01 | Crear hábito con nombre vacío | 1. Iniciar sesión 2. Dejar el nombre vacío (o solo espacios) 3. Agregar | «Escribe un nombre para el hábito.»; no se crea el hábito | Web · App | `tests/e2e/habitos.spec.js` (`@smoke`) |
| CP-02 | Marcar hábito completado dos veces el mismo día | 1. Marcar hoy 2. Intentar de nuevo (doble clic o tras recargar) | Un solo registro; «1 día cumplido» | Web · App | `tests/e2e/habitos.spec.js` |
| CP-03 | Uso sin conexión | 1. Desactivar red 2. Crear/editar hábito 3. Reactivar red | Cambios guardados localmente y sincronizados al reconectar | App | Appium (pendiente: requiere la app) |
| CP-04 | Cálculo de racha tras un día saltado | 1. Completar días 1 y 2 2. Saltar el día 3 3. Completar el día 4 | Racha actual 1; mejor racha 2 | Web · App | pendiente (spec 004) |
| CP-05 | Login con credenciales inválidas | 1. Ingresar correo o contraseña incorrectos | «Correo o contraseña incorrectos.»; no entra | Web · App | `tests/e2e/autenticacion.spec.js` |
| CP-06 | Eliminar hábito | 1. Eliminar un hábito con historial y confirmar 2. Repetir cancelando | Desaparece junto con sus registros, también tras recargar; al cancelar se conserva | Web · App | `tests/e2e/habitos.spec.js` |
| CP-07 | Nombre de más de 60 caracteres | 1. Escribir 61 caracteres 2. Agregar | «El nombre puede tener máximo 60 caracteres.»; no se crea | Web | `tests/e2e/habitos.spec.js` |
| CP-08 | Persistencia al recargar | 1. Crear dos hábitos 2. Recargar la página | Siguen en la lista, en el orden de creación | Web | `tests/e2e/habitos.spec.js` |
| CP-09 | Nombre duplicado | 1. Crear «Tomar agua» 2. Crear « tomar AGUA » | «Ya tienes un hábito con ese nombre.»; no se crea | Web | `tests/e2e/habitos.spec.js` |
| CP-10 | Login válido y cierre de sesión | 1. Entrar con la cuenta de demostración 2. Cerrar sesión | Ve el panel con su correo; vuelve a la pantalla de acceso | Web | `tests/e2e/autenticacion.spec.js` (`@smoke`) |
| CP-11 | Guía en la primera visita | 1. Entrar sin datos previos 2. Recorrer con «Siguiente» | La guía aparece sola («1 de N») y termina en «Listo» | Web | `tests/e2e/tour.spec.js` |
| CP-12 | La guía no se repite y se relanza | 1. Completar o cerrar (X o Esc) 2. Recargar 3. Pulsar «Ver guía» | No reaparece sola; «Ver guía» la inicia desde el paso 1 | Web | `tests/e2e/tour.spec.js` |
| CP-13 | Racha viva desde ayer / rota | 1. Último día cumplido: ayer 2. Último día cumplido: anteayer | Cuenta hasta ayer; si fue anteayer, racha 0 y la mejor racha se conserva | Web | pendiente (spec 004) |

## Cómo ejecutar un caso

```bash
npx playwright test -g "CP-07"                    # un caso, escritorio y móvil
npx playwright test -g "CP-07" --project=movil    # solo móvil
npm run test:smoke                                # solo los casos @smoke
```

## Convenciones para casos nuevos

- ID consecutivo; fila en este archivo y en `docs/trazabilidad.md`.
- Prueba automatizada con la skill `caso-de-prueba-e2e`: título con el ID, `data-testid` del
  contrato (`specs/001-panel-web-e2e/contracts/ui-contract.md`) y `@smoke` solo si el caso es
  rápido y seguro de ejecutar contra producción.
