"""Payments serializers."""

from rest_framework import serializers

from .models import Dispute, Escrow, FinancialAuditLog, LedgerEntry, Payment


class EscrowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Escrow
        fields = (
            "id",
            "project",
            "amount",
            "platform_fee_amount",
            "freelancer_amount",
            "status",
        )
        read_only_fields = ("id", "project", "status")


class LedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerEntry
        fields = ("id", "escrow", "entry_type", "amount", "note", "created_at")
        read_only_fields = ("id", "escrow", "created_at")


class DisputeSerializer(serializers.ModelSerializer):
    escrow_amount = serializers.SerializerMethodField()

    class Meta:
        model = Dispute
        fields = (
            "id",
            "project",
            "escrow_amount",
            "raised_by",
            "reason",
            "evidence_files",
            "resolved_by",
            "resolved_at",
            "note",
        )
        read_only_fields = ("id", "project", "raised_by", "resolved_by", "resolved_at")

    def get_escrow_amount(self, obj: Dispute):
        escrow = getattr(obj.project, "escrow", None)
        return getattr(escrow, "amount", 0)


class PaymentSerializer(serializers.ModelSerializer):
    escrow_status = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = (
            "id",
            "project",
            "invoice_id",
            "amount",
            "status",
            "raw_response",
            "created_at",
            "paid_at",
            "escrow_status",
        )
        read_only_fields = fields

    def get_escrow_status(self, obj: Payment):
        escrow = getattr(obj.project, "escrow", None)
        return getattr(escrow, "status", None)


class PaymentCreateSerializer(serializers.Serializer):
    project_id = serializers.IntegerField(min_value=1)


class FinancialAuditLogSerializer(serializers.ModelSerializer):
    actor_id = serializers.IntegerField(source="actor.id", read_only=True)

    class Meta:
        model = FinancialAuditLog
        fields = (
            "id",
            "actor_id",
            "action_type",
            "entity_type",
            "entity_id",
            "reason",
            "before_state",
            "after_state",
            "created_at",
        )
        read_only_fields = fields
