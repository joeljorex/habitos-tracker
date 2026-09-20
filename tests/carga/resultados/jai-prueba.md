# Prueba de carga del panel — JAI (Joel Armando Ibarra Rubalcava)

- **Integrante:** Joel Armando Ibarra Rubalcava (@joeljorex)
- **Fecha de ejecución:** 2026-09-20T21:23:42.202Z
- **Objetivo:** `http://127.0.0.1:4173`
- **Duración:** 55.57 s

## Métricas

| Métrica | Tipo | Valores | Umbral |
|---|---|---|---|
| `checks` | rate | 100 % (2580 de 2580) | rate>0.99 ok |
| `data_received` | counter | total 23.17 MB · 437 148/s | — |
| `data_sent` | counter | total 142.35 kB · 2 623.35/s | — |
| `documento_bytes` | gauge | actual 4.64 kB · min 4.64 kB · max 4.64 kB | — |
| `group_duration` | trend | avg 4.77 ms · min 2.77 ms · med 4.56 ms · p(90) 5.77 ms · p(95) 6.38 ms · p(99) 9.84 ms · max 22.13 ms | — |
| `http_req_blocked` | trend | avg 0.03 ms · min 0 ms · med 0 ms · p(90) 0 ms · p(95) 0 ms · p(99) 1.13 ms · max 3.38 ms | — |
| `http_req_connecting` | trend | avg 0.02 ms · min 0 ms · med 0 ms · p(90) 0 ms · p(95) 0 ms · p(99) 1.11 ms · max 3.38 ms | — |
| `http_req_duration` | trend | avg 3.29 ms · min 0.57 ms · med 3.23 ms · p(90) 4.57 ms · p(95) 4.88 ms · p(99) 6.39 ms · max 20.96 ms | p(95)<5000 ok, p(99)<8000 ok |
| `http_req_duration{expected_response:true}` | trend | avg 3.29 ms · min 0.57 ms · med 3.23 ms · p(90) 4.57 ms · p(95) 4.88 ms · p(99) 6.39 ms · max 20.96 ms | — |
| `http_req_duration{recurso:documento}` | trend | avg 4.28 ms · min 2.67 ms · med 4.17 ms · p(90) 4.86 ms · p(95) 5.3 ms · p(99) 7.53 ms · max 20.96 ms | p(95)<5000 ok |
| `http_req_duration{recurso:estilos}` | trend | avg 3.83 ms · min 1.63 ms · med 3.77 ms · p(90) 4.77 ms · p(95) 5.21 ms · p(99) 6.62 ms · max 10.58 ms | p(95)<5000 ok |
| `http_req_duration{recurso:script}` | trend | avg 2.52 ms · min 0.57 ms · med 2.39 ms · p(90) 3.31 ms · p(95) 3.86 ms · p(99) 5.12 ms · max 10.34 ms | p(95)<5000 ok |
| `http_req_failed` | rate | 0 % (0 de 1720) | rate<0.01 ok |
| `http_req_receiving` | trend | avg 0.35 ms · min 0 ms · med 0 ms · p(90) 0.93 ms · p(95) 1.03 ms · p(99) 1.52 ms · max 17.36 ms | — |
| `http_req_sending` | trend | avg 0.02 ms · min 0 ms · med 0 ms · p(90) 0 ms · p(95) 0 ms · p(99) 0.59 ms · max 1.85 ms | — |
| `http_req_tls_handshaking` | trend | avg 0 ms · min 0 ms · med 0 ms · p(90) 0 ms · p(95) 0 ms · p(99) 0 ms · max 0 ms | — |
| `http_req_waiting` | trend | avg 2.92 ms · min 0.55 ms · med 2.84 ms · p(90) 4.13 ms · p(95) 4.5 ms · p(99) 5.67 ms · max 10.07 ms | — |
| `http_reqs` | counter | total 1 720 · 30.95/s | — |
| `iteration_duration` | trend | avg 1 010.12 ms · min 1 007.23 ms · med 1 009.65 ms · p(90) 1 011.7 ms · p(95) 1 013.41 ms · p(99) 1 017.32 ms · max 1 027.7 ms | — |
| `iterations` | counter | total 430 · 7.74/s | — |
| `panel_bytes` | counter | total 22 MB · 415 116.49/s | — |
| `panel_completo` | trend | avg 9.6 ms · min 6 ms · med 9 ms · p(90) 11 ms · p(95) 13 ms · p(99) 16 ms · max 27 ms | p(95)<5000 ok |
| `panel_ok` | rate | 100 % (430 de 430) | rate>0.99 ok |
| `vus` | gauge | actual 1 · min 1 · max 10 | — |
| `vus_max` | gauge | actual 10 · min 10 · max 10 | — |

> Generado por k6 con `handleSummary`. El JSON con los datos crudos está junto a este archivo.
