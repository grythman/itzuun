#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
STOP_DB=false

if [[ "${1:-}" == "--with-db" ]]; then
  STOP_DB=true
fi

stop_by_pid_file() {
  local label="$1"
  local pid_file="$2"

  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      echo "[stack] stopped $label (pid: $pid)"
    fi
    rm -f "$pid_file"
  fi
}

stop_by_pattern() {
  local label="$1"
  local pattern="$2"

  if pgrep -f "$pattern" >/dev/null 2>&1; then
    pkill -f "$pattern" || true
    echo "[stack] stopped $label by pattern"
  fi
}

stop_by_pid_file "backend" "$RUN_DIR/backend.pid"
stop_by_pid_file "frontend" "$RUN_DIR/frontend.pid"

stop_by_pattern "backend" "manage.py runserver 0.0.0.0:8000"
stop_by_pattern "frontend" "next dev --hostname 0.0.0.0 --port 3000"

if [[ "$STOP_DB" == true ]]; then
  if docker ps --format '{{.Names}}' | grep -q '^itzuun-pg$'; then
    docker stop itzuun-pg >/dev/null
    echo "[stack] stopped postgres container (itzuun-pg)"
  else
    echo "[stack] postgres container not running"
  fi
else
  echo "[stack] postgres left running (use --with-db to stop it)"
fi

echo "[stack] stack stop complete"
