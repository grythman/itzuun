import json
from io import StringIO

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from apps.accounts.models import User
from apps.payments.models import Dispute, Escrow
from apps.projects.models import Project

REQUIRED_TOP_LEVEL_KEYS = {
    "window_days",
    "cohort_label",
    "since",
    "kpis",
}

REQUIRED_KPI_KEYS = {
    "projects_posted",
    "hired_projects",
    "proposal_to_hire_conversion_pct",
    "escrow_funded_count",
    "completion_rate_pct",
    "dispute_rate_pct",
    "avg_rating",
    "new_freelancer_signups",
    "verified_freelancers",
}


class WeeklyKpiReportCommandTests(TestCase):
    def _run_command_json(self, days=7):
        out = StringIO()
        call_command("weekly_kpi_report", days=days, json=True, stdout=out)
        return json.loads(out.getvalue())

    def test_weekly_kpi_report_has_required_keys(self):
        payload = self._run_command_json(days=7)

        self.assertEqual(payload["window_days"], 7)
        self.assertEqual(payload["cohort_label"], "production")
        self.assertTrue(REQUIRED_TOP_LEVEL_KEYS.issubset(payload.keys()))

        kpis = payload["kpis"]
        self.assertTrue(REQUIRED_KPI_KEYS.issubset(kpis.keys()))

    def test_weekly_kpi_report_value_types_are_stable(self):
        payload = self._run_command_json(days=7)
        kpis = payload["kpis"]

        self.assertIsInstance(payload["window_days"], int)
        self.assertIsInstance(payload["cohort_label"], str)
        self.assertIsInstance(payload["since"], str)

        self.assertIsInstance(kpis["projects_posted"], int)
        self.assertIsInstance(kpis["hired_projects"], int)
        self.assertIsInstance(kpis["escrow_funded_count"], int)
        self.assertIsInstance(kpis["new_freelancer_signups"], int)
        self.assertIsInstance(kpis["verified_freelancers"], int)

        self.assertIsInstance(kpis["proposal_to_hire_conversion_pct"], (int, float))
        self.assertIsInstance(kpis["completion_rate_pct"], (int, float))
        self.assertIsInstance(kpis["dispute_rate_pct"], (int, float))
        self.assertIsInstance(kpis["avg_rating"], (int, float))

    def test_legacy_verified_freelancer_key_alias_matches_canonical(self):
        payload = self._run_command_json(days=7)
        kpis = payload["kpis"]

        self.assertIn("verified_freelancer_count", kpis)
        self.assertEqual(
            kpis["verified_freelancers"], kpis["verified_freelancer_count"]
        )


class PilotReadinessReportCommandTests(TestCase):
    def _run_report(self, strict=False, cohort_validation="/tmp/pilot_validation.json"):
        out = StringIO()
        args = {
            "json": True,
            "cohort_validation": cohort_validation,
            "stdout": out,
        }
        if strict:
            args["strict"] = True
        call_command("pilot_readiness_report", **args)
        return json.loads(out.getvalue())

    def test_report_shows_not_ready_by_default(self):
        payload = self._run_report(
            cohort_validation="/tmp/not_existing_validation.json"
        )
        self.assertFalse(payload["ready"])
        self.assertIn("projects_posted_20", payload["missing_gates"])

    def test_report_strict_raises_when_not_ready(self):
        with self.assertRaises(CommandError):
            self._run_report(
                strict=True, cohort_validation="/tmp/not_existing_validation.json"
            )

    def test_report_ready_when_all_gates_satisfied(self):
        owner = User.objects.create_user(
            email="pilot-owner@test.com", password="Pass12345", role="client"
        )
        freelancer = User.objects.create_user(
            email="pilot-freelancer@test.com", password="Pass12345", role="freelancer"
        )
        project = None
        for i in range(20):
            p = Project.objects.create(
                owner=owner,
                title=f"Pilot {i}",
                description="pilot",
                budget=1000,
                timeline_days=3,
                category="web",
                required_skills=["django"],
                status=Project.STATUS_COMPLETED if i == 0 else Project.STATUS_OPEN,
            )
            if i == 0:
                project = p

        Escrow.objects.create(project=project, amount=1000, status=Escrow.STATUS_HELD)
        Dispute.objects.create(
            project=project,
            raised_by=owner,
            reason="pilot dispute",
            resolved_by=freelancer,
            resolved_at=project.updated_at,
            note="refund",
        )

        validation_path = "/tmp/pilot_validation_ready.json"
        with open(validation_path, "w", encoding="utf-8") as fh:
            fh.write(json.dumps({"summary": {"missing_total": 0}}))

        payload = self._run_report(cohort_validation=validation_path)
        self.assertTrue(payload["ready"])
        self.assertEqual(payload["missing_gates"], [])


class LaunchPipelineCommandIntegrationTests(TestCase):
    def test_bootstrap_to_readiness_strict_pipeline(self):
        cohort_input = "/tmp/integration_pilot_cohort_input.json"
        cohort_validation = "/tmp/integration_pilot_cohort_validation.json"
        readiness_out = StringIO()

        call_command(
            "bootstrap_pilot_dataset",
            cohort_output=cohort_input,
        )
        call_command(
            "setup_pilot_cohort",
            input_json=cohort_input,
            output=cohort_validation,
            strict=True,
        )
        call_command(
            "pilot_readiness_report",
            json=True,
            cohort_validation=cohort_validation,
            strict=True,
            stdout=readiness_out,
        )

        payload = json.loads(readiness_out.getvalue())
        self.assertTrue(payload["ready"])
        self.assertEqual(payload["missing_gates"], [])
