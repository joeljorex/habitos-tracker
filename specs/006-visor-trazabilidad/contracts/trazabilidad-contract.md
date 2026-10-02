# Contrato: bitácora y trazas

Formato de los datos de trazabilidad. Quien implemente lo mismo en la app Android o en la API debe
respetar estos campos para que un registro de un cliente se pueda leer con las mismas herramientas.

## 1. Entrada de bitácora

```json
{
  "id": "a1b2c3d4",
  "fecha": "2026-10-01T18:51:37.482Z",
  "nivel": "info",
  "mensaje": "hábito creado",
  "contexto": { "nombre": "Tomar agua", "id": "7a576054-16ac-4ba2-b324-b313687fb1a6" },
  "trazaId": "f25209e9",
  "spanId": "9c31bd"
}
```

| Campo | Regla |
|---|---|
| `id` | 8 caracteres hexadecimales |
| `fecha` | ISO 8601 en UTC |
| `nivel` | `depuracion` \| `info` \| `aviso` \| `error`; cualquier otro valor se guarda como `info` |
| `mensaje` | texto en minúscula, sin punto final, en presente o participio ("hábito creado") |
| `contexto` | objeto plano; nunca contraseñas |
| `trazaId` / `spanId` | identificador de la traza y el paso en curso, o `null` |

Máximo **300** entradas: al llegar al límite se descartan las más antiguas.

## 2. Traza

```json
{
  "id": "f25209e9",
  "nombre": "crear hábito",
  "atributos": { "nombre": "Tomar agua" },
  "fecha": "2026-10-01T18:51:37.480Z",
  "duracionMs": 0.4,
  "estado": "ok",
  "spans": [
    { "id": "9c31bd", "padreId": null, "nombre": "leer hábitos", "duracionMs": 0.0, "estado": "ok" },
    { "id": "4f8a12", "padreId": null, "nombre": "validar nombre", "duracionMs": 0.2, "estado": "ok" },
    { "id": "b7c0e3", "padreId": null, "nombre": "guardar hábitos", "duracionMs": 0.0, "estado": "ok" }
  ]
}
```

| Campo | Regla |
|---|---|
| `estado` de la traza | `ok` \| `error` \| `incompleta` |
| `estado` del paso | `ok` \| `error` \| `incompleto` \| `en curso` |
| `duracionMs` | milisegundos con dos decimales, medidos con reloj monótono |
| `padreId` | identificador del paso que lo contiene, o `null` si está al primer nivel |
| `error` | presente solo si el estado es `error`; es el mensaje de la excepción |

Máximo **100** trazas.

## 3. Reglas de comportamiento

1. Abrir una traza cuando ya hay otra abierta cierra la anterior como `incompleta`.
2. Cerrar una traza cierra sus pasos pendientes como `incompleto`.
3. `conTraza` y `conSpan` devuelven lo que devuelva la operación y **vuelven a lanzar** cualquier
   excepción, después de marcar el estado.
4. Un paso abierto sin traza activa no hace nada y no genera basura.
5. Registrar fuera de una traza es válido: `trazaId` queda en `null`.
6. Nada de esto puede lanzar hacia la aplicación: un fallo de almacenamiento se traga en silencio.

## 4. Casos de referencia (pruebas)

| ID | Caso | Resultado esperado |
|---|---|---|
| T01 | Traza completa | nombre, duración ≥ 0, estado `ok`, ninguna traza abierta al final |
| T02 | Pasos anidados (`validar` → `normalizar`) y uno hermano | `padreId` del anidado es el del padre; el hermano vuelve al primer nivel |
| T03 | Excepción dentro de un paso | traza y paso en `error`, excepción vuelve a lanzarse |
| T04 | Dos `iniciarTraza` seguidos | la primera queda `incompleta`, la segunda `ok` |
| T05 | Paso sin traza | no lanza y no guarda nada |
| T06 | 110 trazas | se conservan las últimas 100 |
| T07 | Registro dentro de una traza | `trazaId` igual al de la traza activa |
| T08 | Registro fuera de una traza | `trazaId` es `null` |
| T09 | Nivel desconocido | se guarda como `info` |
| T10 | Filtro por texto en el contexto (`QUOTA`) | devuelve esa entrada |
| T11 | 325 entradas | se conservan las últimas 300 |
| T12 | Entrada con forma inválida en el almacenamiento | se descarta al leer |
| T13 | `localStorage` que lanza | `registrar` no lanza; la lectura devuelve lista vacía |
