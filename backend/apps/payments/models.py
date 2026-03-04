"""Payments and escrow models."""
import uuid

from django.core.exceptions import ValidationError
from django.conf import settings
from django.db import models
from django.db.models import Q

from apps.projects.models import Project


class Escrow(models.Model):
    STATUS_CREATED = "created"
    STATUS_PENDING_ADMIN = STATUS_CREATED
    STATUS_HELD = "held"
    STATUS_RELEASED = "released"
    STATUS_REFUNDED = "refunded"
    STATUS_DISPUTED = "disputed"

    STATUS_CHOICES = (
        (STATUS_CREATED, "Created"),
        (STATUS_HELD, "Held"),
        (STATUS_RELEASED, "Released"),
        (STATUS_REFUNDED, "Refunded"),
        (STATUS_DISPUTED, "Disputed"),
    )

    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="escrow")
    amount = models.PositiveIntegerField(default=0)
    platform_fee_amount = models.PositiveIntegerField(default=0)
    freelancer_amount = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_CREATED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(check=Q(amount__gte=0), name="ck_escrow_amount_non_negative"),
        ]
        indexes = [
            models.Index(fields=["status", "-updated_at"], name="idx_escrow_status_updated"),
            models.Index(fields=["status", "project"], name="idx_escrow_status_project"),
            models.Index(fields=["project", "status", "-created_at"], name="idx_escrow_proj_stat_created"),
        ]


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


class Payment(models.Model):
    STATUS_PENDING = "pending"
    STATUS_PAID = "paid"
    STATUS_FAILED = "failed"

    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_PAID, "Paid"),
        (STATUS_FAILED, "Failed"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="payments")
    invoice_id = models.CharField(max_length=128, unique=True)
    amount = models.PositiveIntegerField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    raw_response = models.JSONField(default=dict)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["project", "status", "-created_at"], name="idx_pay_proj_status_cr"),
            models.Index(fields=["status", "-created_at"], name="idx_payment_status_created"),
        ]


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

    class Meta:
        indexes = [
            models.Index(fields=["project", "-created_at"], name="idx_dispute_project_created"),
        ]


class IdempotencyKey(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="idempotency_keys")
    endpoint = models.CharField(max_length=128)
    key = models.CharField(max_length=128)
    response_hash = models.CharField(max_length=64)
    response_body = models.JSONField(default=dict)
    status_code = models.PositiveSmallIntegerField(default=200)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["actor", "endpoint", "key"], name="uq_idempotency_actor_ep_key"),
        ]
        indexes = [
            models.Index(fields=["endpoint", "created_at"], name="idx_idempo_endpoint_created"),
        ]


class FinancialAuditLog(models.Model):
    ENTITY_ESCROW = "escrow"
    ENTITY_DISPUTE = "dispute"
    ENTITY_COMMISSION = "commission"

    ACTION_DEPOSIT = "deposit"
    ACTION_APPROVE = "approve"
    ACTION_RELEASE = "release"
    ACTION_REFUND = "refund"
    ACTION_DISPUTE = "dispute"
    ACTION_COMMISSION_UPDATE = "commission_update"

    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action_type = models.CharField(max_length=40)
    entity_type = models.CharField(max_length=24)
    entity_id = models.PositiveBigIntegerField()
    before_state = models.JSONField(default=dict)
    after_state = models.JSONField(default=dict)
    reason = models.TextField(blank=True)
    hash_chain = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["entity_type", "entity_id", "-created_at"], name="idx_fin_audit_entity_created"),
        ]

    def save(self, *args, **kwargs):
        if self.pk is not None:
            raise ValidationError("FinancialAuditLog is immutable and cannot be updated.")
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("FinancialAuditLog is immutable and cannot be deleted.")
