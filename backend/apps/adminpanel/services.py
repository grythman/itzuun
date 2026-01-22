"""Admin services."""
from django.db import transaction

from apps.accounts.models import User
from apps.payments.models import Dispute
from apps.payments.services import resolve_dispute
from backend.common.models import PlatformSetting


@transaction.atomic
def verify_user(user: User) -> User:
    user.is_verified = True
    user.save(update_fields=["is_verified"])
    return user


@transaction.atomic
def update_platform_fee(pct: int) -> PlatformSetting:
    setting = PlatformSetting.get_solo()
    setting.platform_fee_pct = pct
    setting.save(update_fields=["platform_fee_pct"])
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
