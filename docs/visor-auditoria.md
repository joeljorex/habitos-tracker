# Visor de auditoría

**Actividad 3.1 — módulo c)** · spec [`007-visor-auditoria`](../specs/007-visor-auditoria/)

Quién hizo qué, cuándo, sobre qué y con qué resultado — y cómo comprobar que ese registro no fue
alterado.

## 1. Diferencia con la bitácora

No son lo mismo y por eso son dos pestañas distintas:

| | Bitácora (trazabilidad) | Auditoría |
|---|---|---|
| **Para qué** | diagnosticar un problema técnico | responder quién hizo qué |
| **Quién la lee** | quien da soporte | responsable del producto, auditor |
| **Qué contiene** | todo lo que pasó, incluido lo irrelevante | solo acciones con valor de negocio |
| **Se puede alterar** | sí, es un registro técnico | se **detecta** si se altera |
| **Cuánto dura** | últimas 300 entradas | últimos 500 eventos |

## 2. Qué se audita

| Acción | Cuándo |
|---|---|
| `sesion.iniciada` | acceso aceptado |
| `sesion.rechazada` | acceso rechazado (resultado «Rechazado») |
| `sesion.cerrada` | la persona cierra sesión |
| `habito.creado` | intento de crear, aceptado o rechazado por validación |
| `habito.marcado` | el hábito pasa a hecho hoy |
| `habito.eliminado` | el hábito y su historial se borran |
| `auditoria.limpiada` | se reinicia la auditoría (el propio borrado queda auditado) |

Cada evento guarda: fecha, actor (el correo de la sesión, o `anonimo`), acción, recurso, detalle,
resultado y los dos hashes.

## 3. Cómo se detecta una alteración

Cada evento guarda el hash del anterior y su propio SHA-256, calculado sobre un texto canónico:

```text
fecha|actor|accion|recurso|resultado|JSON(detalle)|hashAnterior
```

Eso forma una cadena. Al pulsar **Verificar integridad**, el panel la recorre desde el primer evento
llevando el hash esperado:

- si el `hashAnterior` de un evento no es el que corresponde → **falta un evento o fueron
  reordenados**;
- si al recalcular el hash no coincide con el guardado → **el contenido de ese evento fue
  modificado**.

El resultado dice la posición y el identificador exactos:

```text
Cadena verificada: 4 eventos sin alteraciones.
Cadena alterada en el evento 2 de 4 (4b7f2c1a): el contenido del evento fue modificado.
```

### Alcance real

Los datos viven en el navegador de la persona, así que cualquiera con la consola abierta puede
editarlos. Lo que esta cadena garantiza es que **esa edición no pasa desapercibida**: detecta, no
impide. Decirlo de otra forma sería prometer algo falso. Para una auditoría inalterable de verdad
haría falta un servidor que guarde los eventos fuera del alcance de la persona auditada — y ese
servidor es, justamente, el siguiente paso natural del proyecto.

## 4. Detalles de implementación que importan

- **Las escrituras se encolan.** Calcular un SHA-256 es asíncrono; si dos acciones registran al
  mismo tiempo, ambas leerían la misma cola y una sobreescribiría a la otra, rompiendo la cadena. La
  cola vive dentro del módulo, así que quien llama no tiene que saber nada de esto.
- **El recorte está contemplado.** Al pasar de 500 eventos, el más antiguo que queda se marca como
  `inicioDeCadena`; si no, la verificación lo tomaría por una manipulación.
- **La escritura no bloquea la interfaz.** Si falla (por ejemplo, sin `crypto.subtle` en un contexto
  no seguro), queda constancia en la bitácora y el panel sigue funcionando.

## 5. Exportar y reiniciar

- **Exportar auditoría (CSV)**: encabezado y una fila por evento, con su hash, listo para abrir en
  una hoja de cálculo.
- **Archivar y reiniciar**: descarga el CSV primero y después vacía la cadena, dejando
  `auditoria.limpiada` como su primer eslabón. Nunca se borra sin dejar rastro.

## 6. Verificación

- 9 pruebas unitarias en `tests/unit/observabilidad-auditoria.test.mjs`, incluidas la detección de
  contenido modificado (A05), la de evento borrado (A06) y la de escrituras concurrentes (A07).
- 2 pruebas end-to-end: una verifica una cadena intacta y la otra **manipula el almacenamiento desde
  el navegador** y comprueba que el panel lo detecta.

Evidencia: `docs/evidencia/visor-auditoria.png` (verificada) y
`docs/evidencia/visor-auditoria-alterada.png` (manipulación detectada).
