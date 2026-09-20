// Prueba de carga del panel web — Jorge Humberto Martínez Delgado (JHM).
//
// Qué mide: carga sostenida a ritmo constante, que es el escenario que corre el pipeline: siempre
// el mismo número de peticiones por segundo, sin importar qué tan rápido responda el servidor.
// Revisa el panel, la hoja de estilos y el módulo de rachas del PR #10.
//
// Ejecutar en local:   k6 run tests/carga/jhm-prueba.js
// Contra producción:   k6 run -e BASE_URL=https://joeljorex.github.io/habitos-tracker tests/carga/jhm-prueba.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';
import { resumen } from './resumen.js';

const BASE = (__ENV.BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');

const duracionEstilos = new Trend('estilos_duracion', true);
const peticionesRachas = new Counter('rachas_peticiones');
const rachasDisponible = new Rate('rachas_disponible');
const pesoEstilos = new Gauge('estilos_bytes');

// El módulo de rachas llega con el PR #10. Mientras no esté integrado, el panel responde 404 y eso
// es un resultado válido para esta prueba: se mide, pero no cuenta como petición fallida.
const RACHAS_OK = http.expectedStatuses(200, 404);

export const options = {
  scenarios: {
    // Ritmo constante: 12 iteraciones por segundo durante 45 s. Cada iteración dura ~1 s, así que
    // k6 necesita alrededor de 13 usuarios virtuales activos, por encima de los 5 que pide la
    // rúbrica; se reservan 15 y puede llegar a 25 si el servidor se pone lento.
    ritmo_constante: {
      executor: 'constant-arrival-rate',
      rate: 12,
      timeUnit: '1s',
      duration: '45s',
      preAllocatedVUs: 15,
      maxVUs: 25,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<5000', 'avg<2000'],
    'http_req_duration{recurso:estilos}': ['p(95)<5000'],
    'http_req_duration{recurso:rachas}': ['p(95)<5000'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
    estilos_duracion: ['p(95)<5000'],
    iteration_duration: ['p(95)<6000'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export default function () {
  const panel = http.get(BASE + '/', { tags: { recurso: 'documento', endpoint: '/' } });
  check(panel, {
    'el panel responde 200': (r) => r.status === 200,
    'el panel responde en menos de 5 s': (r) => r.timings.duration < 5000,
  });

  const estilos = http.get(BASE + '/css/estilos.css', { tags: { recurso: 'estilos', endpoint: '/css/estilos.css' } });
  check(estilos, {
    'los estilos responden 200': (r) => r.status === 200,
    'los estilos traen contenido': (r) => r.body.length > 0,
  });
  duracionEstilos.add(estilos.timings.duration);
  pesoEstilos.add(estilos.body.length);

  const rachas = http.get(BASE + '/src/dominio/rachas.js', {
    tags: { recurso: 'rachas', endpoint: '/src/dominio/rachas.js' },
    responseCallback: RACHAS_OK,
  });
  peticionesRachas.add(1);
  rachasDisponible.add(rachas.status === 200);
  check(rachas, { 'el módulo de rachas contesta (200 o 404)': (r) => r.status === 200 || r.status === 404 });

  sleep(1); // pausa entre iteraciones, como haría una persona
}

export function handleSummary(data) {
  return resumen(data, {
    titulo: 'Prueba de carga del panel — JHM (Jorge Humberto Martínez Delgado)',
    autor: 'Jorge Humberto Martínez Delgado (@JMartinez-D)',
    base: 'tests/carga/resultados/jhm-prueba',
  });
}
