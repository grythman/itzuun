from __future__ import annotations

import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from apps.payments.models import Dispute, Escrow
from apps.projects.models import Project


DEFAULT_COHORT_VALIDATION = "/root/itzuun/docs/evidence/pilot_cohort_validation.json"


class Command(BaseCommand):
    help = "Generate pilot launch-readiness report and exit-gate status."

    def add_arguments(self, parser):
        parser.add_argument("--json", action="store_true", help="Print JSON report")
        parser.add_argument(
            "--cohort-validation",
            default=DEFAULT_COHORT_VALIDATION,
            help=f"Path to cohort validation JSON (default: {DEFAULT_COHORT_VALIDATION})",
        )
        parser.add_argument("--strict", action="store_true", help="Fail if any exit gate is not ready")

    def handle(self, *args, **options):
        as_json = bool(options["json"])
        cohort_path = options["cohort_validation"]
        strict = bool(options["strict"])

        funded_statuses = [
            Escrow.STATUS_HELD,
            Escrow.STATUS_RELEASED,
            Escrow.STATUS_DISPUTED,
            Escrow.STATUS_REFUNDED,
        ]
        projects_posted_total = Project.objects.count()
        escrow_funded_total = Escrow.objects.filter(status__in=funded_statuses).count()
        completed_total = Project.objects.filter(status=Project.STATUS_COMPLETED).count()
        resolved_dispute_total = Dispute.objects.filter(resolved_at__isnull=False).count()
        cohort_validation = self._read_cohort_validation(cohort_path)

        gates = {
            "projects_posted_20": projects_posted_total >= 20,
            "escrow_activity_non_zero": escrow_funded_total > 0,
            "completed_projects_non_zero": completed_total > 0,
            "dispute_resolved_non_zero": resolved_dispute_total > 0,
            "cohort_validated_no_missing": cohort_validation["missing_total"] == 0,
        }
        ready = all(gates.values())
        missing = [name for name, ok in gates.items() if not ok]

        payload = {
            "phase": "Launch Readiness",
            "summary": {
                "projects_posted_total": projects_posted_total,
                "escrow_funded_total": escrow_funded_total,
                "completed_total": completed_total,
                "resolved_dispute_total": resolved_dispute_total,
                "cohort_validation_path": cohort_path,
                "cohort_missing_total": cohort_validation["missing_total"],
            },
            "gates": gates,
            "ready": ready,
            "missing_gates": missing,
        }

        if strict and not ready:
            raise CommandError(f"Pilot not ready. Missing gates: {', '.join(missing)}")

        if as_json:
            self.stdout.write(json.dumps(payload, indent=2))
            return

        self.stdout.write(f"Pilot ready: {ready}")
        self.stdout.write(f"Missing gates: {', '.join(missing) if missing else 'none'}")

    def _read_cohort_validation(self, filepath: str) -> dict:
        path = Path(filepath)
        try:
            exists = path.exists()
        except OSError:
            return {"missing_total": 999999, "exists": False, "readable": False}
        if not exists:
            return {"missing_total": 999999, "exists": False, "readable": False}
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return {"missing_total": 999999, "exists": True, "readable": False}
        summary = payload.get("summary") or {}
        missing_total = int(summary.get("missing_total", 999999))
        return {"missing_total": missing_total, "exists": True, "readable": True}
