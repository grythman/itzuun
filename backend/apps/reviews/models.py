"""Reviews models."""
from django.conf import settings
from django.db import models
from django.db.models import Q

from apps.projects.models import Project


class Review(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="reviews")
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews_given")
    reviewee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews_received")
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["project", "reviewer"], name="uq_review_project_reviewer"),
            models.CheckConstraint(check=Q(rating__gte=1) & Q(rating__lte=5), name="ck_review_rating_1_5"),
        ]
        indexes = [
            models.Index(fields=["reviewee", "-created_at"], name="idx_review_reviewee_created"),
        ]
