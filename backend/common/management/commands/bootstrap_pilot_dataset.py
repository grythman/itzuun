from __future__ import annotations

import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import User
from apps.payments.models import Dispute, Escrow, LedgerEntry
from apps.projects.models import Project, Proposal


class Command(BaseCommand):
    help = "Bootstrap deterministic pilot dataset (20 projects, escrow activity, completion, resolved dispute)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--cohort-output",
            default="/root/itzuun/docs/evidence/pilot_cohort_input.generated.json",
            help="Output path for generated cohort JSON",
        )

    def handle(self, *args, **options):
        clients = [self._ensure_client(i) for i in range(1, 11)]
        freelancers = [self._ensure_freelancer(i) for i in range(1, 11)]

        project_ids: list[int] = []
        for i in range(1, 21):
            owner = clients[(i - 1) % len(clients)]
            worker = freelancers[(i - 1) % len(freelancers)]
            project, _ = Project.objects.get_or_create(
                owner=owner,
                title=f"Pilot Project {i:02d}",
                defaults={
                    "description": f"Pilot workload item {i:02d}",
                    "budget": 100000 + i * 1000,
                    "timeline_days": 7 + (i % 5),
                    "category": "pilot",
                    "required_skills": ["django", "nextjs"],
                    "status": Project.STATUS_OPEN,
                },
            )
            proposal, _ = Proposal.objects.get_or_create(
                project=project,
                freelancer=worker,
                defaults={
                    "price": project.budget,
                    "timeline_days": project.timeline_days,
                    "message": "Pilot proposal",
                    "status": Proposal.STATUS_ACCEPTED,
                },
            )
            if proposal.status != Proposal.STATUS_ACCEPTED:
                proposal.status = Proposal.STATUS_ACCEPTED
                proposal.save(update_fields=["status"])
            if project.selected_proposal_id != proposal.id:
                project.selected_proposal = proposal
                project.status = Project.STATUS_IN_PROGRESS
                project.save(
                    update_fields=["selected_proposal", "status", "updated_at"]
                )

            escrow, _ = Escrow.objects.get_or_create(
                project=project,
                defaults={"amount": proposal.price, "status": Escrow.STATUS_HELD},
            )
            if escrow.amount != proposal.price:
                escrow.amount = proposal.price
                escrow.save(update_fields=["amount", "updated_at"])

            # First 3 projects completed and released.
            if i <= 3:
                if project.status != Project.STATUS_COMPLETED:
                    project.status = Project.STATUS_COMPLETED
                    project.save(update_fields=["status", "updated_at"])
                if escrow.status != Escrow.STATUS_RELEASED:
                    escrow.status = Escrow.STATUS_RELEASED
                    escrow.save(update_fields=["status", "updated_at"])
                self._ensure_ledger(
                    escrow, LedgerEntry.TYPE_DEPOSIT, proposal.price, "Pilot deposit"
                )
                self._ensure_ledger(
                    escrow, LedgerEntry.TYPE_RELEASE, proposal.price, "Pilot release"
                )
            # Project 6 has resolved dispute.
            elif i == 6:
                if project.status != Project.STATUS_CLOSED_REFUNDED:
                    project.status = Project.STATUS_CLOSED_REFUNDED
                    project.save(update_fields=["status", "updated_at"])
                if escrow.status != Escrow.STATUS_REFUNDED:
                    escrow.status = Escrow.STATUS_REFUNDED
                    escrow.save(update_fields=["status", "updated_at"])
                self._ensure_ledger(
                    escrow,
                    LedgerEntry.TYPE_DEPOSIT,
                    proposal.price,
                    "Pilot disputed deposit",
                )
                self._ensure_ledger(
                    escrow,
                    LedgerEntry.TYPE_REFUND,
                    proposal.price,
                    "Pilot dispute refund",
                )
                dispute, _ = Dispute.objects.get_or_create(
                    project=project,
                    raised_by=owner,
                    defaults={
                        "reason": "Pilot dispute scenario",
                        "evidence_files": [],
                        "resolved_by": clients[0],
                        "resolved_at": timezone.now(),
                        "note": "refund",
                    },
                )
                if dispute.resolved_at is None:
                    dispute.resolved_by = clients[0]
                    dispute.resolved_at = timezone.now()
                    dispute.note = dispute.note or "refund"
                    dispute.save(update_fields=["resolved_by", "resolved_at", "note"])
            else:
                if escrow.status != Escrow.STATUS_HELD:
                    escrow.status = Escrow.STATUS_HELD
                    escrow.save(update_fields=["status", "updated_at"])
                self._ensure_ledger(
                    escrow, LedgerEntry.TYPE_DEPOSIT, proposal.price, "Pilot deposit"
                )

            project_ids.append(project.id)

        cohort_output = Path(options["cohort_output"])
        cohort_output.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "clients": [u.email for u in clients],
            "freelancers": [u.email for u in freelancers],
            "projects": sorted(project_ids),
        }
        cohort_output.write_text(json.dumps(payload, indent=2), encoding="utf-8")

        self.stdout.write(self.style.SUCCESS("Pilot dataset bootstrap complete."))
        self.stdout.write(str(cohort_output))

    def _ensure_client(self, idx: int) -> User:
        email = f"pilot.client{idx:02d}@itzuun.mn"
        user, _ = User.objects.get_or_create(
            email=email,
            defaults={
                "role": User.ROLE_CLIENT,
                "verification_status": User.VERIFICATION_VERIFIED,
            },
        )
        user.role = User.ROLE_CLIENT
        user.verification_status = User.VERIFICATION_VERIFIED
        user.is_active = True
        user.save(update_fields=["role", "verification_status", "is_active"])
        return user

    def _ensure_freelancer(self, idx: int) -> User:
        email = f"pilot.freelancer{idx:02d}@itzuun.mn"
        user, _ = User.objects.get_or_create(
            email=email,
            defaults={
                "role": User.ROLE_FREELANCER,
                "verification_status": User.VERIFICATION_VERIFIED,
            },
        )
        user.role = User.ROLE_FREELANCER
        user.verification_status = User.VERIFICATION_VERIFIED
        user.is_active = True
        user.save(update_fields=["role", "verification_status", "is_active"])
        return user

    def _ensure_ledger(
        self, escrow: Escrow, entry_type: str, amount: int, note: str
    ) -> None:
        if not escrow.ledger_entries.filter(
            entry_type=entry_type, amount=amount
        ).exists():
            LedgerEntry.objects.create(
                escrow=escrow,
                entry_type=entry_type,
                amount=amount,
                note=note,
            )
