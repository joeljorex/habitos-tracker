// Resumen compartido por las pruebas de carga (Actividad 1.2).
// Imprime en pantalla TODAS las métricas que recolectó k6 y guarda el resultado en JSON y en
// Markdown, para poder comitearlo como evidencia.
//
// Nota: el motor de JavaScript de k6 no trae Intl, así que los números se formatean a mano.

/** Número con máximo dos decimales y separador de miles. */
function num(v) {
  if (v === undefined || v === null || v !== v) return '—';
  const redondeado = Math.round(v * 100) / 100;
  const partes = String(redondeado).split('.');
  const enteros = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return partes[1] ? enteros + '.' + partes[1] : enteros;
}

function ms(v) { return v === undefined ? '—' : num(v) + ' ms'; }

function bytes(v) {
  if (v === undefined) return '—';
  if (v > 1048576) return num(v / 1048576) + ' MB';
  if (v > 1024) return num(v / 1024) + ' kB';
  return num(v) + ' B';
}

/** Convierte los valores de una métrica en texto legible, según su tipo. */
export function valores(nombre, metrica) {
  const v = metrica.values || {};
  const esTiempo = metrica.contains === 'time';
  const esDatos = /^data_(sent|received)$/.test(nombre) || /bytes/.test(nombre);
  const fmt = esTiempo ? ms : (esDatos ? bytes : num);
  switch (metrica.type) {
    case 'trend':
      return ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max']
        .filter((k) => v[k] !== undefined)
        .map((k) => k + ' ' + fmt(v[k]))
        .join(' · ');
    case 'counter':
      return 'total ' + fmt(v.count) + ' · ' + num(v.rate) + '/s';
    case 'rate':
      // En k6, "passes" son las veces que la condición se cumplió y "fails" las que no; para
      // http_req_failed cumplirse significa que la petición falló, así que se muestra neutral.
      return num(v.rate * 100) + ' % (' + v.passes + ' de ' + (v.passes + v.fails) + ')';
    case 'gauge':
      return 'actual ' + fmt(v.value) + ' · min ' + fmt(v.min) + ' · max ' + fmt(v.max);
    default:
      return Object.keys(v).map((k) => k + ' ' + num(v[k])).join(' · ');
  }
}

function filas(data) {
  return Object.keys(data.metrics).sort().map((nombre) => {
    const m = data.metrics[nombre];
    const umbrales = m.thresholds
      ? Object.keys(m.thresholds).map((u) => u + ' ' + (m.thresholds[u].ok === false ? 'FALLÓ' : 'ok')).join(', ')
      : '';
    return { nombre: nombre, tipo: m.type, valores: valores(nombre, m), umbrales: umbrales };
  });
}

function objetivo() {
  return __ENV.BASE_URL || 'http://127.0.0.1:4173';
}

function texto(data, titulo) {
  const ancho = 78;
  const l = [];
  l.push('', '='.repeat(ancho), '  ' + titulo, '='.repeat(ancho));
  l.push('  Fecha:    ' + new Date().toISOString());
  l.push('  Objetivo: ' + objetivo());
  if (data.state) {
    l.push('  Duración: ' + num((data.state.testRunDurationMs || 0) / 1000) + ' s');
  }
  l.push('-'.repeat(ancho));
  filas(data).forEach((f) => {
    l.push('  ' + f.nombre + '  (' + f.tipo + ')');
    l.push('      ' + f.valores + (f.umbrales ? '   [' + f.umbrales + ']' : ''));
  });
  l.push('='.repeat(ancho), '');
  return l.join('\n');
}

function markdown(data, titulo, autor) {
  const l = [];
  l.push('# ' + titulo, '');
  l.push('- **Integrante:** ' + autor);
  l.push('- **Fecha de ejecución:** ' + new Date().toISOString());
  l.push('- **Objetivo:** `' + objetivo() + '`');
  if (data.state) {
    l.push('- **Duración:** ' + num((data.state.testRunDurationMs || 0) / 1000) + ' s');
  }
  l.push('', '## Métricas', '', '| Métrica | Tipo | Valores | Umbral |', '|---|---|---|---|');
  filas(data).forEach((f) => {
    l.push('| `' + f.nombre + '` | ' + f.tipo + ' | ' + f.valores + ' | ' + (f.umbrales || '—') + ' |');
  });
  l.push('', '> Generado por k6 con `handleSummary`. El JSON con los datos crudos está junto a este archivo.', '');
  return l.join('\n');
}

/**
 * Arma lo que k6 espera en handleSummary: resumen en pantalla, JSON y Markdown.
 * @param {object} data resumen que entrega k6
 * @param {{titulo: string, autor: string, base: string}} opciones
 */
export function resumen(data, opciones) {
  const salida = {};
  salida.stdout = texto(data, opciones.titulo);
  salida[opciones.base + '.json'] = JSON.stringify(data, null, 2);
  salida[opciones.base + '.md'] = markdown(data, opciones.titulo, opciones.autor);
  return salida;
}
