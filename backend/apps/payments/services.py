"""Payment and escrow services."""
from django.db import transaction
from django.utils import timezone

from backend.common.exceptions import DomainError
from backend.common.models import PlatformSetting
from apps.projects.models import Project

from .models import Dispute, Escrow, LedgerEntry


def _lock_project(project: Project) -> Project:
    """Reload and lock project with related escrow/proposal to avoid race conditions."""
    return (
        Project.objects.select_for_update()
        .select_related("selected_proposal", "escrow")
        .get(id=project.id)
    )


def _lock_escrow(escrow: Escrow) -> Escrow:
    return Escrow.objects.select_for_update().select_related("project__selected_proposal").get(id=escrow.id)


@transaction.atomic
def deposit_to_escrow(project: Project, amount: int | None = None) -> Escrow:
    project = _lock_project(project)
    if project.status != Project.STATUS_IN_PROGRESS:
        raise DomainError("Project must be in progress to fund escrow.")
    if not project.selected_proposal:
        raise DomainError("Project has no selected proposal.")

    deposit_amount = amount if amount is not None else project.selected_proposal.price
    if deposit_amount <= 0:
        raise DomainError("Deposit amount must be positive.")

    escrow, created = Escrow.objects.select_for_update().get_or_create(project=project, defaults={"amount": 0})
    if not created and escrow.ledger_entries.filter(entry_type=LedgerEntry.TYPE_DEPOSIT).exists():
        raise DomainError("Escrow is already funded.")
    if escrow.status in {Escrow.STATUS_RELEASED, Escrow.STATUS_REFUNDED}:
        raise DomainError("Escrow is already closed.")

    escrow.amount = deposit_amount
    escrow.status = Escrow.STATUS_PENDING_ADMIN
    escrow.save(update_fields=["amount", "status", "updated_at"])
    LedgerEntry.objects.create(
        escrow=escrow,
        entry_type=LedgerEntry.TYPE_DEPOSIT,
        amount=deposit_amount,
        note="Client deposit",
    )
    return escrow


@transaction.atomic
def approve_escrow(escrow: Escrow) -> Escrow:
    escrow = _lock_escrow(escrow)
    if escrow.status != Escrow.STATUS_PENDING_ADMIN:
        raise DomainError("Escrow is not awaiting approval.")
    escrow.status = Escrow.STATUS_HELD
    escrow.save(update_fields=["status", "updated_at"])
    return escrow


@transaction.atomic
def submit_result(project: Project, submitter) -> Project:
    project = _lock_project(project)
    if not project.selected_proposal or project.selected_proposal.freelancer_id != submitter.id:
        raise DomainError("Only the selected freelancer can submit work.")
    if project.status != Project.STATUS_IN_PROGRESS:
        raise DomainError("Project is not in progress.")
    if not hasattr(project, "escrow") or project.escrow.status != Escrow.STATUS_HELD:
        raise DomainError("Escrow must be held before submitting work.")

    project.status = Project.STATUS_AWAITING_REVIEW
    project.save(update_fields=["status"])
    return project


@transaction.atomic
def confirm_completion(project: Project, approved_by, platform_fee_pct: int | None = None) -> Escrow:
    project = _lock_project(project)
    if project.owner_id != approved_by.id:
        raise DomainError("Only the project owner can confirm completion.")
    if project.status != Project.STATUS_AWAITING_REVIEW:
        raise DomainError("Project is not awaiting review.")
    if not hasattr(project, "escrow"):
        raise DomainError("Escrow not found for this project.")
    escrow = project.escrow
    if escrow.status != Escrow.STATUS_HELD:
        raise DomainError("Escrow is not in held state.")

    pct = platform_fee_pct if platform_fee_pct is not None else PlatformSetting.get_solo().platform_fee_pct
    platform_fee = int(escrow.amount * pct / 100)
    release_amount = escrow.amount - platform_fee
    if release_amount < 0:
        raise DomainError("Release amount cannot be negative.")

    LedgerEntry.objects.create(
        escrow=escrow,
        entry_type=LedgerEntry.TYPE_FEE,
        amount=platform_fee,
        note=f"Platform fee {pct}%",
    )
    LedgerEntry.objects.create(
        escrow=escrow,
        entry_type=LedgerEntry.TYPE_RELEASE,
        amount=release_amount,
        note="Payout to freelancer",
    )

    escrow.status = Escrow.STATUS_RELEASED
    escrow.save(update_fields=["status", "updated_at"])
    project.status = Project.STATUS_COMPLETED
    project.save(update_fields=["status", "updated_at"])
    return escrow


@transaction.atomic
def create_dispute(project: Project, raised_by, reason: str, evidence_files: list[int]) -> Dispute:
    project = _lock_project(project)
    if raised_by.id not in {project.owner_id, getattr(project.selected_proposal, "freelancer_id", None)}:
        raise DomainError("Only project participants can raise a dispute.")
    if project.status not in {Project.STATUS_IN_PROGRESS, Project.STATUS_AWAITING_REVIEW}:
        raise DomainError("Dispute can only be raised while work is in progress or under review.")
    if not hasattr(project, "escrow"):
        raise DomainError("Escrow not found for this project.")

    escrow = project.escrow
    escrow.status = Escrow.STATUS_DISPUTED
    escrow.save(update_fields=["status", "updated_at"])
    project.status = Project.STATUS_DISPUTED
    project.save(update_fields=["status", "updated_at"])

    return Dispute.objects.create(
        project=project,
        raised_by=raised_by,
        reason=reason,
        evidence_files=evidence_files,
    )


@transaction.atomic
def resolve_dispute(dispute: Dispute, action: str, release_amount: int, refund_amount: int, note: str, resolver):
    dispute = Dispute.objects.select_for_update().select_related("project__escrow").get(id=dispute.id)
    escrow = dispute.project.escrow

    if escrow.status != Escrow.STATUS_DISPUTED:
        raise DomainError("Escrow is not disputed.")

    if release_amount < 0 or refund_amount < 0:
        raise DomainError("Amounts cannot be negative.")

    total = release_amount + refund_amount
    if total != escrow.amount:
        raise DomainError("Release and refund must add up to escrow amount.")

    if action == "release":
        LedgerEntry.objects.create(escrow=escrow, entry_type=LedgerEntry.TYPE_RELEASE, amount=release_amount)
        escrow.status = Escrow.STATUS_RELEASED
        dispute.project.status = Project.STATUS_COMPLETED
    elif action == "refund":
        LedgerEntry.objects.create(escrow=escrow, entry_type=LedgerEntry.TYPE_REFUND, amount=refund_amount)
        escrow.status = Escrow.STATUS_REFUNDED
        dispute.project.status = Project.STATUS_CLOSED_REFUNDED
    elif action == "split":
        LedgerEntry.objects.create(escrow=escrow, entry_type=LedgerEntry.TYPE_RELEASE, amount=release_amount)
        LedgerEntry.objects.create(escrow=escrow, entry_type=LedgerEntry.TYPE_REFUND, amount=refund_amount)
        escrow.status = Escrow.STATUS_RELEASED
        dispute.project.status = Project.STATUS_COMPLETED
    else:
        raise DomainError("Invalid dispute action.")

    escrow.save(update_fields=["status", "updated_at"])
    dispute.project.save(update_fields=["status", "updated_at"])
    dispute.resolved_by = resolver
    dispute.resolved_at = timezone.now()
    dispute.note = note
    dispute.save(update_fields=["resolved_by", "resolved_at", "note"])
    return dispute
