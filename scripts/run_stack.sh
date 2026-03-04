#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
LOG_DIR="$ROOT_DIR/.logs"

mkdir -p "$RUN_DIR" "$LOG_DIR"

start_db() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "[stack] docker not found on PATH"
    exit 1
  fi

  if docker ps --format '{{.Names}}' | grep -q '^itzuun-pg$'; then
    echo "[stack] postgres container already running (itzuun-pg)"
    return
  fi

  if docker ps -a --format '{{.Names}}' | grep -q '^itzuun-pg$'; then
    echo "[stack] starting existing postgres container (itzuun-pg)"
    docker start itzuun-pg >/dev/null
  else
    echo "[stack] creating postgres container (itzuun-pg)"
    docker run -d \
      --name itzuun-pg \
      -e POSTGRES_DB=itzuun \
      -e POSTGRES_USER=itzuun \
      -e POSTGRES_PASSWORD=itzuun \
      -p 5432:5432 \
      postgres:16 >/dev/null
  fi

  echo "[stack] waiting for postgres readiness..."
  until docker exec itzuun-pg pg_isready -U itzuun -d itzuun >/dev/null 2>&1; do
    sleep 1
  done
}

start_backend() {
  if pgrep -f 'manage.py runserver 0.0.0.0:8000' >/dev/null 2>&1; then
    echo "[stack] backend already running on :8000"
    return
  fi

  echo "[stack] starting backend..."
  nohup "$ROOT_DIR/backend/scripts/run_backend.sh" >"$LOG_DIR/backend.log" 2>&1 &
  echo $! > "$RUN_DIR/backend.pid"
}

start_frontend() {
  if pgrep -f 'next dev --hostname 0.0.0.0 --port 3000' >/dev/null 2>&1 || pgrep -f 'next dev' >/dev/null 2>&1; then
    echo "[stack] frontend already running on :3000"
    return
  fi

  echo "[stack] starting frontend..."
  nohup "$ROOT_DIR/frontend/scripts/run_frontend.sh" >"$LOG_DIR/frontend.log" 2>&1 &
  echo $! > "$RUN_DIR/frontend.pid"
}

wait_http() {
  local url="$1"
  local label="$2"
  local tries=30

  while (( tries > 0 )); do
    if curl -s -o /dev/null "$url"; then
      echo "[stack] $label ready: $url"
      return
    fi
    sleep 1
    tries=$((tries - 1))
  done

  echo "[stack] timeout waiting for $label ($url)"
  exit 1
}

start_db
start_backend
start_frontend

wait_http "http://127.0.0.1:8000/" "backend"
wait_http "http://127.0.0.1:3000/" "frontend"

echo "[stack] full stack is up"
echo "[stack] backend:  http://127.0.0.1:8000/"
echo "[stack] frontend: http://127.0.0.1:3000/"
echo "[stack] logs:     $LOG_DIR"
