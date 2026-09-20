// Pruebas del servidor estático scripts/serve.mjs (spec 001, T002; contrato con la spec 003).
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SERVIDOR = fileURLToPath(new URL('../../scripts/serve.mjs', import.meta.url));
const SECRETO = 'ESTE ARCHIVO NO DEBE SERVIRSE';

let carpeta;
let proceso;
let base;

before(async () => {
  carpeta = await mkdtemp(join(tmpdir(), 'serve-'));
  const sitio = join(carpeta, 'sitio');
  await mkdir(join(sitio, 'sub'), { recursive: true });
  await writeFile(join(sitio, 'index.html'), '<!doctype html><title>Inicio</title>');
  await writeFile(join(sitio, 'app.js'), 'export {};');
  await writeFile(join(sitio, 'estilos.css'), 'body {}');
  await writeFile(join(sitio, 'sub', 'index.html'), '<!doctype html><title>Sub</title>');
  await writeFile(join(carpeta, 'secreto.txt'), SECRETO);

  // PORT=0: el sistema asigna un puerto libre y el servidor lo anuncia en su salida.
  proceso = spawn(process.execPath, [SERVIDOR], {
    env: { ...process.env, SERVE_DIR: sitio, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  base = await new Promise((resolver, rechazar) => {
    let salida = '';
    proceso.stdout.on('data', (trozo) => {
      salida += trozo;
      const url = salida.match(/http:\/\/\S+\//);
      if (url) resolver(url[0]);
    });
    proceso.on('exit', (codigo) => rechazar(new Error(`el servidor terminó con código ${codigo}`)));
  });
});

after(async () => {
  proceso?.kill();
  await rm(carpeta, { recursive: true, force: true });
});

test('sirve index.html en la raíz con tipo text/html', async () => {
  const respuesta = await fetch(base);
  assert.equal(respuesta.status, 200);
  assert.match(respuesta.headers.get('content-type'), /^text\/html/);
  assert.match(await respuesta.text(), /<title>Inicio<\/title>/);
});

test('envía JavaScript y CSS con su tipo MIME', async () => {
  const js = await fetch(new URL('app.js', base));
  assert.equal(js.status, 200);
  assert.match(js.headers.get('content-type'), /^text\/javascript/);
  const css = await fetch(new URL('estilos.css', base));
  assert.equal(css.status, 200);
  assert.match(css.headers.get('content-type'), /^text\/css/);
});

test('responde 404 si el archivo no existe', async () => {
  const respuesta = await fetch(new URL('no-existe.html', base));
  assert.equal(respuesta.status, 404);
});

test('redirige un directorio sin barra final y sirve su index.html', async () => {
  const redireccion = await fetch(new URL('sub', base), { redirect: 'manual' });
  assert.equal(redireccion.status, 301);
  assert.equal(redireccion.headers.get('location'), '/sub/');
  const respuesta = await fetch(new URL('sub/', base));
  assert.equal(respuesta.status, 200);
  assert.match(await respuesta.text(), /<title>Sub<\/title>/);
});

test('bloquea rutas fuera de la carpeta servida (path traversal)', async () => {
  for (const ruta of ['..%2fsecreto.txt', '%2e%2e%2fsecreto.txt', '..%5csecreto.txt', 'sub/..%2f..%2fsecreto.txt']) {
    const respuesta = await fetch(base + ruta);
    assert.notEqual(respuesta.status, 200, `la ruta ${ruta} no debe responder 200`);
    assert.ok(!(await respuesta.text()).includes(SECRETO), `la ruta ${ruta} filtró el archivo`);
  }
});

test('solo acepta GET y HEAD', async () => {
  const cabeza = await fetch(base, { method: 'HEAD' });
  assert.equal(cabeza.status, 200);
  const envio = await fetch(base, { method: 'POST' });
  assert.equal(envio.status, 405);
});
