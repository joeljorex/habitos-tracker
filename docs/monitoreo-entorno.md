# Monitoreo del entorno de liberación

**Actividad 3.1 — módulo a)** · spec [`005-metricas-monitoreo`](../specs/005-metricas-monitoreo/)

Qué se mide, con qué umbrales avisa y cómo se comprueba que las alarmas funcionan.

## 1. Las dos mitades del monitoreo

El panel de Hábitos Tracker es una aplicación de navegador servida como sitio estático en GitHub
Pages. No hay un proceso propio que exponga `/metrics`, así que el monitoreo tiene dos mitades que
se complementan:

| | Monitoreo del entorno | Monitoreo de la aplicación |
|---|---|---|
| **Quién mide** | Blackbox exporter, recolectado por Prometheus | el propio panel (`web/src/observabilidad/metricas.js`) |
| **Qué ve** | si el sitio responde, en cuánto tiempo, con qué código y con qué certificado | cuántos hábitos se crean y se marcan, cuánto tarda cada operación, cuántos accesos se rechazan, cuántos fallos al guardar |
| **Dónde se ve** | Grafana (<http://localhost:3001>) y Alertmanager (<http://localhost:9093>) | pestaña **Métricas** del visor, dentro del panel |
| **Dónde alerta** | reglas de Prometheus → Alertmanager | reglas de `alarmas.js` → tarjetas del visor y punto de color en el encabezado |

Ninguna de las dos sobra: una sonda externa nunca sabrá cuántos hábitos se crearon, y el panel nunca
sabrá que GitHub Pages dejó de responder.

## 2. Métricas de la aplicación

| Métrica | Tipo | Para qué sirve |
|---|---|---|
| `habitos_acciones_total{accion}` | contador | volumen de uso por tipo de acción |
| `habitos_errores_total{origen}` | contador | numerador de la tasa de error |
| `habitos_creados_total{resultado}` | contador | cuántos hábitos se crean y cuántos se rechazan por validación |
| `habitos_marcados_total` | contador | la acción que mide si la app cumple su propósito |
| `habitos_eliminados_total` | contador | abandono de hábitos |
| `habitos_accesos_total{resultado}` | contador | intentos de acceso aceptados y rechazados |
| `habitos_almacen_fallos_total{dato}` | contador | el navegador no pudo guardar: los datos se están perdiendo |
| `habitos_operacion_duracion_ms{operacion}` | resumen | latencia percibida de cada operación |
| `habitos_render_duracion_ms` | resumen | costo de repintar la lista |

Se acumulan en `localStorage` (`habitos.v1.metricas`) y se pueden exportar con el botón **Descargar
para Prometheus**, en el mismo formato de texto que recolectaría un servidor.

## 3. Alarmas del panel

| Regla | Valor que mira | Aviso | Alarma |
|---|---|---|---|
| Tasa de error de las acciones | errores / acciones | ≥ 1 % | ≥ 5 % |
| Latencia máxima de una operación | máximo observado | ≥ 500 ms | ≥ 1 000 ms |
| Fallos al guardar en el navegador | contador | — | ≥ 1 |
| Accesos rechazados | rechazados / intentos (desde 4 intentos) | ≥ 50 % | ≥ 80 % |

El **estado general** es el peor de las cuatro y se ve en el botón «Observabilidad» del encabezado
—verde, ámbar o rojo— aunque el visor esté cerrado.

> Por qué 4 intentos: con uno o dos, un error de dedo daría 100 % de rechazo. La regla espera a
> tener suficientes datos antes de opinar.

## 4. Alertas del entorno

| Alerta | Condición | Espera | Severidad |
|---|---|---|---|
| `PanelCaido` | la sonda HTTP falla | 2 min | crítica |
| `RespuestaNoExitosa` | código ≥ 400 | 5 min | crítica |
| `LatenciaAlta` | la sonda tarda más de 5 s | 5 min | aviso |
| `LatenciaMuyAlta` | más de 10 s | 2 min | crítica |
| `CertificadoPorVencer` | quedan menos de 15 días | 30 min | aviso |
| `ObjetivoSinDatos` | el propio monitoreo no responde | 5 min | aviso |

El umbral de 5 s es el mismo objetivo que la prueba de carga de la Actividad 1.2 (p95 por debajo de
5 s) y el que declara [`niveles-de-servicio.md`](niveles-de-servicio.md).

Alertmanager agrupa por alerta y entorno, repite lo crítico cada hora y **inhibe** las alertas de
latencia cuando ya hay una caída: si el panel no responde, avisar además de que responde lento solo
agrega ruido.

## 5. Lecturas reales del 1 de octubre de 2026

Medidas con el stack levantado contra el panel publicado y el panel local:

| Objetivo | `probe_success` | Latencia | Código HTTP | Certificado |
|---|---|---|---|---|
| `https://joeljorex.github.io/habitos-tracker/` | 1 | 0,921 s | 200 | 29,9 días |
| `http://localhost:4173/` | 1 | 0,008 s | 200 | — |

Las seis reglas de alerta quedaron en *Inactive* y las cuatro alarmas del panel en «Normal».

## 6. Comprobación de que las alarmas sirven

Una alarma que nunca se ha disparado no es evidencia de nada. El procedimiento ejecutado fue:

1. Stack levantado con los dos objetivos en verde.
2. Se detuvo el panel local (`npm run serve`).
3. A los 30 s la sonda pasó a 0; la regla pasó a *Pending*.
4. A los 2 min `PanelCaido` pasó a *Firing* con `entorno="local"` y `severidad="critica"`, y
   apareció agrupada en Alertmanager.
5. Se volvió a levantar el panel y la alerta se resolvió sola.

Evidencia: `docs/evidencia/monitoreo-prometheus-alerta.png` y
`docs/evidencia/monitoreo-alertmanager-alerta.png`.

## 7. Cómo levantarlo

```bash
npm run monitoreo:levantar     # Prometheus, Alertmanager, Blackbox y Grafana
npm run monitoreo:estado       # comprobar que los cuatro están arriba
npm run monitoreo:validar      # promtool: configuración y reglas, sin levantar nada
npm run monitoreo:apagar
```

El detalle de cada archivo está en [`infra/monitoreo/README.md`](../infra/monitoreo/README.md). La
configuración se valida sola en cada pull request con el flujo
[`monitoreo.yml`](../.github/workflows/monitoreo.yml), que además levanta el stack completo y
comprueba que la sonda y el tablero funcionan.
