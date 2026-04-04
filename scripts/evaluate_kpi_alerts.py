#!/usr/bin/env python3
import argparse
import json
from pathlib import Path


def _load_json(path: str) -> dict:
    p = Path(path)
    return json.loads(p.read_text(encoding="utf-8"))


def _evaluate(kpi_payload: dict, threshold_payload: dict) -> dict:
    kpis = kpi_payload.get("kpis") or {}
    cohort_label = kpi_payload.get("cohort_label") or threshold_payload.get("default_profile") or "production"
    profiles = threshold_payload.get("profiles") or {}
    rules = ((profiles.get(cohort_label) or {}).get("rules")) or (threshold_payload.get("rules") or {})
    incidents: list[dict] = []

    for key, rule in rules.items():
        if key not in kpis:
            incidents.append(
                {
                    "kpi": key,
                    "severity": "sev2",
                    "type": "missing_kpi",
                    "message": f"Required KPI key is missing: {key}",
                }
            )
            continue

        value = kpis[key]
        if "min" in rule and value < rule["min"]:
            incidents.append(
                {
                    "kpi": key,
                    "severity": rule.get("severity", "sev3"),
                    "type": "below_min",
                    "value": value,
                    "threshold": rule["min"],
                    "message": rule.get("message", f"{key} below minimum threshold"),
                }
            )
        if "max" in rule and value > rule["max"]:
            incidents.append(
                {
                    "kpi": key,
                    "severity": rule.get("severity", "sev3"),
                    "type": "above_max",
                    "value": value,
                    "threshold": rule["max"],
                    "message": rule.get("message", f"{key} above maximum threshold"),
                }
            )

    return {
        "window_days": kpi_payload.get("window_days"),
        "since": kpi_payload.get("since"),
        "rule_version": threshold_payload.get("version"),
        "cohort_label": cohort_label,
        "incident_count": len(incidents),
        "incidents": incidents,
        "incident_decision": "open" if incidents else "monitor",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate KPI payload against alert thresholds.")
    parser.add_argument("--kpi-file", required=True, help="Path to kpi_report.json")
    parser.add_argument("--threshold-file", required=True, help="Path to threshold config JSON")
    parser.add_argument("--output", default="", help="Optional output JSON path")
    parser.add_argument("--strict", action="store_true", help="Exit non-zero if incidents are found")
    parser.add_argument(
        "--cohort-label",
        default="",
        choices=["production", "synthetic"],
        help="Override cohort label used for threshold profile selection",
    )
    args = parser.parse_args()

    kpi_payload = _load_json(args.kpi_file)
    if args.cohort_label:
        kpi_payload["cohort_label"] = args.cohort_label
    threshold_payload = _load_json(args.threshold_file)
    result = _evaluate(kpi_payload, threshold_payload)

    output = json.dumps(result, indent=2)
    if args.output:
        Path(args.output).write_text(output, encoding="utf-8")

    print(output)
    if args.strict and result["incident_count"] > 0:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
