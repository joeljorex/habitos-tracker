# Research: Módulo de rachas

## R1. ¿Cuándo se rompe una racha?

- **Decisión**: la racha sigue viva mientras el día actual no termine; si ayer se cumplió y hoy
  todavía no, la racha actual cuenta hasta ayer.
- **Razón**: es el comportamiento que el usuario espera (apps como Duolingo o Habitica no ponen
  la racha en 0 a las 00:01); evita "castigar" antes de tiempo.
- **Alternativas**: romper a medianoche si hoy no está cumplido (desmotivante y confuso).

## R2. Aritmética de fechas

- **Decisión**: convertir `YYYY-MM-DD` a número de día con `Date.UTC(y, m - 1, d) / 86 400 000`
  y comparar enteros.
- **Razón**: los días en UTC siempre duran 24 h, así que el horario de verano y la zona horaria
  no alteran la resta; bisiestos y cambios de mes los resuelve `Date.UTC`.
- **Alternativas**: restar objetos `Date` locales (un día de 23 o 25 h rompe la cuenta), librerías
  como date-fns (dependencia innecesaria).

## R3. ¿Almacenar o calcular?

- **Decisión**: calcular siempre a partir de los registros.
- **Razón**: una sola fuente de verdad; guardar la racha obligaría a sincronizarla y a
  recalcularla cuando se editan registros.
- **Alternativas**: columnas `current_streak`/`longest_streak` en la API (se puede agregar como
  caché si el rendimiento lo exige).

## R4. Casos de referencia compartidos

- **Decisión**: tabla de 13 casos en `contracts/rachas-contract.md`, usada tal cual por las
  pruebas del panel y, después, por JUnit (app) y PHPUnit (API).
- **Razón**: garantiza SC-003 (0 diferencias entre clientes) sin depender de interpretaciones.
- **Alternativas**: cada cliente escribe sus propios casos (riesgo de divergencia).
