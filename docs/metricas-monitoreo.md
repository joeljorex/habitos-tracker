# Métricas para el monitoreo de la aplicación

> Actividad 1.2 — CI/CD. Qué se observa de Hábitos Tracker, de dónde sale cada número, cada cuándo se
> revisa y qué se hace cuando se sale de rango. Los objetivos están en
> [niveles-de-servicio.md](./niveles-de-servicio.md).

## 1. Cómo se eligieron

Se usan dos marcos conocidos, cada uno donde tiene sentido:

- **RED** para los servicios que atienden peticiones (panel y API): *Rate* (peticiones por segundo),
  *Errors* (porcentaje con error) y *Duration* (tiempo de respuesta).
- **Core Web Vitals** para lo que percibe la persona en el navegador: qué tan rápido aparece el
  contenido y qué tan estable se ve.

A eso se suman las métricas del propio pipeline, porque en entrega continua la salud del proceso es
parte de la salud del producto.

## 2. Panel web (experiencia de la persona)

| Métrica | Qué indica | Fuente | Frecuencia | Alerta si |
|---|---|---|---|---|
| `http_req_duration` p95 | tiempo de respuesta | k6 | cada release y cada PR (humo) | > 5 s |
| `http_req_failed` | peticiones con error | k6 | cada release | > 1 % |
| `panel_completo` p95 | carga completa del panel, no una petición suelta | k6 (métrica propia) | cada release | > 5 s |
| Disponibilidad | que la página publicada responda 200 | job `verificar-produccion` del CD | cada despliegue | cualquier fallo |
| LCP (Largest Contentful Paint) | cuándo aparece el contenido principal | Lighthouse en el navegador | por release | > 2.5 s |
| CLS (Cumulative Layout Shift) | qué tanto “brinca” la interfaz | Lighthouse | por release | > 0.1 |
| Peso de la descarga | cuánto baja el navegador | `data_received` de k6 | cada release | crecimiento > 20 % entre releases |

## 3. API (se activa cuando exista su código)

| Métrica | Qué indica | Fuente | Alerta si |
|---|---|---|---|
| Peticiones por segundo | demanda real | logs de Railway | picos fuera de lo normal |
| Tasa de error 5xx | fallas del servidor | logs de Railway | > 1 % en 5 minutos |
| p95 de respuesta por endpoint | lentitud localizada | k6 y logs | > 2 s |
| Estado de `/api/health` | si el servicio está vivo | verificación del CD y del propio Railway | dos fallos seguidos |
| Conexiones a MySQL | agotamiento del pool | métricas de Railway | > 80 % del máximo |
| Duración de las migraciones | despliegues que se atoran | salida del job de despliegue | > 60 s |

## 4. App Android (se activa cuando exista su código)

| Métrica | Qué indica | Fuente | Alerta si |
|---|---|---|---|
| Tasa de sesiones sin fallos | estabilidad | Firebase Crashlytics | < 99 % |
| Fallos por versión | regresiones de una entrega | Crashlytics | cualquier fallo nuevo repetido |
| Tiempo de arranque | percepción de lentitud | Android Vitals | > 5 s en arranque en frío |

## 5. Pipeline y calidad

| Métrica | Qué indica | Fuente | Objetivo |
|---|---|---|---|
| Duración del CI | qué tan rápido se recibe la señal | Actions | < 5 min |
| Duración del CD (merge a producción) | tiempo de entrega | Actions | < 20 min |
| Porcentaje de ejecuciones en verde | estabilidad del proceso | Actions | > 80 % |
| Frecuencia de despliegue | ritmo de entrega (métrica DORA) | historial de `main` | al menos uno por unidad |
| Tiempo de restablecimiento | qué tan rápido se corrige (métrica DORA) | bitácora de incidentes | < 2 h |
| Bugs y vulnerabilidades | defectos detectados sin ejecutar el código | SonarQube | 0 en código nuevo |
| Deuda técnica | esfuerzo estimado para limpiar | SonarQube (`sqale_index`) | sin crecimiento sostenido |
| Cobertura de dominio | qué tanto prueban las pruebas | `npm run test:cobertura` | > 70 % |

## 6. Dónde se ven

| Herramienta | Qué muestra | Cómo se entra |
|---|---|---|
| GitHub Actions | resultado y duración de cada ejecución; artefactos con los reportes de k6 | pestaña **Actions** del repositorio |
| Artefacto `resultados-carga` | reportes `.md` y `.json` de cada corrida | Actions → ejecución → *Artifacts* (30 días) |
| SonarQube | bugs, vulnerabilidades, code smells, duplicación y cobertura | <http://localhost:9000> con el stack levantado |
| Railway | logs y consumo de la API | panel de Railway, ambiente `production` |
| Firebase Crashlytics | fallos de la app | consola de Firebase |
| Repositorio | historial de resultados comiteados | [`tests/carga/resultados/`](../tests/carga/resultados/) |

## 7. Rutina de revisión

| Cuándo | Qué se revisa | Quién |
|---|---|---|
| En cada PR | prueba de humo de carga y análisis estático | quien revisa el PR |
| En cada release | las dos pruebas de carga completas y la verificación de producción | Joel |
| Semanal | ejecuciones en rojo, duración del pipeline y deuda técnica nueva | ambos |
| Al cierre de la unidad | cumplimiento de los niveles de servicio y ajuste de objetivos | ambos |

## 8. Qué se hace cuando una métrica se sale de rango

1. **El pipeline avisa primero:** si un umbral de k6 o el quality gate fallan, el PR no se integra.
2. **Se reproduce en local** con el mismo script (`npm run carga:jai`, escaneo de SonarQube).
3. **Se decide:** corregir el código, o ajustar el umbral documentando por qué el nuevo valor es
   razonable.
4. **Se registra** en el historial de resultados, para poder comparar entre versiones.
