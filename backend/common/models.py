"""Common models."""
from django.db import models


class PlatformSetting(models.Model):
    platform_fee_pct = models.PositiveSmallIntegerField(default=12)
    partial_escrow_mode = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(platform_fee_pct__gte=0) & models.Q(platform_fee_pct__lte=30),
                name="valid_fee_bounds",
            ),
        ]

    @classmethod
    def get_solo(cls):
        setting, _created = cls.objects.get_or_create(id=1)
        return setting
