"""Payments serializers."""
from rest_framework import serializers

from .models import Dispute, Escrow, LedgerEntry


class EscrowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Escrow
        fields = ("id", "project", "amount", "status")
        read_only_fields = ("id", "project", "status")


class LedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerEntry
        fields = ("id", "escrow", "entry_type", "amount", "note", "created_at")
        read_only_fields = ("id", "escrow", "created_at")


class DisputeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dispute
        fields = (
            "id",
            "project",
            "raised_by",
            "reason",
            "evidence_files",
            "resolved_by",
            "resolved_at",
            "note",
        )
        read_only_fields = ("id", "project", "raised_by", "resolved_by", "resolved_at")
