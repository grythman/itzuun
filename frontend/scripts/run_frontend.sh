#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -f "$FRONTEND_DIR/.env.local" ]]; then
  set -a
  source "$FRONTEND_DIR/.env.local"
  set +a
fi

cd "$FRONTEND_DIR"
npm run dev -- --hostname 0.0.0.0 --port "${FRONTEND_PORT:-3000}"
