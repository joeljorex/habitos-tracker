# Quickstart: Rachas

## Pruebas

```bash
npm run test:unit            # incluye los 13 casos V01–V13
npm run test:cobertura       # cobertura de web/src/dominio (meta ≥ 90 % en rachas.js)
npx playwright test tests/e2e/rachas.spec.js   # CP-04 y CP-13
```

## Probar a mano

1. `npm run serve` e iniciar sesión.
2. Crear "Leer 20 min" y pulsar **Marcar hoy** → "Racha: 1 día", "Mejor: 1 día".
3. Para simular días anteriores, en la consola del navegador:

```js
const r = JSON.parse(localStorage.getItem('habitos.v1.registros'));
const id = r[0].habitoId;
r.push({ habitoId: id, fecha: '2026-09-01' }, { habitoId: id, fecha: '2026-09-02' });
localStorage.setItem('habitos.v1.registros', JSON.stringify(r));
location.reload();
```

4. Recorrer la guía (**Ver guía**): aparece el paso "Tu racha" antes del último.
