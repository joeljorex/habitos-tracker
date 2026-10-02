// Valida la configuración y las reglas de Prometheus sin levantar el stack (spec 005).
//
// Uso:  npm run monitoreo:validar
//
// Usa promtool dentro de la misma imagen que corre en infra/monitoreo/docker-compose.yml, así que
// no hace falta instalar nada aparte de Docker. Sale con código 1 si algo no cuadra, para que
// también sirva en la integración continua.
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const IMAGEN = 'prom/prometheus:v3.1.0';
const CARPETA = resolve(process.cwd(), 'infra/monitoreo/prometheus');

function promtool(...argumentos) {
  const docker = spawnSync(
    'docker',
    ['run', '--rm', '-v', `${CARPETA}:/etc/prometheus:ro`, '--entrypoint', 'promtool', IMAGEN, ...argumentos],
    { stdio: 'inherit' },
  );
  if (docker.error) {
    console.error(`No se pudo ejecutar Docker: ${docker.error.message}`);
    console.error('Instala Docker Desktop o valida la configuración en otra máquina.');
    process.exit(1);
  }
  return docker.status ?? 1;
}

const pasos = [
  { nombre: 'configuración', argumentos: ['check', 'config', '/etc/prometheus/prometheus.yml'] },
  { nombre: 'reglas de alerta', argumentos: ['check', 'rules', '/etc/prometheus/reglas.yml'] },
];

let fallos = 0;
for (const paso of pasos) {
  console.log(`\n── Revisando la ${paso.nombre} ──`);
  if (promtool(...paso.argumentos) !== 0) fallos += 1;
}

if (fallos > 0) {
  console.error(`\n${fallos} de ${pasos.length} revisiones fallaron.`);
  process.exit(1);
}
console.log('\nConfiguración y reglas de Prometheus válidas.');
