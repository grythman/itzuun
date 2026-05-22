"""Admin services."""

from django.db import transaction

from apps.accounts.models import User
from apps.payments.models import Dispute, FinancialAuditLog
from apps.payments.services import _build_hash_chain, resolve_dispute
from common.exceptions import DomainError
from common.models import PlatformSetting


@transaction.atomic
def verify_user(
    user: User, *, action: str, rejection_reason: str = "", actor: User | None = None
) -> User:
    # Support legacy action names while enforcing a stricter state machine.
    alias_map = {"approve": "verify", "reject": "unverify"}
    normalized = alias_map.get(action, action)

    allowed = {"verify", "unverify", "suspend", "unsuspend"}
    if normalized not in allowed:
        raise DomainError("Invalid verification action")

    # Require a reason for actions that remove or block access
    if normalized in {"unverify", "suspend"} and not rejection_reason.strip():
        raise DomainError("rejection_reason is required for this action")

    current = user.verification_status

    if normalized == "verify":
        if current == User.VERIFICATION_SUSPENDED:
            raise DomainError("Suspended user requires explicit unsuspend flow")
        if current == User.VERIFICATION_VERIFIED:
            raise DomainError("User is already verified")
        user.verification_status = User.VERIFICATION_VERIFIED
        user.rejection_reason = ""
        user.is_active = True

    elif normalized == "unverify":
        if current == User.VERIFICATION_UNVERIFIED:
            raise DomainError("User is already unverified")
        user.verification_status = User.VERIFICATION_UNVERIFIED
        user.rejection_reason = rejection_reason
        # keep is_active as-is (administrator might choose to unverify but keep active)

    elif normalized == "suspend":
        if current == User.VERIFICATION_SUSPENDED:
            raise DomainError("User is already suspended")
        user.verification_status = User.VERIFICATION_SUSPENDED
        user.rejection_reason = rejection_reason
        user.is_active = False

    elif normalized == "unsuspend":
        # Explicit unsuspend flow for suspended users. Does not require a reason.
        if current != User.VERIFICATION_SUSPENDED:
            raise DomainError("Only suspended users can be unsuspended")
        note = rejection_reason.strip() or "Admin unsuspended user"
        before_state = {
            "verification_status": current,
            "is_active": user.is_active,
            "rejection_reason": user.rejection_reason,
        }
        user.verification_status = User.VERIFICATION_VERIFIED
        user.rejection_reason = ""
        user.is_active = True
        user.save(
            update_fields=[
                "verification_status",
                "rejection_reason",
                "is_verified",
                "is_active",
            ]
        )

        # Create an audit record for the unsuspend action
        payload = {
            "actor_id": getattr(actor, "id", None),
            "action_type": "unsuspend",
            "entity_type": "user",
            "entity_id": user.id,
            "before_state": before_state,
            "after_state": {
                "verification_status": user.verification_status,
                "is_active": user.is_active,
                "rejection_reason": user.rejection_reason,
            },
            "reason": note,
        }
        FinancialAuditLog.objects.create(
            actor=actor,
            action_type="unsuspend",
            entity_type="user",
            entity_id=user.id,
            before_state=before_state,
            after_state={
                "verification_status": user.verification_status,
                "is_active": user.is_active,
                "rejection_reason": user.rejection_reason,
            },
            reason=note,
            hash_chain=_build_hash_chain(payload),
        )
        return user

    user.save(
        update_fields=[
            "verification_status",
            "rejection_reason",
            "is_verified",
            "is_active",
        ]
    )
    return user


@transaction.atomic
def update_platform_fee(pct: int, actor: User) -> PlatformSetting:
    if pct < 0 or pct > 30:
        raise DomainError("Platform fee must be between 0 and 30.")

    setting = PlatformSetting.get_solo()
    before_state = {
        "platform_fee_pct": setting.platform_fee_pct,
        "partial_escrow_mode": setting.partial_escrow_mode,
    }
    setting.platform_fee_pct = pct
    setting.save(update_fields=["platform_fee_pct"])

    payload = {
        "actor_id": actor.id,
        "action_type": FinancialAuditLog.ACTION_COMMISSION_UPDATE,
        "entity_type": FinancialAuditLog.ENTITY_COMMISSION,
        "entity_id": setting.id,
        "before_state": before_state,
        "after_state": {
            "platform_fee_pct": setting.platform_fee_pct,
            "partial_escrow_mode": setting.partial_escrow_mode,
        },
        "reason": "Admin updated commission policy",
    }
    FinancialAuditLog.objects.create(
        actor=actor,
        action_type=FinancialAuditLog.ACTION_COMMISSION_UPDATE,
        entity_type=FinancialAuditLog.ENTITY_COMMISSION,
        entity_id=setting.id,
        before_state=before_state,
        after_state={
            "platform_fee_pct": setting.platform_fee_pct,
            "partial_escrow_mode": setting.partial_escrow_mode,
        },
        reason="Admin updated commission policy",
        hash_chain=_build_hash_chain(payload),
    )
    return setting


def resolve_project_dispute(
    dispute: Dispute,
    action: str,
    release_amount: int,
    refund_amount: int,
    note: str,
    resolver: User,
):
    return resolve_dispute(
        dispute, action, release_amount, refund_amount, note, resolver
    )
