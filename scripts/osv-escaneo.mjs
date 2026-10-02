// Busca vulnerabilidades conocidas en las dependencias, igual que el flujo de CI (spec 008).
//
// Uso:  npm run seguridad:dependencias
//
// Corre OSV-Scanner desde su imagen oficial, así que no hace falta instalarlo ni crear cuenta en
// ningún servicio. Deja el reporte en formato SARIF en docs/evidencia/osv-scanner.sarif.json y
// escribe un resumen legible en la terminal. Sale con código 1 si encuentra algo.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const IMAGEN = 'ghcr.io/google/osv-scanner:v2.6.0';
const RAIZ = process.cwd();
const SALIDA = 'docs/evidencia/osv-scanner.sarif.json';

mkdirSync(resolve(RAIZ, 'docs/evidencia'), { recursive: true });

console.log(`Analizando package-lock.json con ${IMAGEN}…`);
const escaneo = spawnSync(
  'docker',
  [
    'run',
    '--rm',
    '-v',
    `${RAIZ}:/proyecto`,
    IMAGEN,
    'scan',
    'source',
    '--lockfile=/proyecto/package-lock.json',
    '--format=sarif',
    `--output-file=/proyecto/${SALIDA}`,
  ],
  { stdio: 'inherit' },
);

if (escaneo.error) {
  console.error(`No se pudo ejecutar Docker: ${escaneo.error.message}`);
  process.exit(1);
}

let hallazgos = [];
try {
  const reporte = JSON.parse(readFileSync(resolve(RAIZ, SALIDA), 'utf8'));
  hallazgos = reporte.runs?.[0]?.results ?? [];
} catch {
  console.error(`No se pudo leer ${SALIDA}: revisa la salida del escaneo.`);
  process.exit(1);
}

console.log(`\nReporte guardado en ${SALIDA}`);
if (hallazgos.length === 0) {
  console.log('Sin vulnerabilidades conocidas en las dependencias.');
  process.exit(0);
}

console.log(`\n${hallazgos.length} hallazgo(s):`);
for (const hallazgo of hallazgos) {
  const id = hallazgo.ruleId ?? 'sin-id';
  const donde = hallazgo.locations?.[0]?.physicalLocation?.artifactLocation?.uri ?? 'package-lock.json';
  console.log(`  · ${id} — ${donde}`);
}
process.exit(1);
