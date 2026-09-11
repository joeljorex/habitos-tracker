// Configuración de Playwright para el panel web (spec 001, contrato con la CI de la spec 003).
//
// - Sin BASE_URL: levanta `scripts/serve.mjs` (SERVE_DIR, PORT) y prueba contra él.
// - Con BASE_URL: prueba contra esa URL (staging o producción) y no levanta servidor.
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 4173);
const SERVE_DIR = process.env.SERVE_DIR ?? 'web';
const BASE_URL = process.env.BASE_URL;
const EN_CI = Boolean(process.env.CI);

// Las pruebas navegan con rutas relativas (`page.goto('./')`); sin la barra final,
// `./` resolvería a la carpeta padre de la subruta (p. ej. /habitos-tracker).
const conBarraFinal = (url) => (url.endsWith('/') ? url : `${url}/`);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: EN_CI,
  retries: EN_CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: conBarraFinal(BASE_URL ?? `http://127.0.0.1:${PORT}/`),
    locale: 'es-MX',
    timezoneId: 'America/Hermosillo',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'movil', use: { ...devices['Pixel 7'] } },
  ],
  webServer: BASE_URL
    ? undefined
    : {
        command: 'node scripts/serve.mjs',
        url: `http://127.0.0.1:${PORT}/`,
        env: { SERVE_DIR, PORT: String(PORT) },
        reuseExistingServer: !EN_CI,
        timeout: 30_000,
      },
});
