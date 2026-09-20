# Prueba de carga del panel — JAI (Joel Armando Ibarra Rubalcava)

- **Integrante:** Joel Armando Ibarra Rubalcava (@joeljorex)
- **Fecha de ejecución:** 2026-09-20T22:04:42.289Z
- **Objetivo:** `https://joeljorex.github.io/habitos-tracker`
- **Duración:** 55.95 s

## Métricas

| Métrica | Tipo | Valores | Umbral |
|---|---|---|---|
| `checks` | rate | 100 % (2322 de 2322) | rate>0.99 ok |
| `data_received` | counter | total 21.93 MB · 410 968.08/s | — |
| `data_sent` | counter | total 165.08 kB · 3 021.19/s | — |
| `documento_bytes` | gauge | actual 4.64 kB · min 4.64 kB · max 4.64 kB | — |
| `group_duration` | trend | avg 63.87 ms · min 21.01 ms · med 38.69 ms · p(90) 104.02 ms · p(95) 192.84 ms · p(99) 501.58 ms · max 715.71 ms | — |
| `http_req_blocked` | trend | avg 0.49 ms · min 0 ms · med 0 ms · p(90) 0 ms · p(95) 0 ms · p(99) 0 ms · max 163.79 ms | — |
| `http_req_connecting` | trend | avg 0.23 ms · min 0 ms · med 0 ms · p(90) 0 ms · p(95) 0 ms · p(99) 0 ms · max 110.51 ms | — |
| `http_req_duration` | trend | avg 60.8 ms · min 21.01 ms · med 38.84 ms · p(90) 97.09 ms · p(95) 162.77 ms · p(99) 493.16 ms · max 714.5 ms | p(95)<5000 ok, p(99)<8000 ok |
| `http_req_duration{expected_response:true}` | trend | avg 60.8 ms · min 21.01 ms · med 38.84 ms · p(90) 97.09 ms · p(95) 162.77 ms · p(99) 493.16 ms · max 714.5 ms | — |
| `http_req_duration{recurso:documento}` | trend | avg 48.81 ms · min 21.01 ms · med 26.64 ms · p(90) 59.42 ms · p(95) 180.75 ms · p(99) 496.01 ms · max 514.78 ms | p(95)<5000 ok |
| `http_req_duration{recurso:estilos}` | trend | avg 67.61 ms · min 24.56 ms · med 43.09 ms · p(90) 103.11 ms · p(95) 143.57 ms · p(99) 463.06 ms · max 714.5 ms | p(95)<5000 ok |
| `http_req_duration{recurso:script}` | trend | avg 63.4 ms · min 21.99 ms · med 42.41 ms · p(90) 100.32 ms · p(95) 149.54 ms · p(99) 471.49 ms · max 714.5 ms | p(95)<5000 ok |
| `http_req_failed` | rate | 0 % (0 de 1548) | rate<0.01 ok |
| `http_req_receiving` | trend | avg 13.14 ms · min 0 ms · med 3.6 ms · p(90) 26.23 ms · p(95) 42.15 ms · p(99) 214.45 ms · max 594.82 ms | — |
| `http_req_sending` | trend | avg 0.12 ms · min 0 ms · med 0 ms · p(90) 0.52 ms · p(95) 0.67 ms · p(99) 1 ms · max 2.17 ms | — |
| `http_req_tls_handshaking` | trend | avg 0.25 ms · min 0 ms · med 0 ms · p(90) 0 ms · p(95) 0 ms · p(99) 0 ms · max 58.88 ms | — |
| `http_req_waiting` | trend | avg 47.55 ms · min 20.29 ms · med 31.97 ms · p(90) 73.81 ms · p(95) 115.08 ms · p(99) 412.52 ms · max 674.94 ms | — |
| `http_reqs` | counter | total 1 548 · 27.67/s | — |
| `iteration_duration` | trend | avg 1 128.14 ms · min 1 051.04 ms · med 1 079.11 ms · p(90) 1 266.73 ms · p(95) 1 501.15 ms · p(99) 1 616.72 ms · max 1 746.32 ms | — |
| `iterations` | counter | total 387 · 6.92/s | — |
| `panel_bytes` | counter | total 20.72 MB · 388 310.95/s | — |
| `panel_completo` | trend | avg 127.78 ms · min 51 ms · med 79 ms · p(90) 266.4 ms · p(95) 500.6 ms · p(99) 616.42 ms · max 746 ms | p(95)<5000 ok |
| `panel_ok` | rate | 100 % (387 de 387) | rate>0.99 ok |
| `vus` | gauge | actual 1 · min 1 · max 10 | — |
| `vus_max` | gauge | actual 10 · min 10 · max 10 | — |

> Generado por k6 con `handleSummary`. El JSON con los datos crudos está junto a este archivo.
