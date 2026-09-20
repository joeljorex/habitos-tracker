# Análisis estático con SonarQube en un stack local

> Actividad 1.2 — CI/CD. Guía de instalación y uso del stack local de SonarQube para el proyecto
> Hábitos Tracker. Los resultados de cada integrante están en
> [analisis-estatico.md](./analisis-estatico.md).

## 1. Qué resuelve

Las pruebas dicen si el código **hace** lo correcto; el análisis estático dice si el código **está**
bien escrito, sin ejecutarlo. SonarQube revisa todo el repositorio y reporta:

| Categoría | Qué detecta | Ejemplo en este proyecto |
|---|---|---|
| Bugs | errores que van a fallar en ejecución | comparar fechas como texto en vez de como fecha |
| Vulnerabilidades | riesgos de seguridad | credenciales escritas en el código |
| Security hotspots | código que hay que revisar a mano | uso de `innerHTML` con datos del usuario |
| Code smells | deuda técnica | funciones muy largas o duplicadas |
| Duplicación | bloques repetidos | la misma validación copiada en dos módulos |
| Cobertura | qué porcentaje del código tocan las pruebas | se toma del reporte lcov |

El **quality gate** junta todo eso en un semáforo: si el código nuevo no lo pasa, el pipeline falla.

## 2. Requisitos

- Docker Desktop (Windows, macOS) o Docker Engine (Linux), encendido.
- 4 GB de RAM libres: SonarQube levanta un Elasticsearch interno.
- Puerto `9000` libre.

## 3. Levantar el stack

El stack está versionado en [`infra/sonarqube/docker-compose.yml`](../infra/sonarqube/docker-compose.yml):
PostgreSQL para los datos y SonarQube Community para la aplicación.

```bash
# desde la raíz del repositorio
npm run sonar:levantar
# equivale a: docker compose -f infra/sonarqube/docker-compose.yml up -d

# ver cómo va (la primera vez tarda 2-3 minutos en quedar "UP")
curl http://localhost:9000/api/system/status
docker compose -f infra/sonarqube/docker-compose.yml ps
```

Cuando responda `{"status":"UP"}`, abre <http://localhost:9000>.

## 4. Primer acceso y proyectos

1. Entra con el usuario `admin` y la contraseña `admin`; SonarQube obliga a cambiarla.
2. Crea un proyecto por integrante, para que cada quien analice el código de su PR de la primera
   unidad:

   | Proyecto | Clave | Qué analiza |
   |---|---|---|
   | Habitos Tracker - JAI | `habitos-tracker-jai` | panel web y pruebas (PR #7) |
   | Habitos Tracker - JHM | `habitos-tracker-jhm` | módulo de rachas (PR #10) |

3. Genera un token en **Mi cuenta → Security → Generate token** y guárdalo fuera del repositorio.

Los mismos pasos, por línea de comandos:

```bash
S=http://localhost:9000
curl -u admin:admin -X POST "$S/api/users/change_password?login=admin&previousPassword=admin&password=TU_CONTRASENA"
curl -u admin:TU_CONTRASENA -X POST "$S/api/projects/create" --data-urlencode "project=habitos-tracker-jai" --data-urlencode "name=Habitos Tracker - JAI"
curl -u admin:TU_CONTRASENA -X POST "$S/api/user_tokens/generate" --data-urlencode "name=escaner"
```

## 5. Escanear

La configuración base está en [`sonar-project.properties`](../sonar-project.properties): qué es
código de producción, qué son pruebas y qué se excluye (la carpeta `web/vendor/` es de terceros).

```powershell
# Windows
$env:SONAR_TOKEN = "squ_tu_token"
./scripts/sonar-escaneo.ps1 habitos-tracker-jai "Habitos Tracker - JAI"
```

```bash
# Linux / macOS / Git Bash
SONAR_TOKEN=squ_tu_token ./scripts/sonar-escaneo.sh habitos-tracker-jai "Habitos Tracker - JAI"
```

Los dos scripts hacen lo mismo: corren el escáner oficial en un contenedor, conectado a la misma red
de Docker que SonarQube, y montan el repositorio en `/usr/src`. No hace falta instalar Java ni el
escáner en la máquina.

```bash
docker run --rm --network habitos-sonarqube_default \
  -e SONAR_HOST_URL=http://sonarqube:9000 -e SONAR_TOKEN="$SONAR_TOKEN" \
  -v "$PWD:/usr/src" sonarsource/sonar-scanner-cli:latest \
  -Dsonar.projectKey=habitos-tracker-jai
```

Al terminar, el resultado queda en `http://localhost:9000/dashboard?id=habitos-tracker-jai`.

## 6. Incluir la cobertura

```bash
npm run test:cobertura -- --test-reporter=lcov --test-reporter-destination=coverage/lcov.info
```

El archivo `coverage/lcov.info` lo lee SonarQube gracias a la propiedad
`sonar.javascript.lcov.reportPaths`, y así el tablero muestra también el porcentaje de cobertura.

## 7. Conectarlo al pipeline

[`.github/workflows/calidad.yml`](../.github/workflows/calidad.yml) ya trae el análisis para GitHub
Actions. Como el SonarQube de la materia vive en una máquina local, el job solo se activa si el
repositorio tiene configurados:

- variable `SONAR_HOST_URL` con una instancia accesible desde internet (o SonarCloud),
- secreto `SONAR_TOKEN` con el token del proyecto.

Mientras eso no exista, el análisis se corre en local antes de abrir el PR, que es lo que pide esta
actividad, y la evidencia se adjunta al PR.

## 8. Apagar y limpiar

```bash
npm run sonar:apagar                                              # conserva los datos
docker compose -f infra/sonarqube/docker-compose.yml down -v      # borra también los volúmenes
```

## 9. Problemas comunes

| Síntoma | Causa | Solución |
|---|---|---|
| El contenedor reinicia en bucle | Elasticsearch sin memoria | subir la RAM de Docker Desktop a 4 GB o más |
| `max virtual memory areas ... too low` | límite del kernel en Linux | `sudo sysctl -w vm.max_map_count=262144` |
| `Port 9000 is already allocated` | otro servicio usa el puerto | cambiar el mapeo a `9001:9000` en el compose |
| El escáner no resuelve `sonarqube` | contenedor fuera de la red del stack | usar `--network habitos-sonarqube_default` |
| `You're not authorized` | token vencido o de otro proyecto | generar uno nuevo en Mi cuenta → Security |
| El tablero pide iniciar sesión para verlo | `sonar.forceAuthentication` activo | desactivarlo en Administration → Security, solo en local |
