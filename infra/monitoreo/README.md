# Stack de monitoreo del entorno de liberación

Prometheus + Alertmanager + Blackbox exporter + Grafana, todo en Docker y aprovisionado desde este
repositorio (Actividad 3.1, spec `005-metricas-monitoreo`). Levanta en una máquina limpia con un
solo comando y no requiere configurar nada a mano.

## Para qué sirve

El panel de Hábitos Tracker es una aplicación de navegador servida como sitio estático en GitHub
Pages: no hay un proceso propio que exponga `/metrics`. Por eso el monitoreo se divide en dos:

| Qué se mide | Quién lo mide | Dónde se ve |
| --- | --- | --- |
| Disponibilidad, latencia, código HTTP y certificado del entorno de liberación | Blackbox exporter, recolectado por Prometheus | Grafana y Alertmanager |
| Acciones de la persona: creación y marcado de hábitos, accesos rechazados, fallos al guardar, latencia de cada operación | El propio panel (`web/src/observabilidad/metricas.js`) | Pestaña **Métricas** del visor, exportable en formato Prometheus |

Los umbrales de las alertas (`prometheus/reglas.yml`) son los mismos que evalúa
`web/src/observabilidad/alarmas.js` y los que declara [`docs/niveles-de-servicio.md`](../../docs/niveles-de-servicio.md).

## Arrancar

```bash
npm run monitoreo:levantar     # docker compose up -d
npm run monitoreo:estado       # ver que los cuatro contenedores están arriba
```

| Servicio | URL | Para qué |
| --- | --- | --- |
| Grafana | <http://localhost:3001> | tablero «Hábitos Tracker · entorno de liberación» |
| Prometheus | <http://localhost:9090> | consultas y estado de los objetivos (*Status → Targets*) |
| Alertmanager | <http://localhost:9093> | alertas agrupadas |
| Blackbox | <http://localhost:9115> | sondas individuales |

Grafana entra sin contraseña (lectura anónima). Para editar: `admin` / `admin`.

Para monitorear además el panel local:

```bash
npm run serve                  # queda en http://localhost:4173
```

El objetivo `entorno="local"` del `prometheus.yml` apunta a `host.docker.internal:4173`; mientras no
esté corriendo, esa sonda aparece en rojo y la alerta `PanelCaido` se dispara a los 2 minutos — que
es justamente la forma más simple de demostrar que las alarmas funcionan.

## Apagar

```bash
npm run monitoreo:apagar                                            # conserva los datos
docker compose -f infra/monitoreo/docker-compose.yml down -v        # borra también los volúmenes
```

## Validar la configuración sin levantar nada

```bash
npm run monitoreo:validar
```

Corre `promtool check config` y `promtool check rules` dentro de la misma imagen de Prometheus. Es
lo que ejecuta el flujo [`monitoreo.yml`](../../.github/workflows/monitoreo.yml) en cada pull
request que toque esta carpeta, para que una regla mal escrita no llegue a `develop`.

## Qué hay en cada archivo

| Archivo | Contenido |
| --- | --- |
| `docker-compose.yml` | los cuatro servicios, puertos, volúmenes y healthchecks |
| `prometheus/prometheus.yml` | intervalos de recolección y los objetivos a sondear |
| `prometheus/reglas.yml` | alertas de disponibilidad, latencia y certificado |
| `alertmanager/alertmanager.yml` | agrupación, repetición e inhibición de alertas |
| `blackbox/blackbox.yml` | módulos de sonda HTTP (`http_2xx` y `http_panel`) |
| `grafana/provisioning/` | fuente de datos y carga automática de tableros |
| `grafana/tableros/habitos-tracker.json` | el tablero versionado |

## Cómo se comprueba que las alertas sirven

1. Levanta el stack y abre <http://localhost:9090/alerts>: todas deben estar en verde (*Inactive*).
2. Apaga el panel local (`Ctrl+C` en `npm run serve`).
3. A los 2 minutos `PanelCaido` pasa a *Firing* para `entorno="local"` y aparece en Alertmanager.
4. Vuelve a levantar el panel: la alerta se resuelve sola.

Las capturas de esa secuencia están en [`docs/evidencia/`](../../docs/evidencia/) y se explican en
[`docs/monitoreo-entorno.md`](../../docs/monitoreo-entorno.md).
