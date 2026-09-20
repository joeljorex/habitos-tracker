# Prueba de carga del panel — JHM (Jorge Humberto Martínez Delgado)

- **Integrante:** Jorge Humberto Martínez Delgado (@JMartinez-D)
- **Fecha de ejecución:** 2026-09-20T22:05:28.710Z
- **Objetivo:** `https://joeljorex.github.io/habitos-tracker`
- **Duración:** 46.1 s

## Métricas

| Métrica | Tipo | Valores | Umbral |
|---|---|---|---|
| `checks` | rate | 100 % (2700 de 2700) | rate>0.99 ok |
| `data_received` | counter | total 13.16 MB · 299 290.69/s | — |
| `data_sent` | counter | total 139.21 kB · 3 092.46/s | — |
| `dropped_iterations` | counter | total 1 · 0.02/s | — |
| `estilos_bytes` | gauge | actual 15.66 kB · min 15.66 kB · max 15.66 kB | — |
| `estilos_duracion` | trend | avg 31.41 ms · min 23.64 ms · med 28.76 ms · p(90) 40.14 ms · p(95) 44.32 ms · p(99) 58.1 ms · max 75.36 ms | p(95)<5000 ok |
| `http_req_blocked` | trend | avg 0.62 ms · min 0 ms · med 0 ms · p(90) 0 ms · p(95) 0 ms · p(99) 1.22 ms · max 96.69 ms | — |
| `http_req_connecting` | trend | avg 0.26 ms · min 0 ms · med 0 ms · p(90) 0 ms · p(95) 0 ms · p(99) 0 ms · max 43.42 ms | — |
| `http_req_duration` | trend | avg 29.36 ms · min 20.28 ms · med 26.95 ms · p(90) 38.22 ms · p(95) 43.57 ms · p(99) 68.89 ms · max 122.52 ms | p(95)<5000 ok, avg<2000 ok |
| `http_req_duration{expected_response:true}` | trend | avg 29.36 ms · min 20.28 ms · med 26.95 ms · p(90) 38.22 ms · p(95) 43.57 ms · p(99) 68.89 ms · max 122.52 ms | — |
| `http_req_duration{recurso:estilos}` | trend | avg 31.41 ms · min 23.64 ms · med 28.76 ms · p(90) 40.14 ms · p(95) 44.32 ms · p(99) 58.1 ms · max 75.36 ms | p(95)<5000 ok |
| `http_req_duration{recurso:rachas}` | trend | avg 29.99 ms · min 20.28 ms · med 27.82 ms · p(90) 38.3 ms · p(95) 46.52 ms · p(99) 72.98 ms · max 122.52 ms | p(95)<5000 ok |
| `http_req_failed` | rate | 0 % (0 de 1620) | rate<0.01 ok |
| `http_req_receiving` | trend | avg 1.52 ms · min 0 ms · med 0 ms · p(90) 4.72 ms · p(95) 10.81 ms · p(99) 17.85 ms · max 23.79 ms | — |
| `http_req_sending` | trend | avg 0.04 ms · min 0 ms · med 0 ms · p(90) 0 ms · p(95) 0.51 ms · p(99) 0.7 ms · max 1.55 ms | — |
| `http_req_tls_handshaking` | trend | avg 0.35 ms · min 0 ms · med 0 ms · p(90) 0 ms · p(95) 0 ms · p(99) 0 ms · max 59.42 ms | — |
| `http_req_waiting` | trend | avg 27.8 ms · min 20.02 ms · med 25.41 ms · p(90) 35.32 ms · p(95) 41.6 ms · p(99) 68.89 ms · max 122.52 ms | — |
| `http_reqs` | counter | total 1 620 · 35.14/s | — |
| `iteration_duration` | trend | avg 1 090.65 ms · min 1 068.57 ms · med 1 085.31 ms · p(90) 1 107.14 ms · p(95) 1 136.71 ms · p(99) 1 185.87 ms · max 1 272.55 ms | p(95)<6000 ok |
| `iterations` | counter | total 540 · 11.71/s | — |
| `rachas_disponible` | rate | 100 % (540 de 540) | — |
| `rachas_peticiones` | counter | total 540 · 11.71/s | — |
| `vus` | gauge | actual 2 · min 2 · max 14 | — |
| `vus_max` | gauge | actual 16 · min 15 · max 16 | — |

> Generado por k6 con `handleSummary`. El JSON con los datos crudos está junto a este archivo.
