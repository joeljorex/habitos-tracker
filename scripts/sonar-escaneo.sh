#!/usr/bin/env bash
# Escaneo de análisis estático contra el SonarQube local (Actividad 1.2).
#
# Uso:
#   SONAR_TOKEN=squ_xxx ./scripts/sonar-escaneo.sh habitos-tracker-jai "Habitos Tracker - JAI"
#
# Requisitos: el stack levantado con
#   docker compose -f infra/sonarqube/docker-compose.yml up -d
set -euo pipefail

CLAVE="${1:-habitos-tracker}"
NOMBRE="${2:-Habitos Tracker}"
RED="${SONAR_RED:-habitos-sonarqube_default}"   # red de docker compose del stack
URL="${SONAR_HOST_URL:-http://sonarqube:9000}"  # dentro de esa red, el servidor se llama "sonarqube"

if [ -z "${SONAR_TOKEN:-}" ]; then
  echo "Falta SONAR_TOKEN. Genéralo en SonarQube: Mi cuenta → Security → Generate token." >&2
  exit 1
fi

echo "Escaneando '$CLAVE' contra $URL ..."
docker run --rm \
  --network "$RED" \
  -e SONAR_HOST_URL="$URL" \
  -e SONAR_TOKEN="$SONAR_TOKEN" \
  -v "$(pwd):/usr/src" \
  sonarsource/sonar-scanner-cli:latest \
  -Dsonar.projectKey="$CLAVE" \
  -Dsonar.projectName="$NOMBRE"

echo "Listo. Resultados: http://localhost:9000/dashboard?id=$CLAVE"
