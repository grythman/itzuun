"""Profile model."""
from django.conf import settings
from django.db import models


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    full_name = models.CharField(max_length=255, blank=True)
    title = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    skills = models.JSONField(default=list)
    hourly_rate = models.PositiveIntegerField(default=0)
    portfolio = models.JSONField(default=list, blank=True)
    is_available = models.BooleanField(default=True)
    response_time_hours = models.PositiveSmallIntegerField(null=True, blank=True)
    last_active = models.DateTimeField(auto_now=True)

    @property
    def profile_completeness(self) -> int:
        score = 0
        if self.full_name:
            score += 20
        if self.bio:
            score += 20
        if self.title:
            score += 10
        if self.skills and len(self.skills) > 0:
            score += 20
        if self.hourly_rate > 0:
            score += 10
        if self.portfolio and len(self.portfolio) > 0:
            score += 10
        if self.is_available:
            score += 5
        if self.response_time_hours is not None:
            score += 5
        return min(100, score)
