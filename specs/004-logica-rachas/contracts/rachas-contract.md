# Contrato: cálculo de rachas

## 1. Firma

```text
// web/src/dominio/rachas.js
calcularRachas(fechas: string[], hoy: string) -> { actual: number, maxima: number }
```

- `fechas`: fechas `YYYY-MM-DD` de los registros de **un** hábito (pueden venir repetidas y
  desordenadas).
- `hoy`: fecha `YYYY-MM-DD` del día actual (la calcula quien llama con `fechaLocal(new Date())`).
- Pura: no lee el reloj, el DOM ni el almacenamiento.

## 2. Casos de referencia (obligatorios en todos los clientes)

| # | Hoy | Fechas cumplidas | Actual | Mejor | Regla |
|---|---|---|---|---|---|
| V01 | 2026-09-10 | (ninguna) | 0 | 0 | FR-006 |
| V02 | 2026-09-10 | 09-10 | 1 | 1 | FR-002 |
| V03 | 2026-09-10 | 09-09 | 1 | 1 | FR-002: viva desde ayer |
| V04 | 2026-09-10 | 09-08 | 0 | 1 | FR-002: rota |
| V05 | 2026-09-10 | 09-08, 09-09, 09-10 | 3 | 3 | FR-002 |
| V06 | 2026-09-04 | 09-01, 09-02, 09-04 | 1 | 2 | CP-04 |
| V07 | 2026-09-10 | 09-10, 09-10, 09-09 | 2 | 2 | FR-004: duplicados |
| V08 | 2026-09-10 | 09-10, 09-11 | 1 | 1 | FR-005: futuro ignorado |
| V09 | 2028-03-01 | 2028-02-28, 2028-02-29, 2028-03-01 | 3 | 3 | FR-008: bisiesto |
| V10 | 2026-03-01 | 2026-02-28, 2026-03-01 | 2 | 2 | FR-008: año no bisiesto |
| V11 | 2027-01-01 | 2026-12-31, 2027-01-01 | 2 | 2 | FR-008: cambio de año |
| V12 | 2026-09-10 | 09-01 a 09-05, 09-09, 09-10 | 2 | 5 | FR-003: mejor histórica |
| V13 | 2026-09-10 | 09-10, 09-08, 09-09 | 3 | 3 | FR-007: desordenadas |

(Las fechas sin año son de 2026.)

## 3. Presentación en el panel

| Elemento | `data-testid` | Texto |
|---|---|---|
| Racha actual | `habit-streak-current` | `Racha: 0 días` · `Racha: 1 día` · `Racha: N días` |
| Mejor racha | `habit-streak-max` | `Mejor: 0 días` · `Mejor: 1 día` · `Mejor: N días` |

La racha actual del **primer** hábito lleva `data-tour="racha"`.

## 4. Paso de la guía

Se agrega con `agregarPaso(paso, { antesDe: 'ver-guia' })`:

| id | Ancla | Título | Descripción |
|---|---|---|---|
| `racha` | `[data-tour="racha"]` | `Tu racha` | `La racha cuenta los días seguidos que cumples el hábito. Si saltas un día vuelve a empezar, pero tu mejor racha se conserva.` |

Alternativa (sin hábitos): ancla `[data-tour="lista"]`, descripción
`Cada hábito mostrará su racha: los días seguidos que lo cumples y tu mejor marca.`
