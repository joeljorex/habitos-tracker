# Data Model: Guía interactiva

## Paso de guía (en memoria, definido en código)

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | string | Único en el registro (`nuevo-habito`, `lista`, `marcar`, `racha`, `ver-guia`). |
| `elemento` | string | Selector CSS del ancla, siempre de la forma `[data-tour="<id>"]`. |
| `titulo` | string | Texto corto en español. |
| `descripcion` | string | Una o dos oraciones en español. |
| `alternativa` | objeto opcional | `{ elemento, descripcion }` a usar si `elemento` no existe. |

## Estado de la guía (persistido)

| Clave | Almacén | Valores | Significado |
|---|---|---|---|
| `habitos.v1.tourVisto` | localStorage | ausente / `"1"` | `"1"` = completada o cerrada en este dispositivo |

## Transiciones

```text
no vista ──(inicio de sesión)──▶ en curso ──(Listo | X | Esc)──▶ vista
vista ──(Ver guía)──▶ en curso ──(Listo | X | Esc)──▶ vista
```
