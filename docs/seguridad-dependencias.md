# Seguridad de dependencias

**Actividad 3.1 — módulo extra** · spec [`008-seguridad-dependencias`](../specs/008-seguridad-dependencias/)

Análisis de vulnerabilidades conocidas y actualización automática de las dependencias.

## 1. Por qué OSV-Scanner y no Snyk

La actividad sugiere «un módulo adicional, como Snyk u otro». Se evaluaron los dos:

| | Snyk | **OSV-Scanner** (elegido) |
|---|---|---|
| Cuenta y token | obligatorios | no hace falta ninguna |
| Nivel gratuito | limitado por número de pruebas al mes | sin límite |
| Fuente de datos | base propia | [OSV.dev](https://osv.dev), que agrega los avisos de GitHub, npm, PyPI y distribuciones de Linux |
| Ejecución local | requiere iniciar sesión | `docker run` y listo |
| Salida | propia + SARIF | SARIF estándar |

Pesó sobre todo que **cualquiera del equipo pueda correr el mismo análisis en su máquina sin
registrarse en un servicio**: si Jorge y Joel tienen que compartir un token para revisar
dependencias, en la práctica solo lo corre quien tiene la cuenta. Como segunda opinión se conserva
`npm audit`, que ya viene con Node.

## 2. Qué se revisa y cada cuándo

| Qué | Herramienta | Cuándo |
|---|---|---|
| `package-lock.json` | OSV-Scanner | cada push y pull request a `main` y `develop`, lunes 08:15 y a petición |
| `package-lock.json` | `npm audit --audit-level=high` | en el mismo flujo |
| Dependencias de npm | Dependabot | semanal, pull request contra `develop`, parches agrupados |
| Acciones de los flujos | Dependabot | semanal |
| Imágenes de `infra/monitoreo` e `infra/sonarqube` | Dependabot | mensual |

## 3. Cómo correrlo

### En la máquina de cualquiera

```bash
npm run seguridad:dependencias
```

Descarga la imagen `ghcr.io/google/osv-scanner:v2.6.0` —la misma versión que usa el servidor—,
analiza el candado, guarda el reporte en `docs/evidencia/osv-scanner.sarif.json` y escribe un
resumen. Termina con código 1 si encuentra algo, para que también sirva en un *hook*.

Sin Docker instalado avisa con un mensaje claro en vez de fallar con un rastro ilegible.

### En la integración continua

El flujo [`dependencias.yml`](../.github/workflows/dependencias.yml):

1. analiza el candado y genera el SARIF (sin cortar el flujo todavía);
2. publica el reporte en **Security → Code scanning** y lo guarda como artefacto 30 días;
3. escribe en el resumen del flujo cuántas vulnerabilidades encontró;
4. **después** falla el trabajo si las hubo.

Ese orden es deliberado: si el flujo fallara antes de publicar, el reporte —que es lo que sirve para
arreglar el problema— nunca se vería.

## 4. Resultado actual

Ejecución del 1 de octubre de 2026:

```text
Scanned /proyecto/package-lock.json file and found 5 packages
Sin vulnerabilidades conocidas en las dependencias.
```

Reporte completo en `docs/evidencia/osv-scanner.sarif.json`. El proyecto tiene pocas dependencias a
propósito (el panel no usa ninguna en tiempo de ejecución salvo driver.js, que se sirve desde el
repositorio), y eso es en sí una decisión de seguridad: lo que no se instala no se puede
comprometer.

## 5. Qué hacer ante un hallazgo

1. Leer el identificador OSV y la versión que lo corrige, en el resumen del flujo o en la pestaña
   *Security*.
2. Si hay versión corregida: subirla (normalmente ya habrá un pull request de Dependabot) y dejar
   que la integración continua confirme que nada se rompió.
3. Si **no** hay arreglo disponible: anotarlo en el pull request con el motivo y la decisión del
   equipo —esperar, cambiar de paquete o aceptar el riesgo con fecha de revisión—. Nunca se apaga el
   análisis en silencio.
