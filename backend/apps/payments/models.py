"""Payments and escrow models."""
from django.conf import settings
from django.db import models

from apps.projects.models import Project


class Escrow(models.Model):
    STATUS_PENDING_ADMIN = "pending_admin"
    STATUS_HELD = "held"
    STATUS_RELEASED = "released"
    STATUS_REFUNDED = "refunded"
    STATUS_DISPUTED = "disputed"

    STATUS_CHOICES = (
        (STATUS_PENDING_ADMIN, "Pending admin"),
        (STATUS_HELD, "Held"),
        (STATUS_RELEASED, "Released"),
        (STATUS_REFUNDED, "Refunded"),
        (STATUS_DISPUTED, "Disputed"),
    )

    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="escrow")
    amount = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_PENDING_ADMIN)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class LedgerEntry(models.Model):
    TYPE_DEPOSIT = "deposit"
    TYPE_RELEASE = "release"
    TYPE_REFUND = "refund"
    TYPE_FEE = "fee"

    TYPE_CHOICES = (
        (TYPE_DEPOSIT, "Deposit"),
        (TYPE_RELEASE, "Release"),
        (TYPE_REFUND, "Refund"),
        (TYPE_FEE, "Fee"),
    )

    escrow = models.ForeignKey(Escrow, on_delete=models.CASCADE, related_name="ledger_entries")
    entry_type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    amount = models.PositiveIntegerField()
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Dispute(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="disputes")
    raised_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="disputes")
    reason = models.TextField()
    evidence_files = models.JSONField(default=list)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="resolved_disputes"
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
