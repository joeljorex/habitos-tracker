# Plan de pruebas de carga con k6

> Actividad 1.2 — CI/CD. Plan de implementación: qué se mide, con qué herramienta, quién ejecuta
> cada prueba y cómo se conecta con el pipeline. La ejecución y sus resultados van en un PR aparte
> ([resultados-carga.md](./resultados-carga.md)).

## 1. Objetivo

Comprobar que el panel web de Hábitos Tracker sostiene la carga esperada del curso con un
**percentil 95 del tiempo de respuesta por debajo de 5 segundos** y **menos del 1 % de peticiones con
error**, y dejar ese límite escrito como código para que el pipeline lo verifique solo.

| Punto de la rúbrica | Cómo se cumple |
|---|---|
| Herramienta de carga | k6 v2.2.0 |
| Objetivo de rendimiento | `p(95) < 5000 ms` declarado como *threshold* en cada script |
| Usuarios virtuales | JAI llega a 10 VUs; JHM sostiene ~13 VUs activos (mínimo pedido: 5) |
| Una prueba por integrante | `tests/carga/jai-prueba.js` y `tests/carga/jhm-prueba.js` |
| Nomenclatura | iniciales del integrante + `-prueba.js` |
| Mayor cantidad de métricas | `handleSummary` imprime y guarda **todas** las métricas de la corrida |

## 2. Por qué k6 y no JMeter o Apache Benchmark

| Criterio | k6 | JMeter | Apache Benchmark (ab) |
|---|---|---|---|
| Cómo se escribe la prueba | JavaScript, vive en el repositorio | XML con interfaz gráfica | solo argumentos de línea de comandos |
| Umbrales que fallan el build | sí, `thresholds` nativos | requiere plugins | no |
| Salida para evidencia | JSON y Markdown desde el propio script | CSV/HTML | texto plano |
| Integración con CI/CD | acción oficial de GitHub | pesado (necesita Java) | trivial pero sin umbrales |
| Consumo de recursos | bajo (un binario en Go) | alto (JVM) | muy bajo |

El proyecto ya trabaja en JavaScript (panel, pruebas unitarias y Playwright), así que k6 no obliga al
equipo a aprender otro lenguaje ni a instalar Java, y los umbrales se versionan junto al código.

## 3. Instalación

### Windows (opción rápida, sin permisos de administrador)

```powershell
# Descarga el binario oficial y lo deja en una carpeta local
$url = (Invoke-RestMethod https://api.github.com/repos/grafana/k6/releases/latest).assets |
       Where-Object name -like '*windows-amd64.zip' | Select-Object -First 1 -ExpandProperty browser_download_url
Invoke-WebRequest $url -OutFile "$env:TEMP\k6.zip"
Expand-Archive "$env:TEMP\k6.zip" -DestinationPath "$env:LOCALAPPDATA\k6" -Force
$env:Path += ";$env:LOCALAPPDATA\k6\k6-v2.2.0-windows-amd64"
k6 version
```

### Windows (con gestor de paquetes)

```powershell
winget install --id k6.k6 -e
# o bien
choco install k6 -y
```

### Linux y macOS

```bash
# Debian/Ubuntu
sudo gpg -k && sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# macOS
brew install k6
```

### Sin instalar nada (Docker)

```bash
docker run --rm -i -v "$PWD:/src" -w /src grafana/k6 run tests/carga/jai-prueba.js
```

Comprobación: `k6 version` debe imprimir `k6.exe v2.2.0` o superior.

## 4. Endpoints que se prueban

Son los que pide el navegador en cada visita al panel, en orden de frecuencia:

| # | Endpoint | Qué es | Quién lo prueba |
|---|---|---|---|
| 1 | `GET /` | documento HTML del panel | los dos |
| 2 | `GET /src/app.js` | módulo principal del panel | JAI |
| 3 | `GET /css/estilos.css` | hoja de estilos | los dos |
| 4 | `GET /vendor/driver.js/driver.js.iife.js` | librería de la guía interactiva | JAI |
| 5 | `GET /src/dominio/rachas.js` | módulo de rachas (PR #10) | JHM |

El panel es una aplicación estática: hoy no hay endpoints de API. Cuando exista la API en Laravel
(spec 005), se agregan `POST /auth`, `GET /habits` y `POST /habits/{id}/logs` al mismo plan.

## 5. Reparto por integrante

| Integrante | Script | Escenario | Carga | Qué demuestra |
|---|---|---|---|---|
| Joel Armando Ibarra Rubalcava (JAI) | `tests/carga/jai-prueba.js` | `ramping-vus` | 1 → 10 VUs en 55 s | primera carga completa del panel: documento más sus tres recursos, en una sola iteración agrupada |
| Jorge Humberto Martínez Delgado (JHM) | `tests/carga/jhm-prueba.js` | `constant-arrival-rate` | 12 iteraciones/s, ~13 VUs activos, 45 s | ritmo fijo de peticiones, sin importar la velocidad de respuesta; incluye el módulo de rachas |

Los dos escenarios son distintos a propósito: el de rampa muestra cómo se comporta el sistema
mientras sube la concurrencia, y el de ritmo constante muestra si aguanta una tasa fija de
peticiones, que es como se mide un servicio en producción.

## 6. Umbrales acordados

Se declaran dentro de cada script, en `options.thresholds`. Si alguno se cruza, k6 termina con
código 99 y el pipeline marca el trabajo como fallido.

| Umbral | Valor | Motivo |
|---|---|---|
| `http_req_duration p(95)` | < 5 000 ms | objetivo de la actividad |
| `http_req_duration p(99)` | < 8 000 ms | evita que la cola larga quede sin control |
| `http_req_failed` | < 1 % | disponibilidad acordada en los niveles de servicio |
| `checks` | > 99 % | el contenido devuelto debe ser correcto, no solo rápido |
| `iteration_duration p(95)` | < 6 000 ms | una visita completa no debe exceder el objetivo |

## 7. Cómo se ejecuta

```bash
# Con el panel levantado por el propio lanzador (recomendado)
npm run carga:smoke     # 6 VUs, 10 s  — es lo que corre el hook de pre-commit
npm run carga:jai       # prueba de Joel
npm run carga:jhm       # prueba de Jorge

# Directo con k6, contra un panel que ya esté corriendo
npm run serve                       # en otra terminal
k6 run tests/carga/jai-prueba.js

# Contra el entorno publicado
k6 run -e BASE_URL=https://joeljorex.github.io/habitos-tracker tests/carga/jai-prueba.js
```

`scripts/carga.mjs` levanta el panel en un puerto libre, espera a que responda, corre k6 y apaga el
servidor. Devuelve el mismo código de salida que k6.

## 8. Métricas que se recolectan

Cada corrida guarda **todas** las métricas en `tests/carga/resultados/`: un `.md` para leer y
comitear, y un `.json` con los datos crudos.

- **Tiempos** (`http_req_duration` y sus partes: `blocked`, `connecting`, `tls_handshaking`,
  `sending`, `waiting`, `receiving`), con avg, min, med, p90, p95, p99 y max.
- **Volumen**: `http_reqs`, `iterations`, `data_sent`, `data_received`.
- **Errores**: `http_req_failed`, `checks`.
- **Concurrencia**: `vus`, `vus_max`, `iteration_duration`.
- **Propias del proyecto**: `panel_completo`, `panel_bytes`, `panel_ok`, `documento_bytes`
  (JAI); `estilos_duracion`, `estilos_bytes`, `rachas_peticiones`, `rachas_disponible` (JHM).
- **Por endpoint**: todas las anteriores se pueden filtrar con las etiquetas `recurso` y `endpoint`.

## 9. Cuándo se usa dentro del CI/CD

| Momento | Qué corre | Dónde está configurado |
|---|---|---|
| Antes de cada commit (local) | prueba de humo, 6 VUs / 10 s | `.husky/pre-commit` |
| En cada Pull Request | prueba de humo en el runner | `.github/workflows/carga.yml` |
| Al integrar a `main` | las dos pruebas completas | `.github/workflows/carga.yml` |
| Manual, contra staging o producción | la que se elija, con `BASE_URL` | `workflow_dispatch` del mismo workflow |

El hook de pre-commit es **opcional**: si k6 no está instalado, avisa y deja pasar el commit. Para
saltarlo a propósito se usa `git commit --no-verify`, y la evidencia de ambos casos (con y sin el
hook) está en [resultados-carga.md](./resultados-carga.md).

## 10. Criterios de aceptación del plan

1. Cada integrante tiene su script, con su nombre en el archivo y en el resumen.
2. Las dos corridas terminan con código de salida 0, es decir, sin umbrales cruzados.
3. Los resultados quedan comiteados en Markdown y en JSON.
4. El pipeline corre al menos la prueba de humo en cada Pull Request.
5. Si un umbral se cruza, el PR no se integra hasta corregir el rendimiento o justificar el cambio.
