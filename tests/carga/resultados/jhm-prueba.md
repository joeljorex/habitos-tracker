# Prueba de carga del panel — JHM (Jorge Humberto Martínez Delgado)

- **Integrante:** Jorge Humberto Martínez Delgado (@JMartinez-D)
- **Fecha de ejecución:** 2026-09-20T21:24:29.390Z
- **Objetivo:** `http://127.0.0.1:4173`
- **Duración:** 46.29 s

## Métricas

| Métrica | Tipo | Valores | Umbral |
|---|---|---|---|
| `checks` | rate | 100 % (2705 de 2705) | rate>0.99 ok |
| `data_received` | counter | total 10.97 MB · 248 513.31/s | — |
| `data_sent` | counter | total 129.97 kB · 2 874.74/s | — |
| `estilos_bytes` | gauge | actual 14.26 kB · min 14.26 kB · max 14.26 kB | — |
| `estilos_duracion` | trend | avg 3.46 ms · min 0.79 ms · med 3.44 ms · p(90) 4.24 ms · p(95) 4.53 ms · p(99) 5.18 ms · max 15.46 ms | p(95)<5000 ok |
| `http_req_blocked` | trend | avg 0.02 ms · min 0 ms · med 0 ms · p(90) 0 ms · p(95) 0 ms · p(99) 0.6 ms · max 2.81 ms | — |
| `http_req_connecting` | trend | avg 0.01 ms · min 0 ms · med 0 ms · p(90) 0 ms · p(95) 0 ms · p(99) 0 ms · max 2.24 ms | — |
| `http_req_duration` | trend | avg 2.82 ms · min 0 ms · med 3.3 ms · p(90) 4.29 ms · p(95) 4.53 ms · p(99) 5.24 ms · max 26.14 ms | avg<2000 ok, p(95)<5000 ok |
| `http_req_duration{expected_response:true}` | trend | avg 2.82 ms · min 0 ms · med 3.3 ms · p(90) 4.29 ms · p(95) 4.53 ms · p(99) 5.24 ms · max 26.14 ms | — |
| `http_req_duration{recurso:estilos}` | trend | avg 3.46 ms · min 0.79 ms · med 3.44 ms · p(90) 4.24 ms · p(95) 4.53 ms · p(99) 5.18 ms · max 15.46 ms | p(95)<5000 ok |
| `http_req_duration{recurso:rachas}` | trend | avg 0.96 ms · min 0 ms · med 1.02 ms · p(90) 1.45 ms · p(95) 1.64 ms · p(99) 2.13 ms · max 2.65 ms | p(95)<5000 ok |
| `http_req_failed` | rate | 0 % (0 de 1623) | rate<0.01 ok |
| `http_req_receiving` | trend | avg 0.32 ms · min 0 ms · med 0 ms · p(90) 0.92 ms · p(95) 1.03 ms · p(99) 1.53 ms · max 2.28 ms | — |
| `http_req_sending` | trend | avg 0.02 ms · min 0 ms · med 0 ms · p(90) 0 ms · p(95) 0 ms · p(99) 0.6 ms · max 1.54 ms | — |
| `http_req_tls_handshaking` | trend | avg 0 ms · min 0 ms · med 0 ms · p(90) 0 ms · p(95) 0 ms · p(99) 0 ms · max 0 ms | — |
| `http_req_waiting` | trend | avg 2.48 ms · min 0 ms · med 2.87 ms · p(90) 3.94 ms · p(95) 4.2 ms · p(99) 5.11 ms · max 26.14 ms | — |
| `http_reqs` | counter | total 1 623 · 35.06/s | — |
| `iteration_duration` | trend | avg 1 009.77 ms · min 1 006.88 ms · med 1 009.49 ms · p(90) 1 010.98 ms · p(95) 1 011.83 ms · p(99) 1 017.84 ms · max 1 032.54 ms | p(95)<6000 ok |
| `iterations` | counter | total 541 · 11.69/s | — |
| `rachas_disponible` | rate | 0 % (0 de 541) | — |
| `rachas_peticiones` | counter | total 541 · 11.69/s | — |
| `vus` | gauge | actual 1 · min 1 · max 12 | — |
| `vus_max` | gauge | actual 15 · min 15 · max 15 | — |

> Generado por k6 con `handleSummary`. El JSON con los datos crudos está junto a este archivo.
