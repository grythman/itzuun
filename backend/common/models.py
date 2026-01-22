"""Common models."""
from django.db import models


class PlatformSetting(models.Model):
    platform_fee_pct = models.PositiveSmallIntegerField(default=12)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def get_solo(cls):
        setting, _created = cls.objects.get_or_create(id=1)
        return setting
