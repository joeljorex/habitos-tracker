# Quickstart: Panel web y suite end-to-end

## Prerrequisitos

Node 24 (o un Codespace del repositorio).

## Instalar y ejecutar las pruebas

```bash
npm ci
npx playwright install chromium        # en Linux/CI: --with-deps chromium
npm test                                # unitarias + e2e (escritorio y móvil)
npx playwright show-report              # abre el reporte HTML
```

**Resultado esperado**: todas las pruebas en verde; en el reporte cada prueba empieza con su ID
(`CP-01 …`, `CP-02 …`, `CP-05 …` a `CP-10 …`).

## Usar el panel

```bash
npm run serve                           # http://127.0.0.1:4173/
```

1. Entrar con `demo@habitos.app` / `Habitos123` (CP-10).
2. Intentar guardar un hábito vacío → mensaje de validación (CP-01).
3. Crear "Tomar agua", pulsar **Marcar hoy** dos veces → 1 día cumplido (CP-02).
4. Recargar → el hábito sigue ahí (CP-08). Eliminarlo y confirmar (CP-06).

## Smoke tests contra otra URL

```bash
npm run test:smoke                                   # levanta el servidor local
SERVE_DIR=_site npm run test:smoke                   # sirve otra carpeta (staging en CI)
BASE_URL=https://joeljorex.github.io/habitos-tracker/ npm run test:smoke   # producción
```

En PowerShell: `$env:BASE_URL="https://..."; npm run test:smoke`.
