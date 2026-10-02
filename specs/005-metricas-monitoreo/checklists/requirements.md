# Checklist de requisitos: Métricas y alarmas de monitoreo

**Propósito**: revisar que la especificación esté completa y sin ambigüedades antes de implementar.

**Creado**: 2026-10-01

## Contenido

- [x] CHK001 Cada métrica tiene nombre, etiquetas y momento exacto en que cambia. *(contrato §1)*
- [x] CHK002 Los umbrales están escritos como números, no como adjetivos ("lento", "mucho"). *(contrato §2 y §3)*
- [x] CHK003 Se distingue lo que mide una sonda externa de lo que solo puede medir el panel. *(spec US1 y US2)*
- [x] CHK004 Está definido qué pasa sin almacenamiento y con datos corruptos. *(spec, Edge Cases)*
- [x] CHK005 Está definido el comportamiento con cero acciones y con pocos intentos de acceso. *(spec, Edge Cases)*

## Claridad

- [x] CHK006 Cada requisito funcional es verificable con una prueba concreta. *(FR-001 a FR-012)*
- [x] CHK007 Los criterios de éxito tienen número y unidad. *(SC-001 a SC-005)*
- [x] CHK008 Los nombres de las métricas siguen la convención de Prometheus (`_total` para contadores, unidad en el nombre).

## Consistencia

- [x] CHK009 Los umbrales del panel y los de Prometheus coinciden. *(FR-008)*
- [x] CHK010 Los objetivos citados existen en `docs/niveles-de-servicio.md` (99 % de disponibilidad, p95 < 5 s).
- [x] CHK011 La alerta de latencia usa el mismo umbral que la prueba de carga de la Actividad 1.2.

## Cobertura

- [x] CHK012 Hay un caso de referencia por cada regla de alarma. *(contrato §4)*
- [x] CHK013 Hay prueba end-to-end para la alarma visible en el encabezado.
- [x] CHK014 La configuración del stack se valida automáticamente en la integración continua.
