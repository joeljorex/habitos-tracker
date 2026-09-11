# Quickstart: Guía interactiva

## Probar a mano

```bash
npm ci
npm run serve        # http://127.0.0.1:4173/
```

1. Abrir en una ventana privada (sin datos) e iniciar sesión con `demo@habitos.app` / `Habitos123`.
2. La guía aparece sola: "1 de N", resaltando el formulario (CP-11).
3. Recorrerla con **Siguiente** o con las flechas; terminar con **Listo**.
4. Recargar: no aparece (CP-12). Pulsar **Ver guía**: vuelve a empezar (CP-12).

## Pruebas automatizadas

```bash
npm run test:unit                                   # incluye resolverPasos
npx playwright test tests/e2e/tour.spec.js          # CP-11 y CP-12
```

## Actualizar driver.js

```bash
npm install --save-dev driver.js@<versión>
npm run vendor:driver                              # copia dist a web/vendor/driver.js/
npx playwright test tests/e2e/tour.spec.js          # confirmar que nada se rompió
```
