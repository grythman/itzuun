#!/usr/bin/env python3
import argparse
import json
import os
from pathlib import Path


def _load(path: str) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def _run_url(explicit: str) -> str:
    if explicit:
        return explicit
    server = os.getenv("GITHUB_SERVER_URL", "https://github.com")
    repo = os.getenv("GITHUB_REPOSITORY", "")
    run_id = os.getenv("GITHUB_RUN_ID", "")
    if repo and run_id:
        return f"{server}/{repo}/actions/runs/{run_id}"
    return "RUN_URL_TBD"


def main() -> int:
    parser = argparse.ArgumentParser(description="Build KPI workflow run summary and tracker snippet.")
    parser.add_argument("--kpi-file", required=True)
    parser.add_argument("--readiness-file", required=True)
    parser.add_argument("--alerts-file", required=True)
    parser.add_argument("--run-url", default="")
    parser.add_argument("--summary-output", required=True)
    parser.add_argument("--snippet-output", required=True)
    args = parser.parse_args()

    kpi = _load(args.kpi_file)
    readiness = _load(args.readiness_file)
    alerts = _load(args.alerts_file)
    run_url = _run_url(args.run_url)

    payload = {
        "run_url": run_url,
        "window_days": kpi.get("window_days"),
        "since": kpi.get("since"),
        "pilot_ready": readiness.get("ready"),
        "missing_gates": readiness.get("missing_gates", []),
        "incident_decision": alerts.get("incident_decision"),
        "incident_count": alerts.get("incident_count"),
    }
    Path(args.summary_output).write_text(json.dumps(payload, indent=2), encoding="utf-8")

    snippet = (
        "## KPI Run Update\n"
        f"- Run URL: {run_url}\n"
        f"- KPI window: {payload['window_days']} days (since {payload['since']})\n"
        f"- Pilot ready: {payload['pilot_ready']}\n"
        f"- Missing gates: {payload['missing_gates']}\n"
        f"- KPI incident decision: `{payload['incident_decision']}` (count={payload['incident_count']})\n"
    )
    Path(args.snippet_output).write_text(snippet, encoding="utf-8")
    print(json.dumps(payload, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
