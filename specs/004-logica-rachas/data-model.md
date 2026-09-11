# Data Model: Rachas

## Racha (valor derivado, no persistido)

| Campo | Tipo | Regla |
|---|---|---|
| `actual` | entero ≥ 0 | FR-002 |
| `maxima` | entero ≥ `actual` | FR-003 |

**Entrada**: las fechas (`YYYY-MM-DD`) de los registros de un hábito (`habitos.v1.registros`
filtrados por `habitoId`) y la fecha de hoy.

## Relación con el modelo existente

```text
Hábito 1 ──── N Registro(fecha) ──(calcularRachas)──▶ Racha { actual, maxima }
```

## Correspondencia futura

- **API**: la racha se calcula al serializar el hábito (`GET /api/habits` incluye
  `streak: { current, longest }`); no se agrega columna.
- **App**: `RachaCalculator.calcular(fechas: List<LocalDate>, hoy: LocalDate)` en la capa de dominio.
