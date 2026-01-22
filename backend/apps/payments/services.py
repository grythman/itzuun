"""Payment and escrow services."""
from django.db import transaction
from django.utils import timezone

from apps.projects.models import Project

from .models import Dispute, Escrow, LedgerEntry


@transaction.atomic
def deposit_to_escrow(project: Project, amount: int) -> Escrow:
    escrow, _created = Escrow.objects.get_or_create(project=project)
    escrow.amount = amount
    escrow.status = Escrow.STATUS_PENDING_ADMIN
    escrow.save(update_fields=["amount", "status"])
    LedgerEntry.objects.create(escrow=escrow, entry_type=LedgerEntry.TYPE_DEPOSIT, amount=amount)
    return escrow


@transaction.atomic
def approve_escrow(escrow: Escrow) -> Escrow:
    escrow.status = Escrow.STATUS_HELD
    escrow.save(update_fields=["status"])
    return escrow


@transaction.atomic
def submit_result(project: Project) -> Project:
    project.status = Project.STATUS_AWAITING_REVIEW
    project.save(update_fields=["status"])
    return project


@transaction.atomic
def confirm_completion(project: Project, platform_fee_pct: int) -> Escrow:
    escrow = project.escrow
    platform_fee = int(escrow.amount * platform_fee_pct / 100)
    payout = escrow.amount - platform_fee
    LedgerEntry.objects.create(escrow=escrow, entry_type=LedgerEntry.TYPE_FEE, amount=platform_fee)
    LedgerEntry.objects.create(escrow=escrow, entry_type=LedgerEntry.TYPE_RELEASE, amount=payout)
    escrow.status = Escrow.STATUS_RELEASED
    escrow.save(update_fields=["status"])
    project.status = Project.STATUS_COMPLETED
    project.save(update_fields=["status"])
    return escrow


@transaction.atomic
def create_dispute(project: Project, raised_by, reason: str, evidence_files: list[int]) -> Dispute:
    escrow = project.escrow
    escrow.status = Escrow.STATUS_DISPUTED
    escrow.save(update_fields=["status"])
    return Dispute.objects.create(
        project=project,
        raised_by=raised_by,
        reason=reason,
        evidence_files=evidence_files,
    )


@transaction.atomic
def resolve_dispute(dispute: Dispute, action: str, release_amount: int, refund_amount: int, note: str, resolver):
    escrow = dispute.project.escrow
    if action == "release":
        LedgerEntry.objects.create(escrow=escrow, entry_type=LedgerEntry.TYPE_RELEASE, amount=release_amount)
        escrow.status = Escrow.STATUS_RELEASED
        dispute.project.status = Project.STATUS_COMPLETED
    elif action == "refund":
        LedgerEntry.objects.create(escrow=escrow, entry_type=LedgerEntry.TYPE_REFUND, amount=refund_amount)
        escrow.status = Escrow.STATUS_REFUNDED
        dispute.project.status = Project.STATUS_CLOSED_REFUNDED
    else:
        LedgerEntry.objects.create(escrow=escrow, entry_type=LedgerEntry.TYPE_RELEASE, amount=release_amount)
        LedgerEntry.objects.create(escrow=escrow, entry_type=LedgerEntry.TYPE_REFUND, amount=refund_amount)
        escrow.status = Escrow.STATUS_RELEASED
        dispute.project.status = Project.STATUS_COMPLETED
    escrow.save(update_fields=["status"])
    dispute.project.save(update_fields=["status"])
    dispute.resolved_by = resolver
    dispute.resolved_at = timezone.now()
    dispute.note = note
    dispute.save(update_fields=["resolved_by", "resolved_at", "note"])
    return dispute
