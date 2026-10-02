# Justificación del uso de SDD para los módulos de observabilidad

**Actividad 3.1 — Monitoreo y liberación** · Hábitos Tracker · IDGS 10-2

Este documento explica **por qué** los tres módulos de esta actividad se desarrollaron con
*Spec-Driven Development* (SDD) usando GitHub Spec Kit, qué se produjo antes de escribir código y
qué se ganó con ello. Los artefactos están en [`specs/`](../specs/) y la planeación completa se
integró en un pull request propio antes de implementar nada.

## 1. Qué es SDD aquí, en concreto

En este proyecto SDD significa que, para cada módulo, **primero** existen cuatro documentos y
**después** el código:

| Artefacto | Pregunta que responde | Quién lo usa |
|---|---|---|
| `spec.md` | ¿Qué debe pasar y para quién? Historias de usuario, requisitos (FR) y criterios de éxito (SC) | todo el equipo y el docente |
| `plan.md` | ¿Con qué y por qué así? Contexto técnico, revisión contra la constitución y decisiones con alternativas descartadas | quien implementa |
| `tasks.md` | ¿En qué orden? Tareas numeradas, agrupadas por historia, con las pruebas antes que el código | quien implementa |
| `contracts/*.md` | ¿Cuál es el formato exacto? Nombres, campos, umbrales y casos de referencia | quien implementa **y** quien prueba |
| `checklists/requirements.md` | ¿La especificación está completa? | quien revisa el pull request |

Los módulos de esta actividad son:

| Spec | Módulo | Rama | Responsable |
|---|---|---|---|
| [`005-metricas-monitoreo`](../specs/005-metricas-monitoreo/) | Métricas y alarmas de monitoreo | `feature/005-metricas-monitoreo` | Jorge Humberto Martínez Delgado (JHM) |
| [`006-visor-trazabilidad`](../specs/006-visor-trazabilidad/) | Visor de trazabilidad (logs y trazas) | `feature/006-visor-trazabilidad` | Joel Armando Ibarra Rubalcava (JAI) |
| [`007-visor-auditoria`](../specs/007-visor-auditoria/) | Visor de auditoría | `feature/007-visor-auditoria` | Joel Armando Ibarra Rubalcava (JAI) |
| [`008-seguridad-dependencias`](../specs/008-seguridad-dependencias/) | Seguridad de dependencias (módulo extra) | `feature/008-seguridad-dependencias` | Jorge Humberto Martínez Delgado (JHM) |

## 2. Por qué SDD y no "programar y ya"

### 2.1 Porque el acuerdo tenía que ser numérico, no adjetivo

Un monitoreo se define con umbrales. Si el acuerdo del equipo es «avisar cuando esté lento», cada
quien implementa un número distinto y la alarma no significa nada. El contrato de la spec 005 obliga
a escribirlos: aviso en 500 ms, alarma en 1 000 ms, latencia del sitio en 5 s, disponibilidad
objetivo 99 %. Esos mismos números viajan a tres lugares —`alarmas.js`, `reglas.yml` y
`docs/niveles-de-servicio.md`— y se pueden revisar de un vistazo porque están escritos en una tabla
antes del código.

### 2.2 Porque el formato de los datos se iba a reutilizar

El panel web no es el único cliente del proyecto: existen la app Android y la API. Los contratos de
las specs 006 y 007 fijan el formato de una entrada de bitácora, de una traza y —sobre todo— **el
texto canónico con el que se calcula el hash de auditoría**. Sin ese contrato escrito, dos
implementaciones del mismo registro producirían hashes distintos y la auditoría no se podría
verificar entre clientes. Esto no se descubre programando: se descubre al especificar.

### 2.3 Porque los casos difíciles aparecen al escribirlos, no al probarlos

Al redactar las secciones *Edge Cases* salieron solos los casos que de otro modo se habrían colado:

- ¿Qué pasa con una traza que nunca se cierra? → se guarda como `incompleta`.
- ¿Qué pasa si se piden dos eventos de auditoría a la vez, si el hash es asíncrono? → hay que
  encolar; si no, se pierde un evento y la cadena se rompe. *(Esto apareció en la spec y se resolvió
  en el módulo, no en una corrección de último minuto.)*
- ¿Qué pasa cuando la auditoría llega a 500 eventos? → el primero que queda se marca como inicio de
  cadena, o la verificación lo confundiría con una manipulación.
- ¿Qué pasa con menos de 4 intentos de acceso? → la regla no opina, para que un error de dedo no
  dispare una alarma.

### 2.4 Porque obliga a escribir las pruebas primero

`tasks.md` pone la tarea de pruebas antes que la de implementación en las tres specs (T004 antes de
T005, T003 antes de T004, T007 antes de T008). El resultado medible: **39 pruebas unitarias nuevas**
y **7 pruebas end-to-end nuevas** (que corren en los dos proyectos de Playwright, escritorio y
móvil), todas derivadas de los casos de referencia del contrato, no inventadas después para
"cubrir" lo que ya estaba escrito.

### 2.5 Porque deja la decisión explicada, no solo tomada

Cada `plan.md` incluye una tabla de decisiones con sus alternativas descartadas y el motivo:
Prometheus frente a Nagios, Zabbix y Datadog; trazas propias frente a OpenTelemetry; OSV-Scanner
frente a Snyk. Dentro de seis meses, quien lea el repositorio sabrá *por qué* y no tendrá que
repetir el análisis.

### 2.6 Porque el revisor tiene con qué comparar

El `checklist` de cada spec convierte la revisión del pull request en algo verificable: no es «se ve
bien», es «CHK002: los umbrales están escritos como números — sí, contrato §2».

## 3. Qué se produjo antes del código

El pull request de planeación general reúne los artefactos de los cuatro módulos **sin una sola
línea de implementación**: 4 `spec.md`, 4 `plan.md`, 4 `tasks.md`, 3 contratos y 4 listas de
revisión. Recién después se abrieron las ramas de implementación, una por módulo, cada una
cumpliendo las tareas de su `tasks.md`.

```text
specs/
├── 005-metricas-monitoreo/     spec.md · plan.md · tasks.md · contracts/ · checklists/
├── 006-visor-trazabilidad/     spec.md · plan.md · tasks.md · contracts/ · checklists/
├── 007-visor-auditoria/        spec.md · plan.md · tasks.md · contracts/ · checklists/
└── 008-seguridad-dependencias/ spec.md · plan.md · tasks.md · checklists/
```

## 4. Qué costó

Ser honestos también es parte del informe: escribir las specs tomó alrededor de un tercio del tiempo
total de la actividad. Lo que se recuperó fue en implementación —no hubo que rehacer nada— y en
revisión. Para un módulo de tres líneas, SDD no vale la pena; para un módulo con un formato que
otros clientes tienen que respetar y con umbrales que definen cuándo suena una alarma, sí.

## 5. Continuidad con las actividades anteriores

Esta actividad continúa el mismo método de las specs 001 a 004 (panel web, guía, infraestructura de
CI/CD y lógica de rachas), descrito en [`docs/sdd-proposal.md`](sdd-proposal.md) y
[`docs/sdd-implementation.md`](sdd-implementation.md). La numeración de las specs, el formato de las
ramas (`feature/<número>-<nombre>`) y el flujo de pull requests hacia `develop` son los mismos desde
la primera unidad.
