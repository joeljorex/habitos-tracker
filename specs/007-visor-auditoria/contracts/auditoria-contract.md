# Contrato: eventos de auditoría y cadena de integridad

Este contrato define el formato del evento y, sobre todo, **cómo se calcula el hash**. Quien
implemente auditoría en otro cliente debe producir exactamente el mismo texto canónico, o las
cadenas no se podrán verificar entre sí.

## 1. Evento

```json
{
  "id": "4b7f2c1a",
  "fecha": "2026-10-01T18:51:37.482Z",
  "actor": "demo@habitos.app",
  "accion": "habito.creado",
  "recurso": "Tomar agua",
  "resultado": "exito",
  "detalle": { "id": "7a576054-16ac-4ba2-b324-b313687fb1a6" },
  "hashAnterior": "0000000000000000",
  "hash": "9f2a6c0b1d4e7a35"
}
```

| Campo | Regla |
|---|---|
| `id` | 8 caracteres hexadecimales |
| `fecha` | ISO 8601 en UTC |
| `actor` | correo de la sesión, o `anonimo` si no hay |
| `accion` | `sujeto.verbo` en minúsculas (tabla §2) |
| `recurso` | sobre qué se actuó (nombre del hábito, `sesion`, `auditoria`); cadena vacía si no aplica |
| `resultado` | `exito` \| `rechazado` \| `error`; cualquier otro valor se guarda como `exito` |
| `detalle` | objeto plano con lo necesario para entender el evento; nunca contraseñas |
| `hashAnterior` | `hash` del evento anterior, o `0000000000000000` en el primero |
| `hash` | SHA-256 del texto canónico, en hexadecimal, recortado a 16 caracteres |
| `inicioDeCadena` | `true` solo en el primer evento que queda después de un recorte |

Máximo **500** eventos.

## 2. Acciones auditadas

| Acción | Cuándo | Resultado típico |
|---|---|---|
| `sesion.iniciada` | acceso aceptado | `exito` |
| `sesion.rechazada` | acceso rechazado | `rechazado` |
| `sesion.cerrada` | la persona cierra sesión | `exito` |
| `habito.creado` | intento de crear (aceptado o rechazado) | `exito` / `rechazado` |
| `habito.marcado` | el hábito pasa a hecho hoy | `exito` |
| `habito.eliminado` | el hábito y su historial se borran | `exito` |
| `auditoria.limpiada` | se reinicia la auditoría | `exito` |

## 3. Texto canónico del hash

Los campos se unen con el carácter `|` **en este orden exacto**:

```text
fecha|actor|accion|recurso|resultado|JSON(detalle)|hashAnterior
```

Ejemplo:

```text
2026-10-01T18:51:37.482Z|demo@habitos.app|habito.creado|Tomar agua|exito|{"id":"7a57..."}|0000000000000000
```

Reglas:

- `recurso` vacío se escribe como cadena vacía (no se omite el separador).
- `detalle` se serializa con `JSON.stringify` sin espacios.
- Se codifica en UTF-8 antes de aplicar SHA-256.
- El hash resultante se escribe en hexadecimal en minúsculas y se toman los **primeros 16**
  caracteres.

## 4. Verificación

`verificarIntegridad()` recorre los eventos del más antiguo al más reciente llevando el hash
esperado:

1. Si el evento está en la posición 0 y tiene `inicioDeCadena`, el hash esperado es su propio
   `hashAnterior` (la cadena fue recortada, no alterada).
2. Si `hashAnterior` no coincide con el esperado → **falta un evento anterior o fueron reordenados**.
3. Si al recalcular el hash no coincide con el guardado → **el contenido del evento fue modificado**.
4. Si todo coincide, el esperado pasa a ser el `hash` del evento y se sigue.

Devuelve `{ ok: true, total }` o `{ ok: false, total, posicion, eventoId, motivo }`.

## 5. Exportación CSV

```text
fecha,actor,accion,recurso,resultado,detalle,hash
"2026-10-01T18:51:37.482Z","demo@habitos.app","sesion.iniciada","sesion","exito","{}","3c1f…"
```

Todos los campos van entre comillas dobles y las comillas internas se duplican.

## 6. Casos de referencia (pruebas)

| ID | Caso | Resultado esperado |
|---|---|---|
| A01 | Primer evento | `hashAnterior` es el hash inicial |
| A02 | Segundo evento | su `hashAnterior` es el `hash` del primero |
| A03 | Resultado desconocido | se guarda como `exito` |
| A04 | Cadena intacta de 3 eventos | `{ ok: true, total: 3 }` |
| A05 | Se edita el `recurso` del evento 2 | `ok: false`, `posicion: 1`, motivo «modificado» |
| A06 | Se borra el evento intermedio | `ok: false`, `posicion: 1`, motivo «falta un evento» |
| A07 | Tres eventos registrados sin esperar entre ellos | los tres quedan y la cadena verifica |
| A08 | Lectura | del más reciente al más antiguo; filtros por acción y por texto |
| A09 | CSV de 3 eventos | 1 línea de encabezado + 3 filas |
