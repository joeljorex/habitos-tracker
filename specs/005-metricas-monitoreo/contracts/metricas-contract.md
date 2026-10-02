# Contrato: métricas y reglas de alarma

Este contrato fija los nombres de las métricas, sus etiquetas y los umbrales. Quien implemente el
mismo monitoreo en otro cliente (la app Android o la API) debe usar exactamente estos nombres para
que los tableros y las alertas sirvan igual.

## 1. Métricas del panel

### 1.1 Contadores

| Nombre | Etiquetas | Cuándo aumenta |
|---|---|---|
| `habitos_acciones_total` | `accion` | cada operación de la interfaz (iniciar sesión, cerrar sesión, crear, marcar, eliminar) |
| `habitos_errores_total` | `origen` | la operación lanzó una excepción |
| `habitos_creados_total` | `resultado` = `exito` \| `rechazado` | intento de crear un hábito |
| `habitos_marcados_total` | — | un hábito se marcó como hecho hoy (solo si cambió el estado) |
| `habitos_eliminados_total` | — | un hábito se eliminó |
| `habitos_accesos_total` | `resultado` = `exito` \| `rechazado` | intento de inicio de sesión |
| `habitos_almacen_fallos_total` | `dato` = `habitos` \| `registros` | el navegador no permitió guardar |

### 1.2 Resúmenes de duración (milisegundos)

| Nombre | Etiquetas | Qué mide |
|---|---|---|
| `habitos_operacion_duracion_ms` | `operacion` | del inicio al fin de la operación, sin contar diálogos de confirmación |
| `habitos_render_duracion_ms` | — | repintado completo de la lista |

Cada resumen guarda `cuenta`, `suma`, `min`, `max` y `promedio`.

### 1.3 Forma de la clave

`nombre{etiqueta="valor",otra="valor"}` con las etiquetas **ordenadas alfabéticamente**. El mismo
conjunto de etiquetas debe producir la misma clave sin importar en qué orden se escriban.

### 1.4 Exposición en formato Prometheus

```text
# TYPE habitos_creados_total counter
habitos_creados_total{resultado="exito"} 2
# TYPE habitos_operacion_duracion_ms summary
habitos_operacion_duracion_ms_count{operacion="crear hábito"} 2
habitos_operacion_duracion_ms_sum{operacion="crear hábito"} 0.004
habitos_operacion_duracion_ms_max{operacion="crear hábito"} 0.0023
```

Las duraciones se exponen **en segundos** (se divide entre 1 000), como pide la convención de
Prometheus. Sin métricas, la exposición es una cadena vacía.

## 2. Reglas de alarma del panel

| id | Regla | Valor | Aviso | Alarma |
|---|---|---|---|---|
| `tasa-errores` | Tasa de error de las acciones | `habitos_errores_total / habitos_acciones_total` | ≥ 1 % | ≥ 5 % |
| `latencia-operaciones` | Latencia máxima de una operación | máximo de `habitos_operacion_duracion_ms` | ≥ 500 ms | ≥ 1 000 ms |
| `fallos-almacenamiento` | Fallos al guardar | `habitos_almacen_fallos_total` | — | ≥ 1 |
| `accesos-rechazados` | Accesos rechazados | rechazados / intentos, con 4 intentos o más | ≥ 50 % | ≥ 80 % |

Reglas de evaluación:

- Sin acciones registradas, la tasa de error es 0 % y el estado es «ok» (nunca 0/0).
- Con menos de 4 intentos de acceso, la regla de accesos siempre es «ok».
- El **estado general** es el peor estado de las cuatro reglas.

## 3. Alertas del entorno de liberación

| Alerta | Expresión | Espera | Severidad |
|---|---|---|---|
| `PanelCaido` | `probe_success{job="panel_http"} == 0` | 2 m | crítica |
| `RespuestaNoExitosa` | `probe_http_status_code{job="panel_http"} >= 400` | 5 m | crítica |
| `ObjetivoSinDatos` | `up{job=~"blackbox\|prometheus"} == 0` | 5 m | aviso |
| `LatenciaAlta` | `probe_duration_seconds{job="panel_http"} > 5` | 5 m | aviso |
| `LatenciaMuyAlta` | `probe_duration_seconds{job="panel_http"} > 10` | 2 m | crítica |
| `CertificadoPorVencer` | `probe_ssl_earliest_cert_expiry - time() < 15 días` | 30 m | aviso |

El umbral de 5 s de `LatenciaAlta` es el mismo objetivo de la prueba de carga de la Actividad 1.2
(p95 por debajo de 5 s) y el que declara `docs/niveles-de-servicio.md`.

## 4. Casos de referencia (pruebas)

| ID | Caso | Resultado esperado |
|---|---|---|
| M01 | Tres incrementos del mismo contador (1, 1, 3) | vale 5 |
| M02 | `{accion:"crear",resultado:"exito"}` y `{resultado:"exito",accion:"crear"}` | la misma serie, valor 2 |
| M03 | Duraciones 10 ms y 30 ms | cuenta 2, suma 40, min 10, max 30, promedio 20 |
| M04 | `observar` con `NaN` | se ignora, no crea serie |
| M05 | Exportar sin métricas | cadena vacía |
| M06 | 6 errores de 100 acciones | `tasa-errores` en «alarma», valor «6.0 %» |
| M07 | Operaciones de 40 ms y 1 200 ms | `latencia-operaciones` en «alarma», valor «1200 ms» |
| M08 | 1 fallo al guardar | `fallos-almacenamiento` en «alarma» |
| M09 | 2 accesos rechazados, 0 exitosos | «ok» (menos de 4 intentos) |
| M10 | 3 rechazados y 2 exitosos | «aviso» (60 %) |
| M11 | 5 rechazados y 0 exitosos | «alarma» (100 %) |
| M12 | Almacenamiento bloqueado | las métricas se leen vacías y no se lanza ninguna excepción |
