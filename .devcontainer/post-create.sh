#!/usr/bin/env bash
# Preparación del Codespace / dev container — spec 003 (contracts/pipelines.md §5).
#
# Idempotente: se puede volver a ejecutar (p. ej. tras "Rebuild Container") sin romper nada.
# Tolera que el repositorio aún no tenga package.json (el panel web llega con la spec 001)
# ni código de la API.
set -euo pipefail

SPECIFY_VERSION="v1.0.6"

# Siempre desde la raíz del repositorio, sin importar desde dónde se invoque.
cd "$(dirname "${BASH_SOURCE[0]}")/.."
echo "==> Preparando el entorno en $(pwd)"

# uv instala sus binarios (y los de `uv tool`) en ~/.local/bin.
export PATH="$HOME/.local/bin:$PATH"

# --- 1. uv (gestor de paquetes y herramientas de Python) ------------------------------------
if command -v uv >/dev/null 2>&1; then
  echo "==> uv ya está instalado: $(uv --version)"
else
  echo "==> Instalando uv"
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi

# --- 2. Spec Kit (specify-cli) fijado a la versión del proyecto ----------------------------
if uv tool list 2>/dev/null | grep -q "^specify-cli ${SPECIFY_VERSION}\$"; then
  echo "==> specify-cli ${SPECIFY_VERSION} ya está instalado"
else
  echo "==> Instalando specify-cli ${SPECIFY_VERSION}"
  uv tool install --force specify-cli \
    --from "git+https://github.com/github/spec-kit.git@${SPECIFY_VERSION}"
fi

# --- 3. Panel web: dependencias de Node y navegador de pruebas ------------------------------
if [ -f package.json ]; then
  if [ -f package-lock.json ]; then
    echo "==> npm ci"
    npm ci
  else
    echo "==> Aviso: no hay package-lock.json; se usa npm install (la CI exige el lock)"
    npm install
  fi

  if [ -x node_modules/.bin/playwright ]; then
    echo "==> Instalando Chromium de Playwright con sus dependencias del sistema"
    npx playwright install --with-deps chromium
  else
    echo "==> Aviso: Playwright no está en las dependencias; se omite la instalación del navegador"
  fi
else
  echo "==> Aviso: aún no existe package.json; se omiten npm ci y Playwright"
fi

# --- 4. API: dependencias de Composer (cuando exista el proyecto Laravel) -------------------
if [ -f api/composer.json ]; then
  echo "==> composer install en api/"
  (cd api && composer install --no-interaction --prefer-dist)
else
  echo "==> Aviso: aún no existe api/composer.json; se omite composer install"
fi

# --- Resumen ---------------------------------------------------------------------------------
echo "==> Herramientas disponibles:"
for comando in "node --version" "php --version" "composer --version" "python3 --version" \
  "uv --version" "specify version" "terraform -version" "docker --version" "gh --version"; do
  echo "--- ${comando}"
  ${comando} 2>/dev/null | head -n 1 || echo "(no disponible)"
done
echo "==> Listo."
