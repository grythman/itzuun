#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
PYTHON_BIN="${ROOT_DIR}/.venv/bin/python"
EVIDENCE_DIR="${ROOT_DIR}/docs/evidence"
STAMP="$(date -u +%Y%m%d_%H%M%S)"
SUMMARY_FILE="${EVIDENCE_DIR}/week1_launch_checks_${STAMP}.md"

mkdir -p "${EVIDENCE_DIR}"

if [[ ! -x "${PYTHON_BIN}" ]]; then
  echo "Missing python runtime: ${PYTHON_BIN}" >&2
  exit 1
fi

echo "[1/5] Bootstrap pilot dataset"
(
  cd "${BACKEND_DIR}"
  "${PYTHON_BIN}" manage.py bootstrap_pilot_dataset \
    --cohort-output "${EVIDENCE_DIR}/pilot_cohort_input.generated.json"
)

echo "[2/5] Validate pilot cohort (strict)"
(
  cd "${BACKEND_DIR}"
  "${PYTHON_BIN}" manage.py setup_pilot_cohort \
    --input-json "${EVIDENCE_DIR}/pilot_cohort_input.generated.json" \
    --output "${EVIDENCE_DIR}/pilot_cohort_validation.json" \
    --strict
)

echo "[3/5] Generate weekly KPI snapshot"
(
  cd "${BACKEND_DIR}"
  "${PYTHON_BIN}" manage.py weekly_kpi_report --days 7 --json \
    > "${EVIDENCE_DIR}/kpi_report_local.json"
)

echo "[4/5] Generate pilot readiness report (strict)"
(
  cd "${BACKEND_DIR}"
  "${PYTHON_BIN}" manage.py pilot_readiness_report --json \
    --cohort-validation "${EVIDENCE_DIR}/pilot_cohort_validation.json" \
    --strict > "${EVIDENCE_DIR}/pilot_readiness_report.json"
)

echo "[5/5] Build summary markdown"
{
  echo "# Week 1 Launch Checks"
  echo
  echo "- Generated at (UTC): $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "- Scope: local launch-readiness execution queue"
  echo
  echo "## Artifacts"
  echo "- \`docs/evidence/pilot_cohort_input.generated.json\`"
  echo "- \`docs/evidence/pilot_cohort_validation.json\`"
  echo "- \`docs/evidence/kpi_report_local.json\`"
  echo "- \`docs/evidence/pilot_readiness_report.json\`"
  echo
  echo "## Pilot Readiness"
  cat "${EVIDENCE_DIR}/pilot_readiness_report.json"
} > "${SUMMARY_FILE}"

echo "${SUMMARY_FILE}"
