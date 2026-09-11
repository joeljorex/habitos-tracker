// Copia driver.js desde node_modules a web/vendor/driver.js/ (spec 002, T001).
// Multiplataforma: usa solo la API de Node, sin `cp` ni `copy`.
//
// Uso: npm run vendor:driver
import { copyFile, mkdir, readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEN = join(RAIZ, 'node_modules', 'driver.js');
const DESTINO = join(RAIZ, 'web', 'vendor', 'driver.js');

// El paquete publica la licencia como "license" (minúsculas). Se busca sin distinguir
// mayúsculas porque Linux (la CI) sí las distingue, a diferencia de Windows.
async function archivoDeLicencia() {
  const nombre = (await readdir(ORIGEN)).find((archivo) => /^licen[cs]e(\.(md|txt))?$/i.test(archivo));
  if (!nombre) throw new Error('driver.js no incluye un archivo de licencia');
  return nombre;
}

try {
  const { version } = JSON.parse(await readFile(join(ORIGEN, 'package.json'), 'utf8'));
  const ARCHIVOS = [
    ['dist/driver.js.iife.js', 'driver.js.iife.js'],
    ['dist/driver.css', 'driver.css'],
    [await archivoDeLicencia(), 'LICENSE'],
  ];
  await mkdir(DESTINO, { recursive: true });
  for (const [desde, hacia] of ARCHIVOS) {
    await copyFile(join(ORIGEN, desde), join(DESTINO, hacia));
    console.log(`  ${desde} -> web/vendor/driver.js/${hacia}`);
  }
  console.log(`driver.js ${version} copiado a web/vendor/driver.js/`);
} catch (error) {
  console.error(`No se pudo copiar driver.js: ${error.message}`);
  console.error('¿Ejecutaste `npm ci` antes de `npm run vendor:driver`?');
  process.exitCode = 1;
}
