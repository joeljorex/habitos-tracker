# Checklist de requisitos: Visor de auditoría

**Propósito**: revisar que la especificación esté completa y sin ambigüedades antes de implementar.

**Creado**: 2026-10-01

## Contenido

- [x] CHK001 Está la lista cerrada de acciones auditadas. *(contrato §2)*
- [x] CHK002 El texto canónico del hash está escrito carácter por carácter. *(contrato §3)*
- [x] CHK003 El algoritmo de verificación está descrito paso a paso. *(contrato §4)*
- [x] CHK004 Está definido qué pasa al recortar por tamaño. *(FR-007, `inicioDeCadena`)*
- [x] CHK005 Está definido qué pasa si se piden varios eventos a la vez. *(FR-006)*

## Claridad

- [x] CHK006 El alcance real está dicho sin adornos: la cadena **detecta** alteraciones, no las impide. *(spec, Edge Cases)*
- [x] CHK007 Se declara qué datos se guardan y que nunca se guardan contraseñas. *(contrato §1)*
- [x] CHK008 Los criterios de éxito tienen número y unidad. *(SC-001 a SC-005)*

## Consistencia

- [x] CHK009 Los nombres de las acciones siguen el formato `sujeto.verbo`.
- [x] CHK010 El actor es siempre el correo de la sesión o `anonimo`, también en los eventos rechazados.
- [x] CHK011 El formato de exportación coincide con el que produce la implementación. *(contrato §5)*

## Cobertura

- [x] CHK012 Hay un caso de referencia para la alteración y otro para el borrado. *(A05, A06)*
- [x] CHK013 Hay prueba end-to-end que manipula el almacenamiento y comprueba la detección.
- [x] CHK014 Hay evidencia gráfica de los dos estados: verificada y alterada.
