# Data Model: Panel web de hábitos

## Entidades

### Hábito

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | string | Identificador único (UUID v4 con `crypto.randomUUID()`; respaldo aleatorio si no existe). |
| `nombre` | string | Recortado; longitud 1–60; único sin distinguir mayúsculas/minúsculas. |
| `creadoEn` | string (ISO 8601) | Fecha y hora de creación; define el orden de la lista. |

### Registro de cumplimiento

| Campo | Tipo | Reglas |
|---|---|---|
| `habitoId` | string | Referencia a `Hábito.id`. |
| `fecha` | string `YYYY-MM-DD` | Día calendario local del dispositivo. |

**Unicidad**: como máximo un registro por (`habitoId`, `fecha`) — base de la idempotencia de
"Marcar hoy" (FR-006) y de las rachas (spec 004).

### Sesión

| Campo | Tipo | Reglas |
|---|---|---|
| `email` | string | Correo con el que se inició sesión. |
| `iniciadaEn` | string (ISO 8601) | Momento del inicio de sesión. |

## Relaciones

- Un **Hábito** tiene 0..N **Registros**. Eliminar un hábito elimina sus registros (cascada).

## Transiciones de estado (por hábito y día)

```text
pendiente hoy ──(Marcar hoy)──▶ hecho hoy ──(Marcar hoy otra vez)──▶ hecho hoy (sin cambios)
      ▲                                                      │
      └──────────────── cambio de día (nuevo día) ◀──────────┘
cualquier estado ──(Eliminar + confirmar)──▶ eliminado (con sus registros)
```

## Almacenamiento en el navegador

| Clave | Almacén | Contenido |
|---|---|---|
| `habitos.v1.habitos` | localStorage | JSON: arreglo de Hábito |
| `habitos.v1.registros` | localStorage | JSON: arreglo de Registro |
| `habitos.v1.tourVisto` | localStorage | `"1"` cuando la guía se completó o cerró (spec 002) |
| `habitos.v1.sesion` | sessionStorage | JSON: Sesión |

Un valor que no se puede interpretar como JSON se trata como vacío (caso borde de la spec).

## Correspondencia con la API futura (Laravel + MySQL)

| Panel web | Tabla MySQL | Columnas |
|---|---|---|
| Hábito | `habits` | `id`, `user_id`, `name` (VARCHAR 60), `created_at`, `updated_at`, `deleted_at` |
| Registro | `habit_logs` | `id`, `habit_id`, `completed_on` (DATE), `created_at`; `UNIQUE(habit_id, completed_on)` |
| Sesión | `personal_access_tokens` | tokens de Laravel Sanctum |
