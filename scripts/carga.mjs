#!/usr/bin/env node
// Lanzador de las pruebas de carga (Actividad 1.2).
//
// Levanta el panel en un puerto libre, espera a que responda, corre el script de k6 contra él y
// apaga el servidor al terminar. Devuelve el mismo código de salida que k6, así que sirve igual
// para el hook de pre-commit y para GitHub Actions.
//
// Uso:
//   node scripts/carga.mjs tests/carga/smoke.js
//   node scripts/carga.mjs tests/carga/jai-prueba.js --puerto 4180
//   K6_BIN=/ruta/a/k6.exe node scripts/carga.mjs tests/carga/jhm-prueba.js
//
// Variables de entorno:
//   K6_BIN    ruta al ejecutable de k6 (por defecto "k6", tomado del PATH)
//   BASE_URL  si se define, NO se levanta el panel y la prueba va contra esa dirección
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import process from 'node:process';

const argumentos = process.argv.slice(2);
const guion = argumentos.find((a) => !a.startsWith('--')) ?? 'tests/carga/smoke.js';
const indicePuerto = argumentos.indexOf('--puerto');
const puerto = indicePuerto === -1 ? 4180 : Number(argumentos[indicePuerto + 1]);
const k6 = process.env.K6_BIN || 'k6';
const externo = process.env.BASE_URL;

/** Espera a que el panel conteste, hasta 20 s. */
async function esperarPanel(url) {
  for (let intento = 0; intento < 100; intento++) {
    try {
      const respuesta = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (respuesta.ok) return true;
    } catch {
      // todavía no levanta
    }
    await new Promise((listo) => setTimeout(listo, 200));
  }
  return false;
}

async function main() {
  let servidor = null;
  let base = externo;

  if (!externo) {
    base = `http://127.0.0.1:${puerto}`;
    console.log(`[carga] levantando el panel en ${base}`);
    servidor = spawn(process.execPath, ['scripts/serve.mjs'], {
      env: { ...process.env, PORT: String(puerto), SERVE_DIR: 'web' },
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    servidor.stdout.on('data', (d) => process.stdout.write(`[panel] ${d}`));
    if (!(await esperarPanel(base))) {
      servidor.kill();
      console.error('[carga] el panel no respondió; se cancela la prueba');
      process.exit(1);
    }
  } else {
    console.log(`[carga] usando un entorno externo: ${base}`);
  }

  console.log(`[carga] ejecutando ${guion} con k6`);
  // Ojo con el shell de Windows: si la ruta del ejecutable trae espacios, la parte en el primer
  // espacio y la prueba nunca corre. Por eso, cuando K6_BIN es una ruta se ejecuta directo; el shell
  // solo se usa cuando es un simple "k6" que Windows tiene que resolver desde el PATH.
  const esRuta = /[\\/]/.test(k6);
  const prueba = spawn(k6, ['run', guion], {
    env: { ...process.env, BASE_URL: base },
    stdio: 'inherit',
    shell: !esRuta && process.platform === 'win32',
  });
  const [codigo] = await once(prueba, 'exit');

  if (servidor) {
    servidor.kill();
    console.log('[carga] panel apagado');
  }
  process.exit(codigo ?? 0);
}

main().catch((error) => {
  console.error('[carga] error inesperado:', error);
  process.exit(1);
});
