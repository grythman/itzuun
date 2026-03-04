#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -f "$BACKEND_DIR/.env" ]]; then
  set -a
  source "$BACKEND_DIR/.env"
  set +a
fi

export DB_NAME="${DB_NAME:-itzuun}"
export DB_USER="${DB_USER:-itzuun}"
export DB_PASSWORD="${DB_PASSWORD:-itzuun}"
export DB_HOST="${DB_HOST:-127.0.0.1}"
export DB_PORT="${DB_PORT:-5432}"

cd "$BACKEND_DIR"
python manage.py runserver 0.0.0.0:"${PORT:-8000}"
