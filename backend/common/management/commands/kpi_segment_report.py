from __future__ import annotations

import json
from collections import defaultdict
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.payments.models import Dispute, Escrow
from apps.projects.models import Project


class Command(BaseCommand):
    help = "Generate KPI segmentation report for incident diagnosis."

    def add_arguments(self, parser):
        parser.add_argument("--days", type=int, default=7, help="Lookback window in days")
        parser.add_argument("--json", action="store_true", help="Print JSON output")

    def handle(self, *args, **options):
        days = max(1, int(options["days"]))
        as_json = bool(options["json"])
        since = timezone.now() - timedelta(days=days)

        projects = Project.objects.filter(created_at__gte=since).select_related("selected_proposal")
        disputes = Dispute.objects.filter(created_at__gte=since).select_related("project")

        by_status = defaultdict(int)
        by_category = defaultdict(lambda: {"total": 0, "hired": 0, "completed": 0, "disputed": 0})

        for project in projects:
            by_status[project.status] += 1
            slot = by_category[project.category or "uncategorized"]
            slot["total"] += 1
            if project.selected_proposal_id:
                slot["hired"] += 1
            if project.status == Project.STATUS_COMPLETED:
                slot["completed"] += 1
            if project.status == Project.STATUS_DISPUTED:
                slot["disputed"] += 1

        dispute_ids = [d.project_id for d in disputes]
        for project_id in dispute_ids:
            category = projects.filter(id=project_id).values_list("category", flat=True).first()
            if category:
                by_category[category]["disputed"] += 1

        category_rows = []
        for category, data in sorted(by_category.items(), key=lambda item: item[0]):
            hired = data["hired"]
            total = data["total"]
            completed = data["completed"]
            disputed = data["disputed"]
            completion_rate = round((completed / hired) * 100, 2) if hired else 0.0
            hire_rate = round((hired / total) * 100, 2) if total else 0.0
            dispute_rate = round((disputed / total) * 100, 2) if total else 0.0
            category_rows.append(
                {
                    "category": category,
                    "total": total,
                    "hired": hired,
                    "completed": completed,
                    "disputed": disputed,
                    "hire_rate_pct": hire_rate,
                    "completion_rate_pct": completion_rate,
                    "dispute_rate_pct": dispute_rate,
                }
            )

        payload = {
            "window_days": days,
            "since": since.isoformat(),
            "projects_total": projects.count(),
            "disputes_total": disputes.count(),
            "by_status": dict(sorted(by_status.items(), key=lambda item: item[0])),
            "by_category": category_rows,
        }

        if as_json:
            self.stdout.write(json.dumps(payload, indent=2))
            return

        self.stdout.write(f"KPI segment report ({days}d)")
        self.stdout.write(json.dumps(payload, indent=2))
