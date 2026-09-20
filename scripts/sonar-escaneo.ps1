# Escaneo de análisis estático contra el SonarQube local (Actividad 1.2).
#
# Uso:
#   $env:SONAR_TOKEN = "squ_xxx"
#   ./scripts/sonar-escaneo.ps1 habitos-tracker-jai "Habitos Tracker - JAI"
#
# Requisito: el stack levantado con  npm run sonar:levantar
param(
  [string]$Clave = 'habitos-tracker',
  [string]$Nombre = 'Habitos Tracker'
)
$ErrorActionPreference = 'Stop'

if (-not $env:SONAR_TOKEN) {
  Write-Error 'Falta SONAR_TOKEN. Generalo en SonarQube: Mi cuenta -> Security -> Generate token.'
}

$red = if ($env:SONAR_RED) { $env:SONAR_RED } else { 'habitos-sonarqube_default' }
$url = if ($env:SONAR_HOST_URL) { $env:SONAR_HOST_URL } else { 'http://sonarqube:9000' }
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path -replace '\\', '/'

Write-Host "Escaneando '$Clave' contra $url ..." -ForegroundColor Cyan
docker run --rm `
  --network $red `
  -e SONAR_HOST_URL=$url `
  -e SONAR_TOKEN=$env:SONAR_TOKEN `
  -v "${raiz}:/usr/src" `
  sonarsource/sonar-scanner-cli:latest `
  "-Dsonar.projectKey=$Clave" `
  "-Dsonar.projectName=$Nombre"

if ($LASTEXITCODE -ne 0) { Write-Error "El escaneo fallo (codigo $LASTEXITCODE)." }
Write-Host "Listo. Resultados: http://localhost:9000/dashboard?id=$Clave" -ForegroundColor Green
