"""Project and proposal models."""
from django.conf import settings
from django.db import models
from django.db.models import Q


class Project(models.Model):
    STATUS_OPEN = "open"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_AWAITING_REVIEW = "awaiting_client_review"
    STATUS_COMPLETED = "completed"
    STATUS_CLOSED_REFUNDED = "closed_refunded"
    STATUS_DISPUTED = "disputed"

    STATUS_CHOICES = (
        (STATUS_OPEN, "Open"),
        (STATUS_IN_PROGRESS, "In progress"),
        (STATUS_AWAITING_REVIEW, "Awaiting review"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_CLOSED_REFUNDED, "Closed refunded"),
        (STATUS_DISPUTED, "Disputed"),
    )

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="projects")
    title = models.CharField(max_length=255)
    description = models.TextField()
    budget = models.PositiveIntegerField()
    timeline_days = models.PositiveIntegerField()
    category = models.CharField(max_length=64)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_OPEN)
    selected_proposal = models.ForeignKey(
        "Proposal", null=True, blank=True, on_delete=models.SET_NULL, related_name="selected_for"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=Q(status__in=[
                    "open",
                    "in_progress",
                    "awaiting_review",
                    "completed",
                    "closed_refunded",
                    "disputed",
                ]),
                name="ck_project_valid_status",
            ),
        ]
        indexes = [
            models.Index(fields=["status", "category", "-created_at"], name="idx_project_status_cat_created"),
        ]


class Proposal(models.Model):
    STATUS_PENDING = "pending"
    STATUS_WITHDRAWN = "withdrawn"
    STATUS_ACCEPTED = "accepted"
    STATUS_REJECTED = "rejected"

    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_WITHDRAWN, "Withdrawn"),
        (STATUS_ACCEPTED, "Accepted"),
        (STATUS_REJECTED, "Rejected"),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="proposals")
    freelancer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="proposals"
    )
    price = models.PositiveIntegerField()
    timeline_days = models.PositiveIntegerField()
    message = models.TextField(blank=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["project", "freelancer"], name="uq_proposal_project_freelancer"),
        ]
        indexes = [
            models.Index(fields=["project", "status", "-created_at"], name="idx_prop_proj_status_created"),
        ]
