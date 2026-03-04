"""Payment and escrow services."""
import hashlib
import json

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from common.cache_utils import bump_admin_resource_version, bump_project_version
from common.exceptions import DomainError
from common.models import PlatformSetting
from common.state_guards import guard_escrow_transition, guard_project_transition
from apps.projects.models import Project
from apps.projects.models import ProjectDeliverable

from .models import Dispute, Escrow, FinancialAuditLog, LedgerEntry


def _lock_project(project: Project) -> Project:
    """Reload and lock project with related escrow/proposal to avoid race conditions."""
    return Project.objects.select_for_update().get(id=project.id)


def _lock_escrow(escrow: Escrow) -> Escrow:
    return Escrow.objects.select_for_update().get(id=escrow.id)


def _serialize_escrow(escrow: Escrow) -> dict:
    return {
        "id": escrow.id,
        "project_id": escrow.project_id,
        "amount": escrow.amount,
        "status": escrow.status,
    }


def _serialize_project(project: Project) -> dict:
    return {
        "id": project.id,
        "status": project.status,
        "selected_proposal_id": project.selected_proposal_id,
    }


def _build_hash_chain(payload: dict) -> str:
    previous = FinancialAuditLog.objects.order_by("-id").values_list("hash_chain", flat=True).first() or "GENESIS"
    raw = f"{previous}:{json.dumps(payload, sort_keys=True, default=str)}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def _log_financial_event(
    *,
    actor,
    action_type: str,
    entity_type: str,
    entity_id: int,
    before_state: dict,
    after_state: dict,
    reason: str,
) -> None:
    payload = {
        "actor_id": getattr(actor, "id", None),
        "action_type": action_type,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "before_state": before_state,
        "after_state": after_state,
        "reason": reason,
    }
    FinancialAuditLog.objects.create(
        actor=actor,
        action_type=action_type,
        entity_type=entity_type,
        entity_id=entity_id,
        before_state=before_state,
        after_state=after_state,
        reason=reason,
        hash_chain=_build_hash_chain(payload),
    )


@transaction.atomic
def deposit_to_escrow(project: Project, actor, amount: int | None = None) -> Escrow:
    project = _lock_project(project)
    if project.status != Project.STATUS_IN_PROGRESS:
        raise DomainError("Project must be in progress to fund escrow.")
    if not project.selected_proposal:
        raise DomainError("Project has no selected proposal.")

    platform_setting = PlatformSetting.get_solo()
    expected_amount = project.selected_proposal.price
    deposit_amount = amount if amount is not None else expected_amount
    if not platform_setting.partial_escrow_mode and deposit_amount != expected_amount:
        raise DomainError("Escrow must match selected proposal price.")
    if deposit_amount <= 0:
        raise DomainError("Deposit amount must be positive.")

    escrow, created = Escrow.objects.select_for_update().get_or_create(project=project, defaults={"amount": 0})
    if not created and escrow.ledger_entries.filter(entry_type=LedgerEntry.TYPE_DEPOSIT).exists():
        raise DomainError("Escrow is already funded.")
    if escrow.status in {Escrow.STATUS_RELEASED, Escrow.STATUS_REFUNDED}:
        raise DomainError("Escrow is already closed.")

    before_escrow = _serialize_escrow(escrow)
    escrow.amount = deposit_amount
    if escrow.status != Escrow.STATUS_PENDING_ADMIN:
        guard_escrow_transition(escrow.status, Escrow.STATUS_PENDING_ADMIN)
    escrow.status = Escrow.STATUS_PENDING_ADMIN
    escrow.save(update_fields=["amount", "status", "updated_at"])
    LedgerEntry.objects.create(
        escrow=escrow,
        entry_type=LedgerEntry.TYPE_DEPOSIT,
        amount=deposit_amount,
        note="Client deposit",
    )
    _log_financial_event(
        actor=actor,
        action_type=FinancialAuditLog.ACTION_DEPOSIT,
        entity_type=FinancialAuditLog.ENTITY_ESCROW,
        entity_id=escrow.id,
        before_state=before_escrow,
        after_state=_serialize_escrow(escrow),
        reason="Client funded escrow",
    )
    bump_project_version(project.id)
    bump_admin_resource_version("escrow")
    bump_admin_resource_version("projects")
    return escrow


@transaction.atomic
def approve_escrow(escrow: Escrow, actor) -> Escrow:
    escrow = _lock_escrow(escrow)
    if escrow.status != Escrow.STATUS_PENDING_ADMIN:
        raise DomainError("Escrow is not awaiting approval.")
    before_escrow = _serialize_escrow(escrow)
    guard_escrow_transition(escrow.status, Escrow.STATUS_HELD)
    escrow.status = Escrow.STATUS_HELD
    escrow.save(update_fields=["status", "updated_at"])
    _log_financial_event(
        actor=actor,
        action_type=FinancialAuditLog.ACTION_APPROVE,
        entity_type=FinancialAuditLog.ENTITY_ESCROW,
        entity_id=escrow.id,
        before_state=before_escrow,
        after_state=_serialize_escrow(escrow),
        reason="Admin approved escrow hold",
    )
    bump_project_version(escrow.project_id)
    bump_admin_resource_version("escrow")
    bump_admin_resource_version("projects")
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
    if not ProjectDeliverable.objects.filter(project=project, submitted_by=submitter).exists():
        raise DomainError("At least one deliverable is required before submitting result.")

    guard_project_transition(project.status, Project.STATUS_AWAITING_REVIEW)
    project.status = Project.STATUS_AWAITING_REVIEW
    project.save(update_fields=["status"])
    bump_project_version(project.id)
    bump_admin_resource_version("projects")
    return project


@transaction.atomic
def confirm_completion(project: Project, approved_by) -> Escrow:
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
    if not project.selected_proposal:
        raise DomainError("Selected proposal is required.")

    platform_setting = PlatformSetting.get_solo()
    expected_amount = project.selected_proposal.price
    if not platform_setting.partial_escrow_mode and escrow.amount != expected_amount:
        raise DomainError("Escrow amount must match selected proposal price.")

    pct = settings.PLATFORM_FEE_PCT
    if pct < 0 or pct > settings.PLATFORM_FEE_MAX_PCT:
        raise DomainError("Platform fee policy is out of allowed bounds.")

    before_escrow = _serialize_escrow(escrow)
    before_project = _serialize_project(project)
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

    guard_escrow_transition(escrow.status, Escrow.STATUS_RELEASED)
    escrow.status = Escrow.STATUS_RELEASED
    escrow.save(update_fields=["status", "updated_at"])
    guard_project_transition(project.status, Project.STATUS_COMPLETED)
    project.status = Project.STATUS_COMPLETED
    project.save(update_fields=["status", "updated_at"])
    _log_financial_event(
        actor=approved_by,
        action_type=FinancialAuditLog.ACTION_RELEASE,
        entity_type=FinancialAuditLog.ENTITY_ESCROW,
        entity_id=escrow.id,
        before_state={"escrow": before_escrow, "project": before_project},
        after_state={"escrow": _serialize_escrow(escrow), "project": _serialize_project(project)},
        reason="Client confirmed completion and released escrow",
    )
    bump_project_version(project.id)
    bump_admin_resource_version("escrow")
    bump_admin_resource_version("projects")
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
    before_escrow = _serialize_escrow(escrow)
    before_project = _serialize_project(project)
    guard_escrow_transition(escrow.status, Escrow.STATUS_DISPUTED)
    escrow.status = Escrow.STATUS_DISPUTED
    escrow.save(update_fields=["status", "updated_at"])
    guard_project_transition(project.status, Project.STATUS_DISPUTED)
    project.status = Project.STATUS_DISPUTED
    project.save(update_fields=["status", "updated_at"])

    dispute = Dispute.objects.create(
        project=project,
        raised_by=raised_by,
        reason=reason,
        evidence_files=evidence_files,
    )
    _log_financial_event(
        actor=raised_by,
        action_type=FinancialAuditLog.ACTION_DISPUTE,
        entity_type=FinancialAuditLog.ENTITY_DISPUTE,
        entity_id=dispute.id,
        before_state={"escrow": before_escrow, "project": before_project},
        after_state={"escrow": _serialize_escrow(escrow), "project": _serialize_project(project)},
        reason=reason,
    )
    bump_project_version(project.id)
    bump_admin_resource_version("escrow")
    bump_admin_resource_version("projects")
    bump_admin_resource_version("disputes")
    return dispute


@transaction.atomic
def resolve_dispute(dispute: Dispute, action: str, release_amount: int, refund_amount: int, note: str, resolver):
    dispute = Dispute.objects.select_for_update().select_related("project__escrow").get(id=dispute.id)
    escrow = dispute.project.escrow

    if escrow.status != Escrow.STATUS_DISPUTED:
        raise DomainError("Escrow is not disputed.")

    before_escrow = _serialize_escrow(escrow)
    before_project = _serialize_project(dispute.project)

    if release_amount < 0 or refund_amount < 0:
        raise DomainError("Amounts cannot be negative.")

    total = release_amount + refund_amount
    if total != escrow.amount:
        raise DomainError("Release and refund must add up to escrow amount.")

    if action == "release":
        LedgerEntry.objects.create(escrow=escrow, entry_type=LedgerEntry.TYPE_RELEASE, amount=release_amount)
        guard_escrow_transition(escrow.status, Escrow.STATUS_RELEASED)
        escrow.status = Escrow.STATUS_RELEASED
        guard_project_transition(dispute.project.status, Project.STATUS_COMPLETED)
        dispute.project.status = Project.STATUS_COMPLETED
    elif action == "refund":
        LedgerEntry.objects.create(escrow=escrow, entry_type=LedgerEntry.TYPE_REFUND, amount=refund_amount)
        guard_escrow_transition(escrow.status, Escrow.STATUS_REFUNDED)
        escrow.status = Escrow.STATUS_REFUNDED
        guard_project_transition(dispute.project.status, Project.STATUS_CLOSED_REFUNDED)
        dispute.project.status = Project.STATUS_CLOSED_REFUNDED
    elif action == "split":
        LedgerEntry.objects.create(escrow=escrow, entry_type=LedgerEntry.TYPE_RELEASE, amount=release_amount)
        LedgerEntry.objects.create(escrow=escrow, entry_type=LedgerEntry.TYPE_REFUND, amount=refund_amount)
        guard_escrow_transition(escrow.status, Escrow.STATUS_RELEASED)
        escrow.status = Escrow.STATUS_RELEASED
        guard_project_transition(dispute.project.status, Project.STATUS_COMPLETED)
        dispute.project.status = Project.STATUS_COMPLETED
    else:
        raise DomainError("Invalid dispute action.")

    escrow.save(update_fields=["status", "updated_at"])
    dispute.project.save(update_fields=["status", "updated_at"])
    dispute.resolved_by = resolver
    dispute.resolved_at = timezone.now()
    dispute.note = note
    dispute.save(update_fields=["resolved_by", "resolved_at", "note"])
    _log_financial_event(
        actor=resolver,
        action_type=FinancialAuditLog.ACTION_REFUND if action == "refund" else FinancialAuditLog.ACTION_RELEASE,
        entity_type=FinancialAuditLog.ENTITY_DISPUTE,
        entity_id=dispute.id,
        before_state={"escrow": before_escrow, "project": before_project},
        after_state={"escrow": _serialize_escrow(escrow), "project": _serialize_project(dispute.project)},
        reason=note,
    )
    bump_project_version(dispute.project_id)
    bump_admin_resource_version("escrow")
    bump_admin_resource_version("projects")
    bump_admin_resource_version("disputes")
    return dispute
