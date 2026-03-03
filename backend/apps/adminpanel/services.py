"""Admin services."""
from django.db import transaction

from apps.accounts.models import User
from apps.payments.models import Dispute, FinancialAuditLog
from apps.payments.services import resolve_dispute
from apps.payments.services import _build_hash_chain
from common.exceptions import DomainError
from common.models import PlatformSetting


@transaction.atomic
def verify_user(user: User) -> User:
    user.is_verified = True
    user.save(update_fields=["is_verified"])
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
    return resolve_dispute(dispute, action, release_amount, refund_amount, note, resolver)
