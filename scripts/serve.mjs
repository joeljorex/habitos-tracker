// Servidor estático sin dependencias para el panel web (spec 001, T002).
//
// Variables de entorno (contrato con la CI, spec 003):
//   SERVE_DIR  carpeta a servir (defecto: web)
//   PORT       puerto (defecto: 4173; 0 = el sistema elige uno libre)
//   HOST       interfaz (defecto: 127.0.0.1)
//
// Uso: npm run serve   |   SERVE_DIR=_site PORT=5000 node scripts/serve.mjs
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const HOST = process.env.HOST ?? '127.0.0.1';
const PUERTO = Number.parseInt(process.env.PORT ?? '4173', 10);
const RAIZ = resolve(process.env.SERVE_DIR ?? 'web');

const TIPOS_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

/** true si `ruta` es la carpeta `base` o está dentro de ella. */
function estaDentro(base, ruta) {
  const rel = relative(base, ruta);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function responderTexto(req, res, estado, texto, cabeceras = {}) {
  const cuerpo = Buffer.from(`${texto}\n`, 'utf8');
  res.writeHead(estado, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': cuerpo.length,
    'X-Content-Type-Options': 'nosniff',
    ...cabeceras,
  });
  res.end(req.method === 'HEAD' ? undefined : cuerpo);
}

async function statSeguro(ruta) {
  try {
    return await stat(ruta);
  } catch {
    return null;
  }
}

let raizReal;
try {
  raizReal = await realpath(RAIZ);
} catch {
  console.error(`La carpeta a servir no existe: ${RAIZ}`);
  process.exit(1);
}

const servidor = createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      responderTexto(req, res, 405, '405 · Método no permitido', { Allow: 'GET, HEAD' });
      return;
    }

    let url;
    let ruta;
    try {
      url = new URL(req.url ?? '/', 'http://localhost');
      ruta = decodeURIComponent(url.pathname);
    } catch {
      responderTexto(req, res, 400, '400 · Solicitud inválida');
      return;
    }
    if (ruta.includes('\0')) {
      responderTexto(req, res, 400, '400 · Solicitud inválida');
      return;
    }

    // Se resuelve SIEMPRE relativo a la raíz y se comprueba que no escape de ella
    // (cubre "..", "%2e%2e", "..%2f" y "..%5c" ya decodificados).
    let destino = resolve(raizReal, `.${ruta}`);
    if (!estaDentro(raizReal, destino)) {
      responderTexto(req, res, 403, '403 · Prohibido');
      return;
    }

    let info = await statSeguro(destino);
    if (info?.isDirectory()) {
      // Como GitHub Pages: /carpeta -> /carpeta/ para que las rutas relativas funcionen.
      if (!url.pathname.endsWith('/')) {
        res.writeHead(301, { Location: `${url.pathname}/${url.search}` });
        res.end();
        return;
      }
      destino = join(destino, 'index.html');
      info = await statSeguro(destino);
    }
    if (!info?.isFile()) {
      responderTexto(req, res, 404, '404 · No encontrado');
      return;
    }

    // Evita que un enlace simbólico dentro de la carpeta apunte fuera de ella.
    const real = await realpath(destino);
    if (!estaDentro(raizReal, real)) {
      responderTexto(req, res, 403, '403 · Prohibido');
      return;
    }

    res.writeHead(200, {
      'Content-Type': TIPOS_MIME[extname(real).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    createReadStream(real)
      .on('error', () => res.destroy())
      .pipe(res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) responderTexto(req, res, 500, '500 · Error interno');
    else res.destroy();
  }
});

servidor.on('error', (error) => {
  console.error(`No se pudo iniciar el servidor: ${error.message}`);
  process.exit(1);
});

servidor.listen(PUERTO, HOST, () => {
  const { port } = servidor.address();
  console.log(`Sirviendo ${raizReal} en http://${HOST}:${port}/`);
});

for (const senal of ['SIGINT', 'SIGTERM']) {
  process.on(senal, () => {
    servidor.close(() => process.exit(0));
    servidor.closeAllConnections();
  });
}
