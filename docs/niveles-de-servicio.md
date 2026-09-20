# Niveles de servicio acordados

> Actividad 1.2 — CI/CD. Compromisos de servicio del equipo para Hábitos Tracker: qué se mide, qué
> valor se promete y qué pasa si no se cumple.

## 1. Las tres siglas, en corto

| Término | Qué es | Ejemplo en este proyecto |
|---|---|---|
| **SLI** (indicador) | el número que se mide | percentil 95 del tiempo de respuesta del panel |
| **SLO** (objetivo) | la meta interna sobre ese número | p95 por debajo de 5 s |
| **SLA** (acuerdo) | lo que se promete por fuera, con consecuencias | 99.5 % de disponibilidad mensual |

El equipo se pone objetivos (SLO) más estrictos que lo prometido (SLA), para tener margen de
reacción antes de incumplir.

## 2. Acuerdo de servicio

| # | Servicio | Indicador (SLI) | Objetivo (SLO) | Compromiso (SLA) | Cómo se mide |
|---|---|---|---|---|---|
| 1 | Panel web | disponibilidad mensual | 99.7 % | **99.5 %** | verificación posterior al despliegue + revisión semanal de la página publicada |
| 2 | Panel web | p95 del tiempo de respuesta | < 2 s | **< 5 s** | k6 en cada release (`tests/carga/`) |
| 3 | Panel web | tasa de peticiones con error | < 0.5 % | **< 1 %** | `http_req_failed` de k6 |
| 4 | API (cuando exista) | disponibilidad del endpoint `/api/health` | 99.5 % | **99 %** | job `verificar-produccion` del CD |
| 5 | API | p95 de respuesta | < 800 ms | **< 2 s** | k6 contra staging y producción |
| 6 | Pipeline | despliegue de `main` a producción | < 10 min | **< 20 min** | duración del workflow CD |
| 7 | Pipeline | pull requests que pasan la CI a la primera | > 80 % | — | histórico de Actions |
| 8 | Operación | tiempo de restablecimiento tras una falla (MTTR) | < 30 min | **< 2 h** | bitácora de incidentes |
| 9 | Calidad | quality gate de SonarQube en código nuevo | siempre en verde | — | `calidad.yml` y escaneo local |
| 10 | Calidad | cobertura de la lógica de dominio | > 90 % | **> 70 %** | `npm run test:cobertura` |

## 3. Ventanas y horarios

- **Horario de servicio del panel:** 24/7. Es un sitio estático en GitHub Pages, sin ventanas de
  mantenimiento programadas.
- **Ventana de despliegue:** cualquier día, evitando las dos horas previas a una entrega de la
  materia.
- **Horario de atención del equipo:** lunes a viernes, 9:00 a 20:00 (hora de Hermosillo). Fuera de
  ese horario, el compromiso de restablecimiento corre a partir del siguiente día hábil.

## 4. Presupuesto de error

Un SLA de 99.5 % mensual permite **3 horas con 39 minutos de caída al mes**. Ese es el presupuesto
de error, y se administra así:

| Consumo del presupuesto | Qué hace el equipo |
|---|---|
| menos del 50 % | ritmo normal: se siguen integrando funcionalidades |
| entre 50 % y 100 % | se congelan las funcionalidades nuevas; solo entran correcciones y pruebas |
| se agotó | se detiene la liberación, se documenta el incidente y se corrige la causa raíz antes de seguir |

## 5. Clasificación de incidentes

| Severidad | Qué significa | Respuesta | Restablecimiento |
|---|---|---|---|
| 1 — crítica | el panel no carga o la API está caída | inmediata, en horario de atención | < 2 h |
| 2 — alta | una función principal falla (no se pueden crear hábitos) | mismo día | < 8 h |
| 3 — media | una función secundaria falla (la guía no abre) | siguiente día hábil | < 3 días |
| 4 — baja | detalle visual o de texto | se agenda en el backlog | siguiente entrega |

## 6. Responsables

| Rol | Quién | Responsabilidad |
|---|---|---|
| Dueño del repositorio y de los releases | Joel Armando Ibarra Rubalcava (@joeljorex) | aprueba el despliegue a producción y atiende incidentes del panel |
| Infraestructura y pipeline | Jorge Humberto Martínez Delgado (@JMartinez-D) | mantiene los workflows, Terraform y el análisis estático |
| Revisión cruzada | ambos | ningún PR se integra sin la aprobación del otro |

## 7. Revisión del acuerdo

Los niveles se revisan al cierre de cada unidad. Si un objetivo se cumple con demasiado margen
durante dos unidades seguidas, se hace más estricto; si se incumple, se analiza si el problema es la
meta o el sistema antes de relajarla.

> Los valores de las columnas SLO y SLA son compromisos de un proyecto académico: no hay penalización
> económica, sino la obligación de detener la liberación y corregir antes de seguir agregando
> funcionalidades.
