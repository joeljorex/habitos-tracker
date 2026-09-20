// Prueba de carga del panel web — Joel Armando Ibarra Rubalcava (JAI).
//
// Qué mide: la primera carga del panel, que es la petición más frecuente en producción. Pide el
// documento HTML y enseguida los tres archivos que el navegador descarga junto con él.
//
// Ejecutar en local:   k6 run tests/carga/jai-prueba.js
// Contra producción:   k6 run -e BASE_URL=https://joeljorex.github.io/habitos-tracker tests/carga/jai-prueba.js
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';
import { resumen } from './resumen.js';

const BASE = (__ENV.BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');

// Métricas propias, además de las que k6 recolecta por su cuenta.
const panelCompleto = new Trend('panel_completo', true);  // cuánto tarda la carga completa
const bytesPanel = new Counter('panel_bytes');            // cuánto se descarga en total
const panelOk = new Rate('panel_ok');                     // porcentaje de cargas sin errores
const pesoDocumento = new Gauge('documento_bytes');       // tamaño del HTML

export const options = {
  scenarios: {
    // Rampa hasta 10 usuarios virtuales: el doble de los 5 que pide la rúbrica.
    carga_panel: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '15s', target: 10 },
        { duration: '30s', target: 10 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<5000', 'p(99)<8000'],
    'http_req_duration{recurso:documento}': ['p(95)<5000'],
    'http_req_duration{recurso:script}': ['p(95)<5000'],
    'http_req_duration{recurso:estilos}': ['p(95)<5000'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
    panel_completo: ['p(95)<5000'],
    panel_ok: ['rate>0.99'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export default function () {
  const inicio = Date.now();
  let todoBien = true;

  group('Abrir el panel', () => {
    const doc = http.get(BASE + '/', { tags: { recurso: 'documento', endpoint: '/' } });
    todoBien = check(doc, {
      'el panel responde 200': (r) => r.status === 200,
      'trae el contenido del panel': (r) => r.body.indexOf('bitos') !== -1,
      'responde en menos de 5 s': (r) => r.timings.duration < 5000,
    }) && todoBien;
    bytesPanel.add(doc.body.length);
    pesoDocumento.add(doc.body.length);
  });

  group('Descargar los recursos del panel', () => {
    const respuestas = http.batch([
      { method: 'GET', url: BASE + '/src/app.js', params: { tags: { recurso: 'script', endpoint: '/src/app.js' } } },
      { method: 'GET', url: BASE + '/css/estilos.css', params: { tags: { recurso: 'estilos', endpoint: '/css/estilos.css' } } },
      { method: 'GET', url: BASE + '/vendor/driver.js/driver.js.iife.js', params: { tags: { recurso: 'script', endpoint: '/vendor/driver.js' } } },
    ]);
    respuestas.forEach((r) => {
      todoBien = check(r, { 'el recurso responde 200': (x) => x.status === 200 }) && todoBien;
      bytesPanel.add(r.body.length);
    });
  });

  panelCompleto.add(Date.now() - inicio);
  panelOk.add(todoBien);
  sleep(1); // pausa entre iteraciones, como haría una persona
}

export function handleSummary(data) {
  return resumen(data, {
    titulo: 'Prueba de carga del panel — JAI (Joel Armando Ibarra Rubalcava)',
    autor: 'Joel Armando Ibarra Rubalcava (@joeljorex)',
    base: 'tests/carga/resultados/jai-prueba',
  });
}
