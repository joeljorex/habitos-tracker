// Prueba de humo de carga: corta, para el hook de pre-commit y para la CI.
// 6 usuarios virtuales durante 10 s contra el panel. Falla si el p95 pasa de 5 s.
import http from 'k6/http';
import { check } from 'k6';

const BASE = (__ENV.BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');

export const options = {
  vus: 6,
  duration: '10s',
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'max'],
};

export default function () {
  const r = http.get(BASE + '/', { tags: { recurso: 'documento' } });
  check(r, {
    'responde 200': (x) => x.status === 200,
    'responde en menos de 5 s': (x) => x.timings.duration < 5000,
  });
}
