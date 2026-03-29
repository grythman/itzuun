from __future__ import annotations

import json
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db.models import Avg
from django.utils import timezone

from apps.accounts.models import User
from apps.payments.models import Dispute, Escrow
from apps.projects.models import Project, Proposal
from apps.reviews.models import Review


class Command(BaseCommand):
    help = "Generate weekly KPI snapshot for marketplace launch tracking."

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=7,
            help="Lookback window in days (default: 7).",
        )
        parser.add_argument(
            "--json",
            action="store_true",
            help="Print JSON output for automation dashboards.",
        )

    def handle(self, *args, **options):
        days = max(1, int(options["days"]))
        as_json = bool(options["json"])
        since = timezone.now() - timedelta(days=days)

        # New freelancer signups within period
        new_freelancer_signups = User.objects.filter(
            role=User.ROLE_FREELANCER,
            created_at__gte=since,
        ).count()

        # Current verified freelancer base size (total)
        verified_freelancer_count = User.objects.filter(
            role=User.ROLE_FREELANCER,
            verification_status=User.VERIFICATION_VERIFIED,
        ).count()

        # Projects posted during lookback period
        projects_posted_qs = Project.objects.filter(created_at__gte=since)
        projects_posted = projects_posted_qs.count()

        # Proposals submitted during lookback period
        proposals_submitted = Proposal.objects.filter(created_at__gte=since).count()

        # Projects in the window that reached hire decision
        hired_projects = projects_posted_qs.filter(selected_proposal__isnull=False).count()

        proposal_to_hire_conversion_pct = (
            round((hired_projects / projects_posted) * 100, 2) if projects_posted else 0.0
        )

        # Escrow funded count approximation based on status and created_at
        funded_statuses = [
            Escrow.STATUS_HELD,
            Escrow.STATUS_RELEASED,
            Escrow.STATUS_DISPUTED,
            Escrow.STATUS_REFUNDED,
        ]
        escrow_funded_count = Escrow.objects.filter(
            created_at__gte=since,
            status__in=funded_statuses,
        ).count()

        # Completion rate for hired projects created during window
        completed_hired_projects = projects_posted_qs.filter(
            selected_proposal__isnull=False,
            status=Project.STATUS_COMPLETED,
        ).count()
        completion_rate_pct = (
            round((completed_hired_projects / hired_projects) * 100, 2) if hired_projects else 0.0
        )

        # Average rating from reviews written in period
        avg_rating_raw = Review.objects.filter(created_at__gte=since).aggregate(avg=Avg("rating"))["avg"]
        avg_rating = round(float(avg_rating_raw), 2) if avg_rating_raw is not None else 0.0

        # Dispute rate among funded escrows created in period
        disputes_created = Dispute.objects.filter(created_at__gte=since).count()
        dispute_rate_pct = (
            round((disputes_created / escrow_funded_count) * 100, 2) if escrow_funded_count else 0.0
        )

        payload = {
            "window_days": days,
            "since": since.isoformat(),
            "kpis": {
                "new_freelancer_signups": new_freelancer_signups,
                "verified_freelancer_count": verified_freelancer_count,
                "projects_posted": projects_posted,
                "proposals_submitted": proposals_submitted,
                "hired_projects": hired_projects,
                "proposal_to_hire_conversion_pct": proposal_to_hire_conversion_pct,
                "escrow_funded_count": escrow_funded_count,
                "completion_rate_pct": completion_rate_pct,
                "avg_rating": avg_rating,
                "disputes_created": disputes_created,
                "dispute_rate_pct": dispute_rate_pct,
            },
        }

        if as_json:
            self.stdout.write(json.dumps(payload, indent=2, ensure_ascii=False))
            return

        lines = [
            f"KPI window: last {days} days",
            f"Since: {payload['since']}",
            "",
            f"- New freelancer signups: {new_freelancer_signups}",
            f"- Verified freelancer count (total): {verified_freelancer_count}",
            f"- Projects posted: {projects_posted}",
            f"- Proposals submitted: {proposals_submitted}",
            f"- Hired projects: {hired_projects}",
            f"- Proposal-to-hire conversion: {proposal_to_hire_conversion_pct}%",
            f"- Escrow funded count: {escrow_funded_count}",
            f"- Completion rate: {completion_rate_pct}%",
            f"- Avg rating: {avg_rating}",
            f"- Disputes created: {disputes_created}",
            f"- Dispute rate: {dispute_rate_pct}%",
        ]
        self.stdout.write("\n".join(lines))
