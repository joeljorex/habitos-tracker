# Prueba de carga del panel — JHM (Jorge Humberto Martínez Delgado)

- **Integrante:** Jorge Humberto Martínez Delgado (@JMartinez-D)
- **Fecha de ejecución:** 2026-09-21T03:53:32.623Z
- **Objetivo:** `http://127.0.0.1:4180`
- **Duración:** 45.92 s

## Métricas

| Métrica | Tipo | Valores | Umbral |
|---|---|---|---|
| `checks` | rate | 100 % (2700 de 2700) | rate>0.99 ok |
| `data_received` | counter | total 12.94 MB · 295 468.81/s | — |
| `data_sent` | counter | total 129.73 kB · 2 892.83/s | — |
| `estilos_bytes` | gauge | actual 15.66 kB · min 15.66 kB · max 15.66 kB | — |
| `estilos_duracion` | trend | avg 0.86 ms · min 0 ms · med 0.89 ms · p(90) 1.52 ms · p(95) 1.86 ms · p(99) 2.12 ms · max 3.31 ms | p(95)<5000 ok |
| `http_req_blocked` | trend | avg 0 ms · min 0 ms · med 0 ms · p(90) 0 ms · p(95) 0 ms · p(99) 0 ms · max 1.02 ms | — |
| `http_req_connecting` | trend | avg 0 ms · min 0 ms · med 0 ms · p(90) 0 ms · p(95) 0 ms · p(99) 0 ms · max 1.02 ms | — |
| `http_req_duration` | trend | avg 0.98 ms · min 0 ms · med 0.9 ms · p(90) 1.69 ms · p(95) 1.85 ms · p(99) 2.22 ms · max 13.17 ms | p(95)<5000 ok, avg<2000 ok |
| `http_req_duration{expected_response:true}` | trend | avg 0.98 ms · min 0 ms · med 0.9 ms · p(90) 1.69 ms · p(95) 1.85 ms · p(99) 2.22 ms · max 13.17 ms | — |
| `http_req_duration{recurso:estilos}` | trend | avg 0.86 ms · min 0 ms · med 0.89 ms · p(90) 1.52 ms · p(95) 1.86 ms · p(99) 2.12 ms · max 3.31 ms | p(95)<5000 ok |
| `http_req_duration{recurso:rachas}` | trend | avg 0.66 ms · min 0 ms · med 0.5 ms · p(90) 1.01 ms · p(95) 1.43 ms · p(99) 2.24 ms · max 13.17 ms | p(95)<5000 ok |
| `http_req_failed` | rate | 0 % (0 de 1620) | rate<0.01 ok |
| `http_req_receiving` | trend | avg 0.27 ms · min 0 ms · med 0 ms · p(90) 0.93 ms · p(95) 1 ms · p(99) 1.2 ms · max 4.28 ms | — |
| `http_req_sending` | trend | avg 0 ms · min 0 ms · med 0 ms · p(90) 0 ms · p(95) 0 ms · p(99) 0 ms · max 2.07 ms | — |
| `http_req_tls_handshaking` | trend | avg 0 ms · min 0 ms · med 0 ms · p(90) 0 ms · p(95) 0 ms · p(99) 0 ms · max 0 ms | — |
| `http_req_waiting` | trend | avg 0.7 ms · min 0 ms · med 0.53 ms · p(90) 1.18 ms · p(95) 1.52 ms · p(99) 2.03 ms · max 8.89 ms | — |
| `http_reqs` | counter | total 1 620 · 35.28/s | — |
| `iteration_duration` | trend | avg 1 003.46 ms · min 1 001.89 ms · med 1 003.41 ms · p(90) 1 003.93 ms · p(95) 1 004.13 ms · p(99) 1 004.9 ms · max 1 018.28 ms | p(95)<6000 ok |
| `iterations` | counter | total 540 · 11.76/s | — |
| `rachas_disponible` | rate | 100 % (540 de 540) | — |
| `rachas_peticiones` | counter | total 540 · 11.76/s | — |
| `vus` | gauge | actual 12 · min 12 · max 12 | — |
| `vus_max` | gauge | actual 15 · min 15 · max 15 | — |

> Generado por k6 con `handleSummary`. El JSON con los datos crudos está junto a este archivo.
