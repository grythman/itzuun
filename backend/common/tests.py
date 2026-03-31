import json
from io import StringIO

from django.core.management import call_command
from django.test import TestCase


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
        self.assertIn("since", payload)
        self.assertIn("kpis", payload)

        kpis = payload["kpis"]
        self.assertTrue(REQUIRED_KPI_KEYS.issubset(kpis.keys()))

    def test_weekly_kpi_report_value_types_are_stable(self):
        payload = self._run_command_json(days=7)
        kpis = payload["kpis"]

        self.assertIsInstance(payload["window_days"], int)
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
        self.assertEqual(kpis["verified_freelancers"], kpis["verified_freelancer_count"])
