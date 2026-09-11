# Contrato de UI y de dominio: Panel web

Las pruebas dependen de este contrato. Cambiar un `data-testid`, un texto marcado como exacto o
una firma de función es un cambio de contrato: se actualiza este archivo y las pruebas en el
mismo PR.

## 1. Identificadores de prueba (`data-testid`)

| Pantalla | `data-testid` | Elemento |
|---|---|---|
| Acceso | `login-form` | formulario de acceso |
| Acceso | `login-email` | campo correo (`type=email`, etiqueta "Correo") |
| Acceso | `login-password` | campo contraseña (etiqueta "Contraseña") |
| Acceso | `login-submit` | botón "Entrar" |
| Acceso | `login-error` | mensaje de error (`role=alert`) |
| Panel | `usuario-actual` | correo del usuario en el encabezado |
| Panel | `logout` | botón "Cerrar sesión" |
| Panel | `ver-guia` | botón "Ver guía" (spec 002) |
| Panel | `habit-form` | formulario de nuevo hábito |
| Panel | `habit-name` | campo nombre (etiqueta "Nombre del hábito") |
| Panel | `habit-submit` | botón "Agregar" |
| Panel | `habit-error` | mensaje de validación (`aria-live=polite`) |
| Panel | `habit-list` | lista de hábitos (`ul`) |
| Panel | `habit-item` | cada hábito (`li`, con atributo `data-habit-id`) |
| Panel | `habit-name-text` | nombre dentro del ítem |
| Panel | `habit-days` | texto de días cumplidos dentro del ítem |
| Panel | `habit-complete` | botón "Marcar hoy" / "Hecho hoy ✓" |
| Panel | `habit-delete` | botón "Eliminar" (etiqueta accesible "Eliminar «nombre»") |
| Panel | `empty-state` | mensaje de lista vacía |
| Panel | `habit-streak-current`, `habit-streak-max` | rachas (spec 004) |

Anclas de la guía (spec 002): atributo `data-tour` con valores `nuevo-habito` (formulario),
`lista` (contenedor de la lista), `marcar` (botón del primer hábito), `racha` (spec 004) y
`ver-guia` (botón).

## 2. Textos exactos

| Situación | Texto |
|---|---|
| Credenciales inválidas | `Correo o contraseña incorrectos.` |
| Nombre vacío | `Escribe un nombre para el hábito.` |
| Nombre largo | `El nombre puede tener máximo 60 caracteres.` |
| Nombre duplicado | `Ya tienes un hábito con ese nombre.` |
| Lista vacía | `Aún no tienes hábitos. Crea el primero.` |
| Botón pendiente / hecho | `Marcar hoy` / `Hecho hoy ✓` |
| Días cumplidos | `0 días cumplidos`, `1 día cumplido`, `N días cumplidos` |
| Confirmación al eliminar | `¿Eliminar «{nombre}»? También se borrará su historial.` |

Cuenta de demostración: `demo@habitos.app` / `Habitos123`.

## 3. Módulo de dominio `web/src/dominio/habitos.js`

Funciones puras (sin DOM, sin almacenamiento, sin reloj implícito):

```text
fechaLocal(fecha: Date) -> "YYYY-MM-DD"                   # día calendario local
validarNombre(nombre: string, existentes: Habito[])
    -> { ok: true, valor: string }
     | { ok: false, error: "vacio" | "largo" | "duplicado", mensaje: string }
crearHabito(nombre: string, existentes: Habito[], ahora: Date, generarId?: () => string)
    -> { ok: true, habito: Habito } | { ok: false, error, mensaje }
marcarHecho(registros: Registro[], habitoId: string, fecha: string) -> Registro[]
    # devuelve un arreglo nuevo; si ya existe (habitoId, fecha) lo devuelve sin cambios
estaHechoHoy(registros: Registro[], habitoId: string, hoy: string) -> boolean
diasCumplidos(registros: Registro[], habitoId: string) -> number   # fechas distintas
eliminarHabito(habitos: Habito[], registros: Registro[], habitoId: string)
    -> { habitos: Habito[], registros: Registro[] }
```

## 4. Contrato con el pipeline (spec 003)

Scripts de `package.json`: `test:unit`, `test:e2e`, `test:smoke`, `test`, `serve`.
`scripts/serve.mjs` lee `SERVE_DIR` (defecto `web`) y `PORT` (defecto `4173`).
`playwright.config.js` usa `BASE_URL` si existe (y entonces no levanta servidor).
Las pruebas navegan con rutas relativas (`page.goto('./')`) y las smoke llevan `@smoke` en el título.

## 5. Ayudantes de prueba `tests/e2e/helpers.js`

- `iniciarSesion(page)`: abre `./` e inicia sesión con la cuenta de demostración.
- `sembrar(page, { habitos = [], registros = [], tourVisto = true })`: antes de cargar la página
  escribe esas claves en `localStorage` **solo si no existen**, para que una recarga no borre lo
  que la prueba creó (necesario para CP-08).
