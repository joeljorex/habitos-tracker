# Visor de trazabilidad

**Actividad 3.1 — módulo b)** · spec [`006-visor-trazabilidad`](../specs/006-visor-trazabilidad/)

Cómo seguir, paso a paso, lo que hizo el panel durante una operación.

## 1. El problema que resuelve

Una bitácora suelta dice «hábito creado». No dice qué pasos se ejecutaron, cuánto tardó cada uno ni
qué otras líneas pertenecen a esa misma operación. Este módulo agrega dos cosas:

- **Trazas**: una operación completa con sus pasos anidados y la duración de cada uno.
- **Correlación**: cada entrada de la bitácora guarda el identificador de la traza en curso.

## 2. Cómo se lee la pestaña

La pestaña **Trazabilidad** del visor tiene dos mitades:

| Izquierda: trazas | Derecha: bitácora |
|---|---|
| una tarjeta por operación, de la más reciente a la más antigua | una fila por registro |
| nombre, hora, duración, estado, número de pasos e identificador | hora, nivel, mensaje, contexto y traza |
| debajo, los pasos con su sangría e indicando su duración | filtros por nivel y por texto |

Al pulsar una traza, la bitácora se filtra por su identificador y aparece el aviso «Bitácora
filtrada por la traza …». Para volver, «Ver toda la bitácora».

Ejemplo real de una creación de hábito:

```text
crear hábito                                   ok
18:51:37 · 0.4 ms · 3 pasos · id 0725bb1b
nombre=Leer 20 minutos
  └ leer hábitos                             0 ms
  └ validar nombre                         0.2 ms
  └ guardar hábitos                          0 ms
```

Y el registro correlacionado:

```text
18:51:37  Info  hábito creado                            0725bb1b
                nombre=Leer 20 minutos · id=95fa0f70-…
```

## 3. Qué está instrumentado

| Operación | Pasos |
|---|---|
| iniciar sesión | validar credenciales |
| cerrar sesión | — |
| crear hábito | leer hábitos · validar nombre · guardar hábitos |
| marcar hábito | leer registros · calcular registros · guardar registros |
| eliminar hábito | quitar hábito y su historial · guardar hábitos · guardar registros |

Dos detalles de diseño que importan:

1. **Los registros se escriben dentro de la traza.** Si se escribieran después, la traza ya habría
   cerrado y el registro quedaría sin correlación (la columna «Traza» mostraría un guion).
2. **La confirmación de borrado queda fuera de la traza.** El tiempo que la persona tarda en
   contestar el diálogo no es latencia del sistema; si se midiera, dispararía alarmas falsas.

## 4. Niveles de la bitácora

| Nivel | Cuándo se usa | Ejemplo |
|---|---|---|
| `depuracion` | detalle fino, normalmente apagado | — |
| `info` | algo salió como se esperaba | «hábito creado» |
| `aviso` | algo que la persona debe corregir | «hábito rechazado», «acceso rechazado» |
| `error` | algo que el sistema no pudo hacer | «el navegador no permitió guardar» |

Un nivel desconocido se guarda como `info`: es preferible una entrada mal clasificada a una entrada
perdida.

## 5. Límites y privacidad

- Se conservan las **últimas 300 entradas** y las **últimas 100 trazas**. El almacenamiento del
  navegador tiene unos 5 MB; sin límite, la aplicación acabaría fallando al guardar.
- Los registros guardan el correo de la cuenta y los nombres de los hábitos. **Nunca** guardan
  contraseñas.
- Todo vive en el navegador de la persona. No se envía nada a ningún servidor.
- Si el almacenamiento está bloqueado, registrar no lanza: el visor muestra las listas vacías y el
  panel sigue funcionando.

## 6. Exportar

El botón **Exportar bitácora (JSON)** descarga las entradas tal como están guardadas, con su
`trazaId` y su `spanId`, para analizarlas fuera del panel o adjuntarlas a un reporte de incidencia.

## 7. Verificación

- 14 pruebas unitarias en `tests/unit/observabilidad-bitacora.test.mjs` y
  `tests/unit/observabilidad-trazas.test.mjs` (casos T01–T13 del contrato).
- Prueba end-to-end en `tests/e2e/observabilidad.spec.js`: comprueba que el identificador de la
  traza aparece en el registro y que al elegir la traza la bitácora queda filtrada por ese mismo
  identificador.

Evidencia: `docs/evidencia/visor-trazabilidad.png`.
