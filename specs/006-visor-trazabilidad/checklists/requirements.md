# Checklist de requisitos: Visor de trazabilidad

**Propósito**: revisar que la especificación esté completa y sin ambigüedades antes de implementar.

**Creado**: 2026-10-01

## Contenido

- [x] CHK001 El formato de entrada, traza y paso está definido campo por campo. *(contrato §1 y §2)*
- [x] CHK002 Está dicho qué pasa con una traza que no se cierra y con un paso sin traza. *(contrato §3)*
- [x] CHK003 Están definidos los límites de memoria y qué se descarta primero. *(FR-007)*
- [x] CHK004 Está definido el comportamiento con almacenamiento bloqueado y datos corruptos. *(spec, Edge Cases)*
- [x] CHK005 Se dice explícitamente qué datos personales se guardan y cuáles no. *(spec, Edge Cases)*

## Claridad

- [x] CHK006 «Correlacionar» está definido como una operación concreta: filtrar por `trazaId`. *(FR-003, FR-009)*
- [x] CHK007 Cada requisito es verificable con una prueba. *(contrato §4)*
- [x] CHK008 Los criterios de éxito son medibles. *(SC-001 a SC-004)*

## Consistencia

- [x] CHK009 Los niveles de la bitácora coinciden con los que muestra el visor.
- [x] CHK010 La correlación es un único mecanismo (`trazaId`), sin identificadores paralelos.
- [x] CHK011 El visor usa las mismas claves de almacenamiento que declara la spec 005.

## Cobertura

- [x] CHK012 Hay casos de referencia para error, traza incompleta y paso huérfano. *(T03, T04, T05)*
- [x] CHK013 Hay prueba end-to-end de la correlación completa.
- [x] CHK014 Hay evidencia gráfica del visor con datos reales.
