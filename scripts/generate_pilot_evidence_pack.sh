#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
PYTHON_BIN="${ROOT_DIR}/.venv/bin/python"
OUT_DIR="${ROOT_DIR}/docs/evidence"
STAMP="$(date -u +%Y%m%d_%H%M%S)"
OUT_FILE="${OUT_DIR}/pilot_execution_${STAMP}.md"

mkdir -p "${OUT_DIR}"

if [[ ! -x "${PYTHON_BIN}" ]]; then
  echo "Missing python: ${PYTHON_BIN}" >&2
  exit 1
fi

{
  echo "# Pilot Evidence Pack"
  echo
  echo "- Generated at (UTC): $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "- Host: $(hostname)"
  echo
  echo "## KPI Snapshot (7 days)"
  echo '```json'
  (
    cd "${BACKEND_DIR}"
    "${PYTHON_BIN}" manage.py weekly_kpi_report --days 7 --json
  )
  echo '```'
  echo
  echo "## Admin Ops Smoke"
  echo '```text'
  (
    cd "${BACKEND_DIR}"
    "${PYTHON_BIN}" manage.py test apps.adminpanel.tests apps.payments.tests -v 1
  )
  echo '```'
  echo
  echo "## Escrow E2E"
  echo '```text'
  (
    cd "${BACKEND_DIR}"
    "${PYTHON_BIN}" manage.py test apps.payments.tests.MvPHappyPathApiTests.test_e2e_happy_path_project_to_review -v 1
  )
  echo '```'
  echo
  echo "## Dispute Dry-Run Guard"
  echo '```text'
  (
    cd "${BACKEND_DIR}"
    "${PYTHON_BIN}" manage.py test apps.payments.tests.EscrowAbuseMatrixTests.test_dispute_then_confirm_completion_is_blocked -v 1
  )
  echo '```'
} > "${OUT_FILE}"

echo "${OUT_FILE}"
