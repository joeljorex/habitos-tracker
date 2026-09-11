#!/usr/bin/env node
/**
 * Gate SDD — spec 003 (contracts/pipelines.md §1, job "SDD - Specs completas").
 *
 * Verifica que cada carpeta de specs/ contenga spec.md, plan.md y tasks.md
 * (constitución, principio I). Node puro, sin dependencias.
 *
 * Uso:
 *   node scripts/verificar-specs.mjs           # revisa ./specs (directorio actual = raíz del repo)
 *   node scripts/verificar-specs.mjs <raíz>    # revisa <raíz>/specs
 *
 * Códigos de salida:
 *   0 → todas las carpetas están completas, o no existe specs/ (se muestra un aviso).
 *   1 → falta al menos un archivo; se lista cada carpeta con su archivo faltante.
 */
import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ARCHIVOS_REQUERIDOS = ['spec.md', 'plan.md', 'tasks.md'];
const EN_GITHUB_ACTIONS = process.env.GITHUB_ACTIONS === 'true';

function esDirectorio(ruta) {
  try {
    return statSync(ruta).isDirectory();
  } catch {
    return false;
  }
}

function esArchivo(ruta) {
  try {
    return statSync(ruta).isFile();
  } catch {
    return false;
  }
}

function avisar(mensaje) {
  console.log(`Aviso: ${mensaje}`);
  if (EN_GITHUB_ACTIONS) console.log(`::warning title=SDD::${mensaje}`);
}

function main() {
  const raiz = resolve(process.argv[2] ?? '.');
  const dirSpecs = join(raiz, 'specs');

  if (!esDirectorio(dirSpecs)) {
    avisar(`no existe la carpeta specs/ en ${raiz}; no hay especificaciones que verificar.`);
    return 0;
  }

  const carpetas = readdirSync(dirSpecs, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory() && !entrada.name.startsWith('.'))
    .map((entrada) => entrada.name)
    .sort();

  if (carpetas.length === 0) {
    avisar('specs/ no contiene carpetas de features; no hay especificaciones que verificar.');
    return 0;
  }

  let incompletas = 0;
  for (const carpeta of carpetas) {
    const faltantes = ARCHIVOS_REQUERIDOS.filter(
      (archivo) => !esArchivo(join(dirSpecs, carpeta, archivo)),
    );

    if (faltantes.length === 0) {
      console.log(`OK     specs/${carpeta}/`);
      continue;
    }

    incompletas += 1;
    for (const archivo of faltantes) {
      console.log(`FALTA  specs/${carpeta}/${archivo}`);
      if (EN_GITHUB_ACTIONS) {
        console.log(`::error title=Spec incompleta::La carpeta specs/${carpeta}/ no tiene ${archivo}`);
      }
    }
  }

  const requeridos = `${ARCHIVOS_REQUERIDOS.slice(0, -1).join(', ')} y ${ARCHIVOS_REQUERIDOS.at(-1)}`;
  if (incompletas > 0) {
    console.error(
      `\nCarpetas incompletas: ${incompletas} de ${carpetas.length}. ` +
        `Cada carpeta de specs/ necesita ${requeridos}.`,
    );
    return 1;
  }

  console.log(`\nCarpetas revisadas: ${carpetas.length}. Todas tienen ${requeridos}.`);
  return 0;
}

process.exitCode = main();
