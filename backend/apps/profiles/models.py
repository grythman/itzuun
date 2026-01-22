"""Profile model."""
from django.conf import settings
from django.db import models


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    full_name = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    skills = models.JSONField(default=list)
    hourly_rate = models.PositiveIntegerField(default=0)
